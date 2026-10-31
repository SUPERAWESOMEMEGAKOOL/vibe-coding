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
- Filter by topic, subtopic, difficulty, source, or question type; search concepts and source years.
- Click a Physics MCQ option for instant correct/incorrect feedback. Retry or open **Answer & explanation** for the worked solution and marking points.
- Save questions for later, or add them to a custom practice paper.
- Track mistakes in the topic-grouped **Mistake notebook**, add reflections, and use **Feedback** to decide what to revisit next.
- Review your paper, reorder or remove questions, and save it under **My papers**.
- Print the question paper and mark scheme separately. Choose **Save as PDF** in the browser print dialog for PDF files. JSON export includes the question data and answers.
- Use **Source library** to keep question-paper and mark-scheme PDFs, open them, and download them again.

## Question sources and syllabus scope

The starter bank contains **30 original practice questions**, 15 per subject. They are **not official IB past-paper questions**. Each is labelled as original, with an indicative rather than official mark scheme. No official past-paper collection has been downloaded or indexed.

The topic map uses Math AA's five topic areas (first assessment 2021) and Physics themes A–E (first assessment 2025). Math questions are structured; Physics includes Paper 1A-style MCQs and Paper 2-style structured questions. The guide lists selected subtopics, not every syllabus statement. Confirm full assessment and syllabus requirements against IB's current course documents.

For source-attributed past-paper imports, Math exam years must be 2021–2026 and Physics years 2025–2026. Older questions need individual compatibility review and adaptation rather than being treated as current-syllabus papers.

The source library links to IB's sample-paper and curriculum pages and provides prefilled web searches. **These external pages were not retrievable in the current cloud instance**, whose network policy blocked IB and Google. Links are external resource entry points, not verified or indexed papers. Domain additions for `ibo.org`, `www.ibo.org`, and `www.google.com` were saved in the environment configuration draft; they require review, saving, and publication in environment settings. Saving the draft does not activate access in the running machine.

## Adding actual past-paper questions

Use **Add questions → Add a question** to enter the question, subject, topic, subtopic, options if applicable, correct answer, explanation, and marking points. Include the exam year, source description, and optional HTTPS links to the original question paper and mark scheme. Use materials you have permission to use.

For bulk entry, use **Import a question bank**, download the example JSON template, and upload or paste your completed question bank. It accepts an array or `{ "questions": [...] }`. Imports are validated atomically, limited to 500 questions and a 5 MB file; marking-point marks must add up to the total, and source URLs must use HTTPS. Identical question text in the same subject and topic is deduplicated.

Math notation uses inline `$...$` or display `$$...$$` LaTeX, rendered locally with KaTeX. HTML is displayed as text, and trusted KaTeX commands are disabled.

**PDF uploads are reference documents**. They are not OCRed, automatically split into individual questions, automatically topic-classified, or attached as diagrams to question text. Use the entry form or structured JSON import to add individual searchable questions. Files must be PDFs smaller than 25 MB. Keep original PDFs for reference diagrams not represented in the text bank.

## Storage and privacy

### Mistakes and feedback

MCQ choices are logged automatically. For structured questions, compare your working with the mark scheme, then choose **Got it right** or **Needs practice** below the explanation. These results are explicitly self-checked; the app does not grade written working automatically.

Every logged attempt is retained. Retrying a question resets its answer controls but keeps its earlier mistakes. A correct latest attempt changes the notebook status to **Improving**; a later incorrect result moves it back to **Needs practice**. The notebook groups questions by syllabus topic, with topic/status filters and sorting by syllabus order, most missed, or most recent. Add a mistake reason and a note for your future self, or export the learning log as JSON.

**Feedback** shows topic accuracy, unresolved questions, correct results after mistakes, and suggested review sessions based on those records and your reflection tags. Subject data is kept separate. Overall topic accuracy includes retries; **first-try accuracy** uses only each question’s first recorded attempt. After ten recorded attempts, the trend compares the last five results with the five before them. Unattempted topics have no accuracy score. Small samples are labelled as early signals.

The previous version stored only the most recent MCQ result. On first use of this version, any such saved result becomes one historical event with an unknown date. Previously overwritten retries cannot be recovered. Existing bookmarks, question banks, PDFs, and papers are preserved.

This app has no backend or accounts. Questions, bookmarks, MCQ attempts, paper selections, and saved papers use browser `localStorage`; source PDFs use `IndexedDB`. Data stays in the current browser and does not sync to another device. Clearing site data removes it. Export important papers as JSON or PDF and keep original PDF copies. **Export my full question bank** is available from the workspace help dialog.

Fonts, math rendering, and application assets are bundled locally. Only deliberately opened external source/search links use third-party sites. No API keys are required.

## Project layout

- `src/data/` — syllabus navigation and original questions
- `src/components/` — question, import, paper, source-library, and print interfaces
- `src/lib/` — filtering, validation, JSON export, storage, and PDF persistence
- `tests/` — unit and browser workflow tests

Built with React, TypeScript, Vite, KaTeX, and Lucide icons. Run `npm run preview` to serve the production build after `npm run build`.

## GitHub Pages deployment

The app uses relative asset paths so it can run under the repository path `/vibe-coding/`.

```sh
npm run deploy:pages
```

This builds the app and uploads **only the static build** to the repository's `gh-pages` branch. It uses the existing Git authentication, keeps any existing branch history, and never force-pushes. Temporary staging files are kept outside the checkout and cleaned up afterward. Personal browser progress and uploaded PDFs are not part of the deployment.

Enable GitHub Pages once under the repository's **Settings → Pages**: select **Deploy from a branch**, branch **gh-pages**, folder **/ (root)**, then save. The expected site address, after GitHub completes deployment, is `https://superawesomemegakool.github.io/vibe-coding/`. Creating the branch does not by itself confirm that the site is enabled or live. For subsequent updates, push source changes and run `npm run deploy:pages` again.
