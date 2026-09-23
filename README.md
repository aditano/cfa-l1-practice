# L1 Practice

Original CFA Level I practice questions, organized with the public 2026 curriculum map. The live site is [https://aditano.github.io/cfa-l1-practice/](https://aditano.github.io/cfa-l1-practice/).

Not affiliated with CFA Institute. For educational practice only. CFA®, Chartered Financial Analyst®, and GIPS® are trademarks owned by CFA Institute. The questions on this site are original instructional items. They are not CFA Institute exam questions, and they are not copied from a third-party question bank.

## Question bank (version 2026.1)

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

Topic weights are the 2026 ranges published on the [CFA Institute Level I exam page](https://www.cfainstitute.org/programs/cfa-program/candidate-resources/level-i-exam). Module titles follow the [2026 Level I topic outlines](https://www.cfainstitute.org/sites/default/files/docs/programs/cfa-program/2026-l1-topics-combined.pdf).

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

Authored drafts live in `scripts/content/`, one file per topic. `scripts/author.ts` checks stem length, three distinct choices, and Ethics standard tags, then shuffles A/B/C. `npm run generate` writes `src/data/questions/*.json` and `src/data/manifest.json`. `npm run validate` checks unique ids, unique stems, answer-key integrity, KaTeX on numeric items, Ethics standard citations, hard-topic video links, at least four items per module, and that each topic’s share of the bank sits inside its 2026 weight range.

## GitHub Pages

`.github/workflows/pages.yml` builds and deploys on every push to `main` with `actions/deploy-pages`. In the repository settings, GitHub Pages must use **GitHub Actions** as the source. The published site is a project site, so asset URLs use the `/cfa-l1-practice/` base path.
