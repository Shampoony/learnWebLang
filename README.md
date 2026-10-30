# Lingua

A responsive website for learning German and Slovak, with a Russian-language interface. Both languages start at A1.

## Getting Started

Requires Node.js 20+ (tested with Node.js 24). No external dependencies or mandatory API keys are required.

web - https://malangs.netlify.app/

```sh
cd /workspace/learnWebLang
npm run dev
```

The server listens on `0.0.0.0:3000`. To use a different port:

```sh
PORT=3001 npm run dev
```

Stop the server with Ctrl+C.

The application runs entirely on the client; the server only serves public assets. For production, use any static hosting service and deploy the following files to the site root:

`index.html`, `style.css`, `app.js`, `data.js`, `lessons-extra.js`, `exam-data.js`, `exam-ui.js`, `vocabulary.js`, `vocabulary-ui.js`, and `resources.js`.

## Features

- German and Slovak: 32 original lessons per language, with eight lessons for each level: A1, A2, B1 and B2.
- 384 vocabulary flashcards and 448 exercises, including multiple-choice questions, grammar questions and typed word answers.
- Short explanations, a 70% lesson pass threshold and retry options.
- A searchable vocabulary list with level filters and the option to add words to review.
- Active recall: see the word first, reveal its translation, then assess your answer.
- Successful review intervals of 1, 2, 4, 8, 16 and 30 days. An incorrect answer schedules another review after 10 minutes. Self-assessment is not an objective measure of knowledge.
- Progress saved in localStorage. No account, data server or cross-device synchronization. Clearing browser data deletes your progress.
- Text-to-speech through the Web Speech API when a suitable system voice is available. If the required voice is missing, the app displays a message and remains usable.
- Light and dark themes. The initial theme follows the system setting; a manual selection is saved.
- Mobile navigation, keyboard controls and a dialog with focus trapping and Escape-key dismissal.

## Personal Vocabulary

Under “My Vocabulary → Add Your Own Word,” users can add a word or phrase, its translation, language, optional A1–B2 level, example and source link. An “Unspecified” option is available for words with an unknown level. Translations are entered manually.

- Custom cards can be edited or deleted, with confirmation required for deletion. Changing a card’s word, translation or language resets its review interval; changing its note does not.
- New words are added to review by default. Users can clear the checkbox to keep a card in their personal collection without scheduling reviews. Filters distinguish all words, words scheduled for review and custom words.
- Entries with the same language, word and translation are treated as duplicates. A different meaning of the same word can be added as a separate card.
- Source links open in a new tab. Only complete HTTP(S) URLs without embedded usernames or passwords are accepted. HTML entered in words or examples is displayed as plain text.
- JSON export includes custom cards for both languages. Import merges collections, skips duplicates and adds new cards to review. It does not transfer exam attempts, lesson progress or previous review intervals. The built-in lesson vocabulary is not included in exports.
- Import accepts Lingua export files up to 2 MB or 5,000 cards. If any entry is invalid, the entire import is rejected without partial changes. If browser storage fails, changes are rolled back and the form remains open so the user can correct the issue and retry.

All data remains in the current browser’s localStorage. To transfer a collection between a computer and a phone, users must export the file and import it on the other device. There is no automatic synchronization.

## Resources for Comprehensive Learning

In “Resources and Study Methods,” select a language and level. A link to the corresponding learning path also appears at the end of each level.

All eight learning paths include target skills and four steps:

1. Main course.
2. Reinforcement and vocabulary.
3. Writing and speaking with feedback.
4. Readiness assessment.

German resources include VHS-Lernportal, Deutsche Welle’s Nicos Weg for A1–B1 and advanced materials for B2, Netzwerk neu / Aspekte neu, Grammatik aktiv, DWDS and Goethe exam preparation.

Slovak resources include Slovake.eu, E-Slovak for beginner levels, Krížom-krážom A1–B2, JÚĽŠ SAV dictionaries, STVR for authentic spoken language and ECL sample materials. For Slovak A1, the path refers to CEFR guidance rather than a nonexistent ECL A1 sample exam.

Each resource includes its purpose, suggested usage order and whether it is free or paid, with a reminder to check the current terms. Some links lead to an institution’s or publisher’s catalogue; the accompanying instructions explain what to look for at each level. Inclusion does not imply a partnership or guarantee that users will reach a particular level.

HTTP checks of external sources were blocked by the environment’s network proxy with a 403 response. Current page availability, prices and external course content have therefore not been verified. The structure of all eight learning paths, HTTP(S) link validity and internal navigation were checked.

## A1–B2 Final Practice Tests

Eight original practice tests are available at the end of the levels: four levels across two languages. All tests can be opened immediately for diagnostic practice, without being locked behind lesson progress.

Each attempt includes:

- 24 questions: eight grammar, eight vocabulary, four reading-comprehension questions based on an original text and four listening-comprehension questions based on a spoken message.
- A writing task with level-specific length guidance and separate self-assessment against four criteria.
- Speaking prompts and space for notes. The microphone is not recorded, and speaking quality is not assessed automatically.
- A timer of 30, 45, 60 or 75 minutes for A1, A2, B1 or B2, respectively. Closing the dialog or browser tab does not stop the timer. An expired attempt is finalized when the app resumes.
- Automatic saving of answers, writing and self-assessment; a history of the latest 10 attempts for each test; and TXT export of the submitted work and answer review.
- Answer review after submission. Unanswered questions receive zero points. Passing the automatically scored component requires at least 70% overall and at least 50% in each section, including completed listening tasks without opening the transcript.

Audio is generated on the device through the Web Speech API rather than played from a native-speaker recording. If a suitable voice is unavailable, a transcript is provided for practice. Opening the transcript or failing to listen to the full audio prevents the listening section from counting toward a passing result. Playback event handling was checked in a browser test using simulated voices; the quality of real voices depends on the device.

These thresholds and time limits belong to the practice tool, not to Goethe, telc, ECL or CEFR. Even a passing automatic score does not certify a language level: writing and speaking require independent assessment by a teacher. The sources page links to official Goethe and ECL sample materials. The site’s collection and materials do not reproduce an official exam.

## Content and Limitations

This is an introductory learning collection, not a complete course that takes learners to B2. Level labels indicate approximate material difficulty and do not constitute CEFR certification. The modules do not replace a full textbook, conversation practice, extensive listening or teacher feedback on written work.

The “Resources and Study Methods” page references CEFR guidance from the Council of Europe; recommended materials including Netzwerk neu, Aspekte neu, Grammatik aktiv and Krížom-krážom; Goethe-Institut, DW and Slovake.eu; and research by Roediger & Karpicke (2006) and Cepeda et al. (2006).

The exercises were written specifically for the website. They were not copied from these publications or reviewed by their authors. A larger course would require editorial review by a specialist in each language before release.

## Testing

```sh
npm test
```

Automated tests check level coverage, the validity of all 448 lesson exercises and 192 test questions, typed-answer exercises, review scheduling, exam thresholds, listening-credit restrictions and the HTTP server, including denial of access to non-public files.

Separate Chromium browser checks were performed through Playwright during development. These covered lesson completion, incorrect answers, writing exercises, persistence after reload, filters, language switching and review flashcards.

Additional checks covered all eight final practice tests, including:

- All 192 answers.
- Persistence of writing and self-assessment.
- Result downloads.
- Timer behavior and expiration.
- Attempt recovery.
- Transcript restrictions.
- Theme persistence.

Personal vocabulary checks separately covered:

- Creating, editing and deleting cards.
- Review scheduling.
- Persistence after reload.
- Transfer to a clean browser.
- Rejection of unsafe links and invalid imports.
- Text escaping.
- localStorage failure handling and retry.

All eight resource learning paths were checked at viewport widths of 320, 390, 768 and 1440 pixels in both light and dark themes.

## Project Structure

- `data.js` — Languages, modules, vocabulary, question generation and the review scheduling algorithm.
- `lessons-extra.js` — 40 additional lessons.
- `exam-data.js` — Eight final practice tests, texts, questions and scoring.
- `exam-ui.js` — Timer, drafts, results and export of submitted test work.
- `vocabulary.js` — Validation of custom cards, links, duplicates and imports.
- `vocabulary-ui.js` — Card editor, deletion, import and export.
- `resources.js` — External learning paths organized by language and level.
- `app.js` — Application screens and interactions.
- `style.css` — Responsive styles and illustrations without external images or fonts.
- `server.mjs` — Development server without third-party dependencies.
- `tests/` — Automated checks using the built-in Node.js test runner.
