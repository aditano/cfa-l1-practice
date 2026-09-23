# L1 Practice

Original CFA Level I practice questions, organized with the public 2026 curriculum map. The live site is [https://aditano.github.io/cfa-l1-practice/](https://aditano.github.io/cfa-l1-practice/).

Not affiliated with CFA Institute. For educational practice only. CFA®, Chartered Financial Analyst®, and GIPS® are trademarks owned by CFA Institute. The questions on this site are original instructional items. They are not CFA Institute exam questions, and they are not copied from a third-party question bank.

## Question bank (version 2026.2)

1,220 items. Each one has a stem, exactly three choices, one best answer, and a worked explanation. Numeric explanations include the formula. Ethics violation and compliance items name the Standard (for example I(A) or III(B)). Quant, Financial Statement Analysis, Fixed Income, Derivatives, and Portfolio Management items include a short primer and a public lesson video.

| Topic | Questions | 2026 exam weight | Share of bank |
| --- | ---: | --- | ---: |
| Ethical and Professional Standards | 210 | 15–20% | 17.2% |
| Quantitative Methods | 100 | 6–9% | 8.2% |
| Economics | 85 | 6–9% | 7.0% |
| Financial Statement Analysis | 150 | 11–14% | 12.3% |
| Corporate Issuers | 80 | 6–9% | 6.6% |
| Equity Investments | 145 | 11–14% | 11.9% |
| Fixed Income | 155 | 11–14% | 12.7% |
| Derivatives | 80 | 5–8% | 6.6% |
| Alternative Investments | 100 | 7–10% | 8.2% |
| Portfolio Management | 115 | 8–12% | 9.4% |
| **Total** | **1,220** |  | **100%** |

Topic weights are the 2026 ranges published on the [CFA Institute Level I exam page](https://www.cfainstitute.org/programs/cfa-program/candidate-resources/level-i-exam). Module titles follow the [2026 Level I topic outlines](https://www.cfainstitute.org/sites/default/files/docs/programs/cfa-program/2026-l1-topics-combined.pdf). Every item is tagged to one of those modules. `npm run validate` requires at least four items on each module.

## Mock exam

The home page opens a two-session mock that follows the Level I format published on the CFA Institute exam page:

- 180 original multiple-choice items, three choices each.
- Session 1 and session 2 are 90 items and 135:00 each. The break between them is optional and does not run the clock.
- Session 1: Ethical and Professional Standards, Quantitative Methods, Economics, Financial Statement Analysis, Corporate Issuers.
- Session 2: Equity Investments, Fixed Income, Derivatives, Alternative Investments, Portfolio Management.
- No answers or explanations until both sessions are submitted. You can flag items and move around with the question list. A refresh keeps the session and the countdown (`localStorage`).

Question counts are integers inside the 2026 weight ranges and sum to 90 in each session:

| Session | Topic | Mock items | Share of 180 | 2026 weight |
| --- | --- | ---: | ---: | --- |
| 1 | Ethical and Professional Standards | 30 | 16.7% | 15–20% |
| 1 | Quantitative Methods | 13 | 7.2% | 6–9% |
| 1 | Economics | 13 | 7.2% | 6–9% |
| 1 | Financial Statement Analysis | 21 | 11.7% | 11–14% |
| 1 | Corporate Issuers | 13 | 7.2% | 6–9% |
| 2 | Equity Investments | 23 | 12.8% | 11–14% |
| 2 | Fixed Income | 22 | 12.2% | 11–14% |
| 2 | Derivatives | 12 | 6.7% | 5–8% |
| 2 | Alternative Investments | 15 | 8.3% | 7–10% |
| 2 | Portfolio Management | 18 | 10.0% | 8–12% |

The draw is without replacement, in that topic order, shuffled inside each topic. Every topic in the bank has more items than its mock count. If a topic were ever short, the session would still be filled to 90 from the other topics in that session, and the screen would say so.

## Item-writing rules

Stems use a CFA-style qualifier (`most likely`, `least likely`, `best described`, `most appropriate`, `most accurate`, `closest to`) where the stem is a “which” question. Sentence-completion stems stay in that form. Items do not use “all of the above,” “none of the above,” “A and B only,” “true or false,” or “except.”

Choices that are sentences are ordered shortest to longest. Choices that are numbers are ordered smallest to largest. That ordering is not a key: a length tell is a keyed choice at least 20 characters and 20% longer than both distractors. Validate fails if more than 8% of prose items are length tells, or if the keyed choice is strictly the longest string on fewer than 24% or more than 40% of all items. The generator trims explanatory tails (the reason stays in the explanation) and lengthens a distractor only when a trim would cut the claim. The same short tails are also placed on some keyed choices so the tail is not a wrong-answer mark.

Distractors are written as neighboring mistakes: an adjacent standard, the other waterfall, the wrong periodicity, a flipped sign, or a ratio with the accounts swapped. They are not “all/none of the above” filler.

No CFA Institute question text, choices, or explanations are stored in this repo. The public Level I exam page was used for format, topic order, weights, and item-structure conventions only.

## Run locally

Requires Node.js 22 or newer.

```bash
npm ci
npm run dev
```

Open the URL Vite prints. The app is a static client. Scores stay in the browser. There is no account.

```bash
npm test
npm run build
npm run preview
```

`npm run build` validates the bank, typechecks, and writes `dist/` with base path `/cfa-l1-practice/`.

## How the bank is maintained

Authored drafts live in `scripts/content/`, one file per topic. `scripts/author.ts` checks stem length, three distinct choices, and Ethics standard tags, then balances choice length and orders A/B/C. `npm run generate` writes `src/data/questions/*.json` and `src/data/manifest.json`. `npm run validate` checks unique ids, unique stems, answer-key integrity, choice-length balance, mock allocation, KaTeX on numeric items, Ethics standard citations, hard-topic video links, at least four items per module, and that each topic’s share of the bank sits inside its 2026 weight range.

## GitHub Pages

`.github/workflows/pages.yml` builds and deploys on every push to `main` with `actions/deploy-pages`. In the repository settings, GitHub Pages must use **GitHub Actions** as the source. The published site is a project site, so asset URLs use the `/cfa-l1-practice/` base path.
