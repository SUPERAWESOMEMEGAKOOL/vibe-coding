# Folio — your IB study space

A responsive study app for **IB Mathematics: Analysis & Approaches HL** and **Physics HL**, targeting the syllabuses assessed in 2026.

## Run locally

Requires Node.js 22.12+ (validated with Node.js 24.19.0) and npm.

```sh
cd /workspace/vibe-coding
npm ci
npm run dev
```

The Vite server listens on port **5173**. Use the existing isolated checkout; a separate Git worktree is not needed.

```sh
npm run build       # TypeScript + production bundle
npm test            # Question data, LaTeX rendering, filters, import validation
npm run test:e2e    # Real Chromium workflow tests
npm run format:check
```

Browser tests use `/usr/bin/chromium` in this cloud environment. Set the `executablePath` in `playwright.config.ts` for another system, or install Playwright Chromium and remove that override. Tests reuse the running development server or start one if needed. Container environments may require permission for listening sockets and browser processes.

## Study workflow

- Switch subjects using the sidebar dropdown.
- Filter by topic, subtopic, paper, time zone, difficulty, source, or question type; search concepts and exam codes.
- Click a Physics MCQ option for instant correct/incorrect feedback. Retry or open **Answer & explanation** for the worked solution and marking points.
- Save questions for later, or add them to a custom practice paper.
- Track mistakes in the topic-grouped **Mistake notebook**, add reflections, and use **Feedback** to decide what to revisit next.
- Review your paper, reorder or remove questions, and save it under **My papers**.
- Print the question paper and mark scheme separately. Choose **Save as PDF** in the browser print dialog for PDF files. JSON export includes the question data and answers.
- Use **Source library** to keep question-paper and mark-scheme PDFs, open them, and download them again.

## Question sources and syllabus scope

The production bank contains **102 real Physics HL questions from the twelve user-supplied May 2025 PDFs**. The 30 generated demo questions have been removed from the app; isolated fixtures remain under `tests/fixtures/` for testing study tools. New workspaces open Physics HL so the uploaded questions are immediately available. Existing subject preferences, custom questions, papers, and progress are retained.

| Paper    | TZ1 questions | TZ2 questions | Marks per time zone |
| -------- | ------------- | ------------- | ------------------- |
| Paper 1A | 40            | 40            | 40                  |
| Paper 1B | 3             | 2             | 20                  |
| Paper 2  | 9             | 8             | 90                  |

All 80 MCQs use answers extracted geometrically from the official supplied answer keys, including the out-of-order TZ2 question 33 entry. The 22 structured questions retain every continuation page and their corresponding official marking tables. Lossless image crops preserve the original notation, diagrams, graphs, and answer spaces. Short study explanations and reviewed topic tags supplement the original content; these explanations are clearly distinguished from official marking points. Mixed questions have additional topic tags and appear under those filters too. Difficulty is left **Unrated**, because the supplied papers do not assign it. Whole-question feedback groups attempts under the main topic and does not infer which subpart was wrong.

All six complete question papers and six mark schemes are bundled, unchanged, under `public/papers/physics/2025-may/` and available in **Source library**. Pairing was checked by exam code and session. TZ1/TZ2 labels follow the supplied filenames. `scripts/physics-2025-import-audit.json` records original PDF SHA-256 hashes, page counts, question counts, marks, and answer keys. `scripts/import-physics-papers.py` can reproduce the import with PyMuPDF and Pillow, using a local manifest mapping `1A-TZ1-Q`, `1A-TZ1-MS`, and equivalent paper/zone keys to file paths. Topic annotations are in `scripts/physics-2025-annotations.json`. No network access is needed for this import.

**Math AA HL past papers have not been supplied.** Math remains supported for imports and study tools, with the official specimens described below in the source library. No generated questions are presented as Math past papers.

The topic map uses Math AA's five topic areas (first assessment 2021) and Physics themes A–E (first assessment 2025). Math questions are structured; Physics includes Paper 1A-style MCQs and Paper 2-style structured questions. The guide lists selected subtopics, not every syllabus statement. Confirm full assessment and syllabus requirements against IB's current course documents.

For source-attributed past-paper imports, Math exam years must be 2021–2026 and Physics years 2025–2026. Older questions need individual compatibility review and adaptation rather than being treated as current-syllabus papers.

The source library retains the user-requested **https://ibresources.cc/** as an external reference link. Its catalogue has not been indexed. The uploaded Physics papers do not depend on that website being reachable.

### Verified documents available in the app

The source library now includes three **official IB Math AA HL specimen-paper/mark-scheme pairs**, with an embedded original-PDF reader and separate question-paper and mark-scheme tabs. These are authentic IB specimens for the syllabus first examined in 2021, appropriate to the 2026 syllabus. They are **not papers from actual examination sittings**, and are not presented as imported, topic-tagged questions.

The original document is served directly by [IB's public PDF](https://www.ibo.org/globalassets/new-structure/university-admission/pdfs/dp-mathematics-analysis-and-approaches-specimen-papers-en.pdf), not copied into this repository. PDF page numbers, starting from the document cover, are:

| HL paper | Question paper | Matching mark scheme |
| -------- | -------------- | -------------------- |
| Paper 1  | 3–18           | 19–34                |
| Paper 2  | 35–46          | 47–62                |
| Paper 3  | 63–67          | 68–76                |

The downloaded source was checked as a 121-page PDF, SHA-256 `442eb7c812471c7eeb66bb9e88005e035e15e92f7b84809048654f35fbede2f4`. The following sections are SL and are not used in these HL links. The reader starts at the selected section but retains the complete original document; users can open it in a new tab if their browser does not support embedded PDFs.

The Physics view contains the six actual May 2025 examination-paper pairs described above. The general local PDF upload and viewing tools remain available for additional reference documents.

IB's official subject briefs were retrieved and checked for both subjects. The source library links directly to the [Math AA brief with first assessments in 2021](https://www.ibo.org/contentassets/5895a05412144fe890312bad52b17044/subject-brief-dp-math-analysis-and-approaches-en.pdf) and the [Physics brief with first assessment in 2025](https://www.ibo.org/globalassets/new-structure/recognition/pdfs/dp_sciences_physics_subject-brief_jan_2022_e.pdf). IB's separate Math AA brief for first assessment in **2029** is not the syllabus for the 2026 exam sessions. These briefs verify syllabus structure; they are not past-paper collections.

## Adding actual past-paper questions

Use **Add questions → Add a question** to enter the question, subject, topic, subtopic, options if applicable, correct answer, explanation, and marking points. Include the exam year, source description, and optional HTTPS links to the original question paper and mark scheme. Use materials you have permission to use.

For bulk entry, use **Import a question bank**, download the example JSON template, and upload or paste your completed question bank. It accepts an array or `{ "questions": [...] }`. Imports are validated atomically, limited to 500 questions and a 5 MB file; marking-point marks must add up to the total, and source URLs must use HTTPS. Identical question text in the same subject and topic is deduplicated.

Math notation uses inline `$...$` or display `$$...$$` LaTeX, rendered locally with KaTeX. HTML is displayed as text, and trusted KaTeX commands are disabled.

**Additional PDFs uploaded through the browser are reference documents**; that control does not automatically split or classify them. The twelve supplied Physics PDFs were separately imported and reviewed using the checked import script above. Use the question entry form or structured JSON import to add further searchable questions. Browser uploads must be PDFs smaller than 25 MB.

## Storage and privacy

### Mistakes and feedback

MCQ choices are logged automatically. For structured questions, compare your working with the mark scheme, then choose **Got it right** or **Needs practice** below the explanation. These results are explicitly self-checked; the app does not grade written working automatically.

Every logged attempt is retained. Retrying a question resets its answer controls but keeps its earlier mistakes. A correct latest attempt changes the notebook status to **Improving**; a later incorrect result moves it back to **Needs practice**. The notebook groups questions by syllabus topic, with topic/status filters and sorting by syllabus order, most missed, or most recent. Add a mistake reason and a note for your future self, or export the learning log as JSON.

**Feedback** shows topic accuracy, unresolved questions, correct results after mistakes, and suggested review sessions based on those records and your reflection tags. Subject data is kept separate. Overall topic accuracy includes retries; **first-try accuracy** uses only each question’s first recorded attempt. After ten recorded attempts, the trend compares the last five results with the five before them. Unattempted topics have no accuracy score. Small samples are labelled as early signals.

The previous version stored only the most recent MCQ result. On first use of this version, any such saved result becomes one historical event with an unknown date. Previously overwritten retries cannot be recovered. Existing bookmarks, question banks, PDFs, and papers are preserved.

This app has no backend or accounts. Questions, bookmarks, MCQ attempts, paper selections, and saved papers use browser `localStorage`; source PDFs use `IndexedDB`. Data stays in the current browser and does not sync to another device. Clearing site data removes it. Export important papers as JSON or PDF and keep original PDF copies. **Export my full question bank** is available from the workspace help dialog.

Fonts, math rendering, and the supplied Physics PDF/image assets are bundled locally. The Math specimen reader loads IB’s public PDF. Other external source/search links use third-party sites only when opened. No API keys are required.

## Project layout

- `src/data/` — syllabus navigation, uploaded real questions, and paper resources
- `public/papers/` — original supplied PDFs and lossless question/mark-scheme images
- `scripts/` — checked Physics import, annotations, source audit, and Pages deployment
- `src/components/` — question, import, paper, source-library, and print interfaces
- `src/lib/` — filtering, validation, JSON export, storage, and PDF persistence
- `tests/` — unit and browser workflow tests

Built with React, TypeScript, Vite, KaTeX, and Lucide icons. Run `npm run preview` to serve the production build after `npm run build`.

## GitHub Pages deployment

The app uses relative asset paths so it can run under the repository path `/vibe-coding/`.

```sh
npm run deploy:pages
```

This builds the app and uploads **only the static build** to the repository's `gh-pages` branch. It uses the existing Git authentication, keeps any existing branch history, and never force-pushes. Temporary staging files are kept outside the checkout and cleaned up afterward. Personal browser progress and additional PDFs stored in IndexedDB are not part of deployment. The twelve supplied Physics PDFs and the derived question images are intentionally included in the static app.

Enable GitHub Pages once under the repository's **Settings → Pages**: select **Deploy from a branch**, branch **gh-pages**, folder **/ (root)**, then save. The expected site address, after GitHub completes deployment, is `https://superawesomemegakool.github.io/vibe-coding/`. Creating the branch does not by itself confirm that the site is enabled or live. For subsequent updates, push source changes and run `npm run deploy:pages` again.
