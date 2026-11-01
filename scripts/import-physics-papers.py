#!/usr/bin/env python3
"""Reproduce the checked import from the twelve user-uploaded May 2025 PDFs.

Usage: python3 scripts/import-physics-papers.py /path/to/upload-paths.json
The manifest maps 1A-TZ1-Q, 1A-TZ1-MS, etc. to the actual uploaded PDF paths.
Requires PyMuPDF and Pillow. No network access, OCR, or PDF instructions execute.
"""
import hashlib
import json
import math
import re
import shutil
import sys
from pathlib import Path

import fitz
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public/papers/physics/2025-may"
DATA = ROOT / "src/data"
ANNOTATIONS = json.loads((ROOT / "scripts/physics-2025-annotations.json").read_text())
MS_PAGES = {
    "1B-TZ1": [(4, 4), (5, 5), (6, 6)],
    "1B-TZ2": [(4, 5), (6, 7)],
    "2-TZ1": [(4, 4), (5, 5), (6, 7), (8, 8), (9, 10), (11, 12), (13, 14), (15, 18), (19, 23)],
    "2-TZ2": [(4, 5), (6, 7), (8, 9), (10, 11), (12, 12), (13, 15), (16, 17), (18, 19)],
}
TOPICS = {
    "A1": "A.1 Kinematics", "A2": "A.2 Forces and momentum",
    "A3": "A.3 Work, energy and power", "A4": "A.4 Rigid body mechanics",
    "A5": "A.5 Galilean and special relativity",
    "B1": "B.1 Thermal energy transfers", "B2": "B.2 Greenhouse effect",
    "B3": "B.3 Gas laws", "B4": "B.4 Thermodynamics", "B5": "B.5 Current and circuits",
    "C1": "C.1 Simple harmonic motion", "C2": "C.2 Wave model", "C3": "C.3 Wave phenomena",
    "C4": "C.4 Standing waves and resonance", "C5": "C.5 Doppler effect",
    "D1": "D.1 Gravitational fields", "D2": "D.2 Electric and magnetic fields",
    "D3": "D.3 Motion in electromagnetic fields", "D4": "D.4 Induction",
    "E1": "E.1 Structure of the atom", "E2": "E.2 Quantum physics", "E3": "E.3 Radioactive decay",
    "E4": "E.4 Fission", "E5": "E.5 Fusion and stars",
}
EXAM_CODES = {"1A-TZ1": "6707", "1B-TZ1": "6708", "2-TZ1": "6709",
              "1A-TZ2": "6713", "1B-TZ2": "6714", "2-TZ2": "6715"}


def emit_image(page, rect, target):
    """Rasterise the original layout, retaining graphs, symbols and answer boxes."""
    pix = page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7), clip=rect, alpha=False)
    image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    bbox = ImageChops.difference(image, Image.new("RGB", image.size, "white")).getbbox()
    if not bbox:
        raise ValueError(f"Empty question image: {target}")
    # Trim only outer whitespace, leaving an 8-pixel margin around all source content.
    x0, y0, x1, y1 = bbox
    image = image.crop((max(0, x0 - 8), max(0, y0 - 8), min(image.width, x1 + 8), min(image.height, y1 + 8)))
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, "WEBP", lossless=True, method=6)
    return {"path": target.relative_to(ROOT / "public").as_posix(), "width": image.width,
            "height": image.height, "page": page.number + 1}


def split_questions(document):
    starts = []
    for pi, page in enumerate(document):
        if pi < 2:
            continue  # User PDF includes the copyright page and exam cover.
        for word in page.get_text("words"):
            if word[0] < 65 and re.fullmatch(r"\d{1,2}\.", word[4]):
                # Isotope superscripts and radicals can extend above the question number.
                first_ink = min(w[1] for w in page.get_text("words") if w[0] >= 32 and word[1] - 12 <= w[1] <= word[1] + 2)
                starts.append((pi, first_ink, int(word[4][:-1])))
    starts.sort()
    if [s[2] for s in starts] != list(range(1, len(starts) + 1)):
        raise ValueError("Question headings are not a contiguous sequence")
    result = []
    for i, (pi, top, number) in enumerate(starts):
        end_pi, end_y, _ = starts[i + 1] if i + 1 < len(starts) else (len(document), 0, 0)
        chunks = []
        for p in range(pi, min(end_pi + 1, len(document))):
            if p == end_pi and end_y == 0:
                continue
            page = document[p]
            if "Please do not write on this page" in page.get_text():
                continue
            y0 = top - 4 if p == pi else 60
            y1 = end_y - 12 if p == end_pi else page.rect.height - 60
            if y1 <= y0:
                continue
            rect = fitz.Rect(32, y0, page.rect.width - 32, y1)
            text = page.get_text(clip=rect)
            if text.strip():
                chunks.append((p, rect, text))
        result.append((number, chunks))
    return result


def answer_keys(document):
    # TZ2 question 33's C is stored out of order in the PDF text stream.
    # Pair each table cell geometrically, never by the order of extracted text.
    words = document[-1].get_text("words")
    key = {}
    for marker in words:
        if not re.fullmatch(r"\d{1,2}\.", marker[4]):
            continue
        number = int(marker[4][:-1])
        if number > 40:
            continue
        letters = [w for w in words if w[4] in "ABCD" and len(w[4]) == 1 and 0 < w[0] - marker[0] < 90 and abs(w[1] - marker[1]) < 5]
        if len(letters) != 1:
            raise ValueError(f"Ambiguous MCQ answer cell {number}")
        key[number] = letters[0][4]
    if set(key) != set(range(1, 41)):
        raise ValueError("Expected exactly forty numbered MCQ answers")
    return key


def key_image(document, number, target):
    page = document[-1]
    marker = next(w for w in page.get_text("words") if w[4] == f"{number}.")
    # Include this number and its answer only; adjacent answer columns remain hidden.
    rect = fitz.Rect(marker[0] - 5, marker[1] - 4, marker[0] + 84, marker[3] + 5)
    return emit_image(page, rect, target)


def main():
    paths = json.loads(Path(sys.argv[1]).read_text())
    questions, papers, audit = [], [], []
    for zone in ("TZ1", "TZ2"):
        for paper in ("1A", "1B", "2"):
            label = f"{paper}-{zone}"
            qp, ms = Path(paths[f"{label}-Q"]), Path(paths[f"{label}-MS"])
            qdoc, mdoc = fitz.open(qp), fitz.open(ms)
            code = EXAM_CODES[label]
            cover = qdoc[1].get_text()
            if not re.search(rf"2225\s*[–-]\s*{code}", cover):
                raise ValueError(f"Wrong question paper code: {label}")
            if not re.search(rf"2225\s*[–-]\s*{code}M", mdoc[0].get_text()):
                raise ValueError(f"Question paper/mark scheme mismatch: {label}")
            if "2025" not in cover or "May 2025" not in " ".join(mdoc[0].get_text().split()):
                raise ValueError(f"Unverified session: {label}")
            folder = OUTPUT / zone.lower()
            folder.mkdir(parents=True, exist_ok=True)
            qfile, mfile = folder / f"paper-{paper.lower()}.pdf", folder / f"paper-{paper.lower()}-markscheme.pdf"
            shutil.copyfile(qp, qfile)
            shutil.copyfile(ms, mfile)
            qpath, mpath = [p.relative_to(ROOT / "public").as_posix() for p in (qfile, mfile)]
            groups = split_questions(qdoc)
            if len(groups) != len(ANNOTATIONS[label]):
                raise ValueError(f"Annotation count mismatch: {label}")
            keys = answer_keys(mdoc) if paper == "1A" else None
            total_marks = 0
            for number, chunks in groups:
                annotation = ANNOTATIONS[label][number - 1]
                topic, title, explanation = annotation[:3]
                secondary = annotation[3] if len(annotation) > 3 else []
                qid = f"physics-2025-may-{zone.lower()}-{paper.lower()}-q{number:02}"
                images = [emit_image(qdoc[pi], rect, folder / "questions" / f"{paper.lower()}-q{number:02}-p{pi + 1}.webp") for pi, rect, _ in chunks]
                text = "\n".join(chunk[2] for chunk in chunks)
                marks = 1 if keys else sum(int(m) for m in re.findall(r"\[\s*(\d+)\s*\]", text))
                if marks < 1:
                    raise ValueError(f"Missing marks: {qid}")
                total_marks += marks
                if keys:
                    ms_images = [key_image(mdoc, number, folder / "markschemes" / f"1a-q{number:02}.webp")]
                    answer = f"{keys[number]} — official answer from the supplied May 2025 mark scheme."
                    steps = [{"text": f"Select option {keys[number]} (official answer key).", "marks": 1}]
                    ms_page = len(mdoc)
                else:
                    first, last = MS_PAGES[label][number - 1]
                    ms_images = [emit_image(mdoc[pi], fitz.Rect(30, 60, mdoc[pi].rect.width - 25, mdoc[pi].rect.height - 30), folder / "markschemes" / f"{paper.lower()}-q{number:02}-p{pi + 1}.webp") for pi in range(first - 1, last)]
                    answer = "The official answers and marking points for every subpart are reproduced below."
                    steps, ms_page = [], first
                q = {
                    "id": qid, "subject": "physics", "topicId": f"p{topic[0]}", "subtopic": TOPICS[topic],
                    "type": "mcq" if keys else "structured", "difficulty": "Unrated", "marks": marks,
                    "minutes": 2 if keys else math.ceil(marks * (2 if paper == "1B" else 5 / 3)),
                    "paper": f"Paper {paper}", "prompt": title, "answer": answer, "explanation": explanation,
                    "steps": steps, "source": "past-paper", "sourceName": f"May 2025 · Physics HL · {zone} · Q{number}",
                    "year": 2025, "examSession": "May 2025", "timeZone": zone, "examCode": f"2225-{code}",
                    "originalQuestionNumber": number, "questionImages": images, "markSchemeImages": ms_images,
                    "questionDocument": {"path": qpath, "page": images[0]["page"]},
                    "markSchemeDocument": {"path": mpath, "page": ms_page},
                    "additionalTopics": [{"topicId": f"p{t[0]}", "subtopic": TOPICS[t]} for t in secondary],
                }
                if keys:
                    q.update({"options": ["Option A", "Option B", "Option C", "Option D"], "correctOption": "ABCD".index(keys[number])})
                questions.append(q)
            expected = {"1A": 40, "1B": 20, "2": 90}[paper]
            if total_marks != expected:
                raise ValueError(f"Marks {total_marks} do not match {expected}: {label}")
            papers.append({
                "id": f"physics-2025-may-{zone.lower()}-{paper.lower()}",
                "subject": "physics", "paper": f"Paper {paper}", "kind": "past-paper",
                "syllabusFirstAssessment": 2025, "publisher": "IB · supplied PDFs",
                "sourcePage": qpath, "pdfUrl": qpath, "pdfPages": len(qdoc), "markSchemePdfUrl": mpath,
                "markSchemePdfPages": len(mdoc), "questions": {"firstPage": 2, "lastPage": len(qdoc)},
                "markScheme": {"firstPage": 1, "lastPage": len(mdoc)}, "verifiedOn": "2026-11-01",
                "year": 2025, "examSession": "May 2025", "timeZone": zone, "uploaded": True,
                "questionCount": len(groups), "marks": total_marks, "examCode": f"2225-{code}",
            })
            audit.append({"paper": label, "questionCount": len(groups), "marks": total_marks,
                          "examCode": f"2225-{code}", "questionPages": len(qdoc), "markSchemePages": len(mdoc),
                          "questionSha256": hashlib.sha256(qp.read_bytes()).hexdigest(),
                          "markSchemeSha256": hashlib.sha256(ms.read_bytes()).hexdigest(),
                          "answerKey": keys})
    (DATA / "uploadedPhysics.json").write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n")
    (DATA / "uploadedPaperResources.json").write_text(json.dumps(papers, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "scripts/physics-2025-import-audit.json").write_text(json.dumps(audit, indent=2) + "\n")
    print(f"Imported {len(questions)} questions, {sum(q['marks'] for q in questions)} marks, {len(papers)} paired papers.")


if __name__ == "__main__":
    main()
