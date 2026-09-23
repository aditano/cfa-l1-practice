import { pathToFileURL } from 'node:url'
import { exactly, finalizeTopic, numeric, q, type Draft } from '../author.ts'
import { block, inline, num, pct, usd } from '../../src/lib/format.ts'
import * as math from '../../src/lib/formulas.ts'

type Level = 'easy' | 'medium' | 'hard'

function vet(draft: Draft): Draft {
  if (/\bclosest to\b/i.test(draft.stem) && !/\\\(|\\\[/.test(draft.stem)) {
    throw new Error(`Stem missing KaTeX (${draft.losId}): ${draft.stem.slice(0, 120)}`)
  }
  if (/\bclosest to\b/i.test(draft.stem) && !/\\\(|\\\[/.test(draft.explanation)) {
    throw new Error(`Explanation missing KaTeX (${draft.losId}): ${draft.stem.slice(0, 120)}`)
  }
  return draft
}

function ask(
  losId: string,
  difficulty: Level,
  stem: string,
  correct: string,
  wrong1: string,
  wrong2: string,
  explanation: string,
): Draft {
  return vet(q('fsa', losId, difficulty, stem, correct, wrong1, wrong2, explanation))
}

function numQ(
  losId: string,
  difficulty: Level,
  stem: string,
  correct: number,
  wrong: [number, number],
  format: (value: number) => string,
  explain: (formattedCorrect: string) => string,
): Draft {
  return vet(
    numeric({
      topicId: 'fsa',
      losId,
      difficulty,
      stem,
      correct,
      wrong,
      format,
      explain,
    }),
  )
}

function money(value: number): string {
  return usd(value, 0)
}

function times(value: number): string {
  return `${num(value, 2)} times`
}

function days(value: number): string {
  return `${num(value, 1)} days`
}

function sharesText(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} shares`
}

function take(losId: string, count: number, drafts: Draft[]): Draft[] {
  const ready = exactly(losId, count, drafts)
  const levels = new Set(ready.map((draft) => draft.difficulty))
  if (levels.size < 3) throw new Error(`${losId} needs an easy/medium/hard mix`)
  return ready
}

function unique(drafts: Draft[]): Draft[] {
  const seen = new Set<string>()
  for (const draft of drafts) {
    const key = draft.stem.replace(/\s+/g, ' ').trim().toLowerCase()
    if (seen.has(key)) throw new Error(`Duplicate stem (${draft.losId}): ${key.slice(0, 160)}`)
    seen.add(key)
  }
  return drafts
}

function intro(): Draft[] {
  return [
    ask(
      'fsa-intro',
      'easy',
      'An equity analyst opens a file on privately held Northglass Ceramics to decide whether a five-year bank loan is supportable. In the financial statement analysis framework, which action is the first step?',
      'Define the objective, the audience, the form of the final report, and the time and data available.',
      'Convert every accrual balance to cash and compute a full ratio set before deciding what decision the work must support.',
      'Draft the lend-or-decline conclusion, then collect only the statements that agree with that conclusion.',
      'The framework starts by articulating the purpose and context of the analysis. Collecting data, processing it, interpreting it, communicating a conclusion, and following up all depend on that objective. A cash conversion or a verdict written before the question is set does not tell the analyst which evidence matters.',
    ),
    ask(
      'fsa-intro',
      'easy',
      'Bramble Transit’s audited financial statements include a long note on revenue policies, lease commitments, and contingencies. How should an analyst treat that note?',
      'As an integral part of the financial statements, covered by the audit opinion together with the primary statements.',
      'As marketing commentary that the auditor is prohibited from reading.',
      'As unaudited supplemental color that cannot change the meaning of a recognized number.',
      'The notes are part of the complete set of financial statements. Accounting policies, commitments, and contingencies are audited with the statements and can change how a recognized amount should be read. They are not a marketing insert and they are not outside the audit opinion.',
    ),
    ask(
      'fsa-intro',
      'medium',
      'Harbor Loom received an unmodified audit opinion. Management tells a lender that the opinion means every account is exact and that the company will remain a going concern for five years. Which statement is most accurate?',
      'The opinion says the statements are fairly presented in all material respects; it is not a guarantee of precision or of future survival.',
      'An unmodified opinion certifies that no misstatement, material or immaterial, remains anywhere in the file.',
      'An unmodified opinion is the auditor’s forecast that the firm will not breach a covenant over the next five years.',
      'An unmodified opinion, also called unqualified in US practice, gives reasonable assurance of fair presentation. It is not absolute assurance, not a line-by-line certification, and not a forecast. A going-concern uncertainty that is adequately disclosed can be highlighted in a separate section while the opinion on fair presentation stays unmodified.',
    ),
    ask(
      'fsa-intro',
      'hard',
      'The auditor of Quill & Copper Press finds a misstatement that is material and pervasive, and management refuses to correct it. Which report is appropriate?',
      'An adverse opinion, because the statements as a whole are not fairly presented.',
      'A qualified opinion, which is the label used when a misstatement is both material and pervasive.',
      'A disclaimer of opinion, which is the standard response to a known pervasive misstatement that management will not correct.',
      'A qualified opinion fits a material problem that is not pervasive, and the report says “except for.” An adverse opinion fits a misstatement so pervasive that the statements are not fairly presented. A disclaimer fits a pervasive scope limitation, when the auditor cannot obtain enough evidence, rather than a known uncorrected misstatement.',
    ),
    ask(
      'fsa-intro',
      'medium',
      'Veldt Mill includes a management discussion and analysis with its annual report. What does that discussion add that the primary statements do not show by themselves?',
      'Management’s narrative on results, liquidity, capital resources, and the trends and uncertainties behind the numbers.',
      'A second set of audited statements prepared entirely on a cash basis.',
      'The auditor’s opinion on internal control, which removes the need to read the notes.',
      'MD&A explains results, liquidity, and capital resources from management’s point of view, including forward-looking context. It does not replace the statements, the notes, or the audit opinion, and it is not a cash-basis set of accounts. The analyst’s job is to test that narrative against the numbers.',
    ),
    ask(
      'fsa-intro',
      'easy',
      'Sable Courier is a US public company. An analyst wants the audited annual results, the executive pay plan, and disclosure of a plant fire that occurred after year-end. Which pairing is most accurate?',
      'Audited annual results are in the Form 10-K, executive compensation is in the proxy statement, and the fire is a candidate for a Form 8-K.',
      'Executive compensation appears only in the Form 10-Q, and material events wait for the next Form 10-K.',
      'The proxy statement contains the audited financial statements, and the Form 8-K contains only the standing dividend policy.',
      'The Form 10-K carries the audited annual financial statements. Executive pay, director elections, and related-party detail sit in the proxy statement. A material current event such as a plant fire is reported on Form 8-K rather than held for the next annual report. The Form 10-Q is the quarterly filing.',
    ),
    ask(
      'fsa-intro',
      'medium',
      'Ironleaf Packaging compares its latest Form 10-Q with the prior Form 10-K before updating a credit model. Which statement about the quarterly filing is most accurate?',
      'The 10-Q is an interim report, typically reviewed rather than fully audited, and it contains less disclosure than the annual report.',
      'The 10-Q is audited to the same standard as the 10-K and repeats the full set of annual footnotes.',
      'The 10-Q reports only a cash flow statement, because interim rules prohibit an income statement.',
      'Interim reports update the annual picture. A US quarterly filing is ordinarily reviewed, not audited, and the disclosures are thinner. It still includes condensed financial statements, including an income statement. Ratios built on a single quarter can also be pulled around by seasonality, so the analyst reads them next to the audited year.',
    ),
    ask(
      'fsa-intro',
      'hard',
      'Pinion Analytics leads its earnings release with a non-GAAP profit figure and files the Form 10-K two weeks later. How should a careful analyst use the release?',
      'Reconcile the non-GAAP figure to the GAAP statements in the filing and treat the notes and the audit opinion as the authoritative package.',
      'Use the non-GAAP figure as the only earnings number, because a later filing is not allowed to present a different profit.',
      'Ignore the Form 10-K once the share price has already reacted to the earnings release.',
      'Earnings releases often lead with management’s adjusted profit, and those adjustments can strip out costs that recur. The filed GAAP statements, the notes, and the audit opinion are the complete package. A price move on the release makes the reconciliation more useful, not less, because the market may have traded the adjusted number.',
    ),
  ]
}

function income(): Draft[] {
  const cumulativeEps = math.basicEps(500_000, 40_000, 100_000)
  const plainEps = math.basicEps(486_000, 36_000, 150_000)
  const optionIncremental = math.treasuryIncrementalShares(30_000, 20, 50)
  const optionDiluted = (750_000 - 50_000) / (250_000 + optionIncremental)
  const optionBasic = math.basicEps(750_000, 50_000, 250_000)
  const optionAllIn = (750_000 - 50_000) / (250_000 + 30_000)
  const idleIncremental = math.treasuryIncrementalShares(30_000, 55, 50)
  const idleBasic = math.basicEps(750_000, 50_000, 250_000 + idleIncremental)
  const idleForced = (750_000 - 50_000) / (250_000 + (30_000 - (30_000 * 55) / 50))
  const idleFull = (750_000 - 50_000) / 280_000
  const converted = math.convertibleDiluted(280_000, 100_000, 35_000, 25_000)
  const antidilutiveConvertible = math.convertibleDiluted(280_000, 100_000, 80_000, 10_000)
  const stockDividendWaso = 100_000 * 1.1 + 12_000 * 1.1 * (7 / 12)
  const splitWaso = 80_000 * 2 + 20_000 * 2 * (9 / 12) + 10_000 * (3 / 12)

  return [
    ask(
      'fsa-income',
      'easy',
      'Kelp & Birch Foods collects the full catering fee in December for an event it will cook and serve in January. The contract has a single performance obligation satisfied at the event. How is the December cash reported?',
      'As a contract liability, with no December revenue, because the performance obligation is still unsatisfied.',
      'As December revenue, because catering cash is earned when the customer pays.',
      'As a contra-equity deposit that bypasses both the income statement and liabilities.',
      'Under the revenue model used by both IFRS 15 and ASC 606, revenue is recognized when the performance obligation is satisfied, not when cash arrives. Cash collected before the January event creates a contract liability. Recognizing revenue in December would pull profit forward, and the deposit is not an equity contribution.',
    ),
    ask(
      'fsa-income',
      'medium',
      'Pinion Analytics has finished a distinct customization milestone for a client. It has an enforceable right to payment, but that right is conditional on the client’s acceptance of a later phase, not merely on the passage of time. What should the balance sheet show for the completed milestone?',
      'A contract asset, because performance has occurred and the right to consideration is still conditional.',
      'A receivable, because any enforceable right to cash is presented as a trade receivable.',
      'Deferred revenue, because cash has not been collected and the work is therefore unperformed.',
      'A receivable is an unconditional right to consideration; only the passage of time remains. When the right still depends on something else, such as acceptance of a later phase, the completed work sits in a contract asset. Deferred revenue would mean the customer is ahead of performance, which is the opposite of this fact pattern.',
    ),
    ask(
      'fsa-income',
      'medium',
      'Sable Courier arranges freight that an unrelated carrier performs. The carrier sets the price, bears the service risk, and pays Sable a commission. Sable never controls the freight service. How should Sable report revenue?',
      'Net, equal to the commission, because Sable is an agent.',
      'Gross, equal to the full freight price, with the carrier’s charge reported as cost of sales.',
      'As other comprehensive income, because an agency fee is not a contract with a customer.',
      'An agent that does not control the specified service before it is transferred to the customer reports revenue equal to the fee or commission it expects to keep. Grossing up the carrier’s price would inflate revenue and costs by the same amount and overstate the scale of Sable’s own performance. The commission is ordinary profit or loss, not OCI.',
    ),
    ask(
      'fsa-income',
      'medium',
      'Hearthlane Bakeries sells a cake for a stated price and gives the customer a loyalty point that can be redeemed for goods with a standalone selling price. How is the cake sale allocated?',
      'Part of the transaction price is allocated to the point and deferred until the point is redeemed or expires.',
      'The entire stated price is cake revenue on the sale date, and the point is ignored until redemption.',
      'The point is expensed at its standalone price and the cake is recognized at the full stated price, so revenue exceeds cash.',
      'A material loyalty promise is a separate performance obligation. The transaction price is allocated between the cake and the point using standalone selling prices, and the point’s share stays a contract liability until redemption or expiry. Ignoring the point overstates current revenue. Expensing the point and also keeping the full price as revenue double counts the arrangement.',
    ),
    ask(
      'fsa-income',
      'hard',
      'Marlowe Instruments sells a pump with a one-year warranty that the pump will meet the agreed specification, and it also sells an optional three-year repair plan at a standalone price. How are the two promises treated?',
      'The specification warranty is an assurance cost accrued with the sale; the optional repair plan is a separate performance obligation recognized over the coverage period.',
      'Both promises are separate performance obligations, so no warranty cost is accrued when the pump is delivered.',
      'Both promises are accrued in full as operating expense on the delivery date, and no revenue is allocated to the repair plan.',
      'An assurance-type warranty that the product meets its specification is accounted for as a cost accrual, not as revenue. A service-type warranty that the customer can buy separately is another performance obligation, and its allocated transaction price is recognized as the repair service is provided. Treating both as revenue, or both as day-one expense, misses that split.',
    ),
    ask(
      'fsa-income',
      'hard',
      'Lowtide Boatworks builds a custom hull on the customer’s site. The customer controls the hull as it is constructed and Lowtide has an enforceable right to payment for work completed to date. When is revenue recognized?',
      'Over time, as Lowtide satisfies the performance obligation, measured by progress toward completion.',
      'Only when the hull is delivered and the final invoice is paid, because construction cash is uncertain until then.',
      'When the contract is signed, because a custom hull has no alternative use and the signing date fixes the price.',
      'Revenue is recognized over time when the customer controls the asset as it is created, or when the work has no alternative use and the firm has an enforceable right to payment for performance to date. Control during construction meets that test, so Lowtide recognizes progress revenue rather than waiting for final delivery. Signing the contract does not by itself satisfy the performance obligation.',
    ),
    ask(
      'fsa-income',
      'medium',
      'A warehouse fire at Redcedar Cabinetry destroys inventory and produces a loss that is unusual for the firm. The cabinet business continues, and the warehouse is not a component being discontinued. Where does the loss belong?',
      'In profit from continuing operations. The analyst may separate it when forecasting, but it is not an extraordinary item and it is not discontinued operations.',
      'Below discontinued operations, because both IFRS and US GAAP still isolate extraordinary items net of tax.',
      'Directly in other comprehensive income, because unusual losses are excluded from net income by definition.',
      'Neither IFRS nor US GAAP still presents an extraordinary-item category. A fire loss in a continuing business stays in continuing operations. Discontinued operations are reserved for a component that has been disposed of or is held for sale. Other comprehensive income is for specified items such as certain translation and fair-value movements, not for an inventory fire.',
    ),
    ask(
      'fsa-income',
      'easy',
      'Whitecap Fisheries sells an entire coastal-processing division that meets the definition of a discontinued operation. The division earned an operating profit this year, and Whitecap also recorded a gain on the sale. How are those amounts presented?',
      'Together in discontinued operations, net of tax, and excluded from the continuing-operation subtotals used to judge the ongoing business.',
      'Inside gross profit, because the operating profit was earned before the sale closed.',
      'As an adjustment to opening retained earnings, with no income-statement line this year.',
      'Results of a discontinued operation, including the operating result and the gain or loss on disposal, are reported separately from continuing operations and net of tax. Leaving them in gross profit mixes a disposed business into the margin of the business that remains. The sale is a current-period event, not a direct opening-equity restatement.',
    ),
    ask(
      'fsa-income',
      'medium',
      'Orchard Line Grocers extends the estimated useful life of its delivery vans after a maintenance review. The change is a revision of an accounting estimate, not a correction of an error. How is it applied?',
      'Prospectively, by depreciating the current carrying amount over the revised remaining life, with no restatement of prior periods.',
      'Retrospectively, by restating prior depreciation and opening retained earnings as if the new life had always been used.',
      'Only in the notes, with no change to current or future depreciation until the vans are replaced.',
      'A change in accounting estimate is applied prospectively. Prior periods stay as reported because those periods used the information that was available then. The current book value is allocated over the new remaining life. A retrospective restatement is the usual path for a voluntary change in accounting principle or for an error correction, not for this estimate revision. Silence in the accounts would ignore a change that affects current profit.',
    ),
    ask(
      'fsa-income',
      'medium',
      'Mossbank Textiles has four items this year: a foreign-currency translation gain on a self-sustaining foreign subsidiary, a gain on the sale of finished cloth, dividend income on a trading portfolio, and a routine inventory write-down. Which item bypasses net income?',
      'The foreign-currency translation gain on the self-sustaining subsidiary, which is recorded in other comprehensive income.',
      'The gain on the sale of finished cloth, because inventory gains are always excluded from operating profit.',
      'The dividend income, because dividends received are financing cash and therefore never enter earnings.',
      'Translation of a foreign operation’s financial statements is an OCI item under both IFRS and US GAAP. A sale of inventory and an inventory write-down go through profit or loss. Dividend income on a trading portfolio is also profit or loss; the cash-flow classification of the dividend does not decide whether it is earnings. OCI is not a parking place for ordinary operating items.',
    ),
    numQ(
      'fsa-income',
      'hard',
      `Copperline Wire has net income of ${usd(500_000, 0)} and 100,000 weighted-average common shares. Its cumulative preferred stock carries a ${usd(40_000, 0)} dividend for this year, and that dividend was not declared. The firm did pay ${usd(40_000, 0)} of arrears from the prior year. Basic EPS is closest to ${inline(String.raw`\frac{500{,}000 - 40{,}000}{100{,}000}`)}.`,
      cumulativeEps,
      [(500_000 - 80_000) / 100_000, 500_000 / 100_000],
      (value) => usd(value, 2),
      (formatted) =>
        `For cumulative preferred stock, basic EPS deducts the current-period dividend whether or not it was declared. Prior-year arrears paid this year are not deducted again. ${inline(String.raw`\frac{500{,}000 - 40{,}000}{100{,}000}`)} equals ${formatted}. Subtracting both the current dividend and the arrears, or subtracting nothing because the current dividend was undeclared, misstates income available to common shareholders.`,
    ),
    numQ(
      'fsa-income',
      'easy',
      `Fable Press reports net income of ${usd(486_000, 0)}, preferred dividends of ${usd(36_000, 0)} on noncumulative preferred stock that were declared in full, and weighted-average common shares of 150,000. Basic EPS is closest to ${inline(String.raw`\frac{486{,}000 - 36{,}000}{150{,}000}`)}.`,
      plainEps,
      [486_000 / 150_000, (486_000 + 36_000) / 150_000],
      (value) => usd(value, 2),
      (formatted) =>
        `Basic EPS uses income available to common shareholders. Declared noncumulative preferred dividends are subtracted from net income and the result is divided by weighted-average common shares: ${inline(String.raw`\frac{486{,}000 - 36{,}000}{150{,}000}`)} = ${formatted}. Leaving the preferred dividend in the numerator, or adding it, treats preferred owners’ claim as if it belonged to common shareholders.`,
    ),
    numQ(
      'fsa-income',
      'medium',
      'Ridgewell Pumps had 100,000 shares on 1 January. It issued 12,000 shares on 1 June and distributed a 10% stock dividend on 1 October. No other share changes occurred. Weighted-average shares for EPS are closest to ' +
        inline(String.raw`100{,}000 \times 1.10 + 12{,}000 \times 1.10 \times \frac{7}{12}`) +
        '.',
      stockDividendWaso,
      [100_000 * 1.1 + 12_000 * (7 / 12), 100_000 + 12_000 * (7 / 12) + (100_000 + 12_000) * 0.1 * (3 / 12)],
      sharesText,
      (formatted) =>
        `A stock dividend is treated as if it occurred at the beginning of the year, and it also applies to shares issued before the dividend date. ${inline(String.raw`100{,}000 \times 1.10 + 12{,}000 \times 1.10 \times \frac{7}{12}`)} equals ${formatted}. Forgetting to gross up the June issuance, or applying the 10% only to the fourth quarter, understates the denominator and overstates EPS.`,
    ),
    numQ(
      'fsa-income',
      'medium',
      'Halden Forge had 80,000 shares on 1 January, issued 20,000 shares on 1 April, completed a 2-for-1 split on 1 July, and issued 10,000 post-split shares on 1 October. Weighted-average shares are closest to ' +
        inline(String.raw`80{,}000 \times 2 + 20{,}000 \times 2 \times \frac{9}{12} + 10{,}000 \times \frac{3}{12}`) +
        '.',
      splitWaso,
      [80_000 * 2 + 20_000 * (9 / 12) + 10_000 * (3 / 12), 80_000 * 2 + 20_000 * 2 * (9 / 12) + 10_000 * 2 * (3 / 12)],
      sharesText,
      (formatted) =>
        `A split is applied retrospectively to shares outstanding before the split, and shares issued after the split are counted at their actual amount for the time they were outstanding. ${inline(String.raw`80{,}000 \times 2 + 20{,}000 \times 2 \times \frac{9}{12} + 10{,}000 \times \frac{3}{12}`)} equals ${formatted}. Leaving the April issue unadjusted, or splitting the October issue that was already post-split, produces the wrong denominator.`,
    ),
    numQ(
      'fsa-income',
      'hard',
      `Brookmint Beverages has net income of ${usd(750_000, 0)}, declared preferred dividends of ${usd(50_000, 0)}, and 250,000 weighted-average common shares. It also has 30,000 options with a strike of ${usd(20, 0)}. The average market price is ${usd(50, 0)}. Using the treasury stock method, diluted EPS is closest to ${inline(String.raw`\frac{700{,}000}{250{,}000 + 18{,}000}`)}.`,
      optionDiluted,
      [optionBasic, optionAllIn],
      (value) => usd(value, 2),
      (formatted) =>
        `Proceeds of ${usd(30_000 * 20, 0)} repurchase 12,000 shares at the ${usd(50, 0)} average price, so incremental shares are ${sharesText(optionIncremental)}. Preferred dividends still come out of the numerator. ${inline(String.raw`\frac{700{,}000}{268{,}000}`)} equals ${formatted}. Basic EPS ignores the options. Adding all 30,000 shares ignores the shares assumed to be repurchased with the proceeds.`,
    ),
    numQ(
      'fsa-income',
      'hard',
      `The same capital structure as a profitable beverage company is not required here. Ternpaper Boxes has net income of ${usd(750_000, 0)}, preferred dividends of ${usd(50_000, 0)}, and 250,000 weighted-average common shares. Its 30,000 options have a strike of ${usd(55, 0)} and the average market price is ${usd(50, 0)}. Diluted EPS is closest to ${inline(String.raw`\frac{700{,}000}{250{,}000}`)}.`,
      idleBasic,
      [idleForced, idleFull],
      (value) => usd(value, 2),
      (formatted) =>
        `The treasury stock method adds shares only when the options are dilutive. Because the ${usd(55, 0)} strike is above the ${usd(50, 0)} average market price, incremental shares are ${num(idleIncremental, 0)} and diluted EPS stays at basic EPS. ${inline(String.raw`\frac{700{,}000}{250{,}000}`)} equals ${formatted}. Forcing a repurchase calculation produces negative incremental shares and would increase EPS, which is exactly the antidilutive result that is excluded.`,
    ),
    numQ(
      'fsa-income',
      'hard',
      `Yarrow Dental Labs has net income of ${usd(280_000, 0)}, no preferred stock, and 100,000 weighted-average shares. Convertible bonds would add ${usd(35_000, 0)} of after-tax interest back to the numerator and 25,000 shares to the denominator if converted. Diluted EPS is closest to ${inline(String.raw`\frac{280{,}000 + 35{,}000}{100{,}000 + 25{,}000}`)}.`,
      converted.reported,
      [converted.basic, (280_000 + 35_000) / 100_000],
      (value) => usd(value, 2),
      (formatted) =>
        `The if-converted method adds back after-tax interest and adds the shares issued on conversion. That result, ${formatted}, is below basic EPS of ${usd(converted.basic, 2)}, so the bonds are dilutive and the diluted figure is reported. ${inline(String.raw`\frac{315{,}000}{125{,}000}`)} is the computation. Adding the interest without the new shares, or reporting basic EPS, misses a security that reduces EPS.`,
    ),
    numQ(
      'fsa-income',
      'medium',
      `Ivorstead Tools has net income of ${usd(280_000, 0)}, no preferred stock, and 100,000 weighted-average shares. Converting its bonds would add ${usd(80_000, 0)} of after-tax interest and only 10,000 shares. Reported diluted EPS is closest to ${inline(String.raw`\frac{280{,}000}{100{,}000}`)}.`,
      antidilutiveConvertible.reported,
      [antidilutiveConvertible.dilutedIfConverted, (280_000 + 80_000) / 100_000],
      (value) => usd(value, 2),
      (formatted) =>
        `If-converted EPS would be ${usd(antidilutiveConvertible.dilutedIfConverted, 2)}, which is higher than basic EPS of ${usd(antidilutiveConvertible.basic, 2)}. The bonds are antidilutive and are left out. Reported diluted EPS therefore equals ${formatted}. ${inline(String.raw`\frac{280{,}000}{100{,}000}`)} is basic EPS, and diluted EPS never includes a security that would increase it.`,
    ),
  ]
}

function balance(): Draft[] {
  const goodwill = 900_000 - 720_000
  return [
    ask(
      'fsa-balance',
      'easy',
      'Duneward Glass acquired a competitor and recognized goodwill. The controller asks whether that goodwill is amortized over 10 years under IFRS, under US GAAP, or under both. Which statement is most accurate?',
      'Goodwill is not amortized under IFRS or US GAAP. It is tested for impairment.',
      'IFRS amortizes goodwill over its useful life, while US GAAP tests it only for impairment.',
      'Both frameworks amortize purchased goodwill on a straight line through operating expense.',
      'Purchased goodwill stays on the balance sheet and is tested for impairment under both IFRS and US GAAP. It is not systematically amortized in the general reporting model an analyst uses at this level. An impairment loss reduces assets and profit when the test fails. Internally generated goodwill is never recognized in the first place.',
    ),
    numQ(
      'fsa-balance',
      'easy',
      `Oakmere Furniture pays ${usd(900_000, 0)} for a workshop. The fair value of the identifiable net assets is ${usd(720_000, 0)}. Goodwill recognized at acquisition is closest to ${inline(String.raw`900{,}000 - 720{,}000`)}.`,
      goodwill,
      [900_000, 720_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Goodwill is the excess of consideration transferred over the fair value of identifiable net assets acquired. ${inline(String.raw`900{,}000 - 720{,}000`)} equals ${formatted}. Booking the entire price as goodwill ignores the identifiable assets. Booking no goodwill would force those identifiable assets above their fair value or hide the premium paid.`,
    ),
    ask(
      'fsa-balance',
      'medium',
      'Kite & Lantern Retail has spent heavily to build a brand that customers recognize, but it has never purchased that brand from another party. The marketing team wants the brand capitalized at an appraiser’s value. Which treatment is most accurate?',
      'The internally generated brand stays off the balance sheet. A purchased identifiable brand acquired in a business combination can be recognized separately from goodwill.',
      'Any brand with a reliable appraisal is capitalized and amortized, whether it was built or bought.',
      'The internal brand is recognized as goodwill and then amortized over the appraisal horizon.',
      'Internally generated brands, customer lists, and goodwill are not recognized as assets because the cost of creating them cannot be separated from the cost of running the business. Identifiable intangibles acquired in a purchase are recognized at fair value and kept apart from goodwill. Calling an internal brand goodwill would both recognize an internal item and mislabel it.',
    ),
    numQ(
      'fsa-balance',
      'easy',
      `On a common-size balance sheet, Maplehour Dairy has cash of ${usd(140_000, 0)} and total assets of ${usd(2_000_000, 0)}. Cash as a percentage of total assets is closest to ${inline(String.raw`\frac{140{,}000}{2{,}000{,}000}`)}.`,
      140_000 / 2_000_000,
      [140_000 / 1_200_000, 2_000_000 / 140_000],
      (value) => pct(value, 2),
      (formatted) =>
        `A common-size balance sheet divides each line by total assets, so cash is ${inline(String.raw`\frac{140{,}000}{2{,}000{,}000}`)} = ${formatted}. Dividing by equity, or inverting the ratio into an asset multiple, answers a different question and cannot be compared with another firm’s common-size cash line.`,
    ),
    ask(
      'fsa-balance',
      'medium',
      'Stoneferry Cement repurchases its own common shares for cash and holds them as treasury stock under the cost method. The shares are later reissued above cost. Which statement is most accurate?',
      'Treasury stock is a contra-equity balance. The repurchase is not an asset, and the later reissue does not create income-statement gain.',
      'Treasury stock is a long-term marketable security, and the reissue gain is operating income.',
      'The repurchase is an investing cash outflow that remains an asset until the shares are cancelled through profit or loss.',
      'Treasury shares are the company’s own stock. They reduce equity. They are not an asset of the company, and transactions in them do not run through net income under the cost method; any excess on reissue is an equity adjustment. The cash paid to repurchase is a financing outflow, not an investing purchase of a third-party security.',
    ),
    ask(
      'fsa-balance',
      'easy',
      'Nimbus Parcel collects annual service fees at the start of each contract and still owes the delivery service at year-end. A junior analyst classifies the unearned amount as a component of equity because the cash is already in the bank. Which classification is most accurate?',
      'The unearned amount is a contract liability until the delivery performance obligation is satisfied.',
      'The unearned amount is retained earnings, because the cash has been collected and is no longer refundable in the analyst’s model.',
      'The unearned amount is a contra-asset deducted from accounts receivable.',
      'Cash collected before performance is a liability, often called deferred revenue or a contract liability. It is not retained earnings, because the earnings process is incomplete, and it is not a contra-receivable, because the customer has already paid. When the parcels are delivered, the liability becomes revenue.',
    ),
    ask(
      'fsa-balance',
      'hard',
      'Under IFRS 9, Wick & Amber Candles holds a portfolio of plain vanilla corporate bonds. Its documented business model is to collect contractual cash flows, and those cash flows are solely payments of principal and interest. How are the bonds measured?',
      'At amortized cost.',
      'At fair value through profit or loss, because every debt investment is trading by default.',
      'At fair value through OCI, because the SPPI test by itself requires the FVOCI category.',
      'IFRS 9 uses amortized cost when both tests are met: the business model is hold to collect, and the contractual cash flows are solely payments of principal and interest. FVOCI is the category for a business model whose objective is both collecting cash flows and selling. Fair value through profit or loss is the residual category, including assets that fail the SPPI test. The business-model test is doing real work here; SPPI alone does not force OCI.',
    ),
    ask(
      'fsa-balance',
      'medium',
      'Plover Medical Supply shows a debit balance for accumulated other comprehensive income after a run of translation losses. A trainee reclassifies that debit as a noncurrent liability so the equity section “stays clean.” Which statement is most accurate?',
      'Accumulated other comprehensive income is a component of equity, whether its balance is a credit or a debit.',
      'A debit AOCI balance is a deferred tax asset, so the reclassification is required under US GAAP only.',
      'AOCI is a contra-liability that reduces long-term debt when translation losses accumulate.',
      'Other comprehensive income accumulates in equity, not in liabilities. Losses leave a debit balance inside equity and reduce the book value available to owners. Moving that balance into liabilities would understate leverage and misstate equity. Deferred taxes may sit beside an OCI item, but the OCI amount itself is not a deferred tax asset.',
    ),
    ask(
      'fsa-balance',
      'medium',
      'Cinderpeak Aggregates has a normal operating cycle of 18 months because it seasons some materials before sale. A supplier invoice is due in 14 months and will be settled with cash from that cycle. How is the invoice classified?',
      'As a current liability, because it is due within the operating cycle, which is longer than one year.',
      'As a noncurrent liability, because any obligation due after twelve months is noncurrent regardless of the operating cycle.',
      'As equity, because a cycle longer than a year means the invoice finances the owners.',
      'A liability is current when it is expected to be settled in the normal operating cycle or is due within twelve months, using the longer of those ideas for operating items. A 14-month payable inside an 18-month cycle is current. The twelve-month shortcut is not an override when the operating cycle is longer. The invoice is not a capital contribution.',
    ),
    ask(
      'fsa-balance',
      'hard',
      'Aster Dock Services acquires a competitor and pays for identifiable customer contracts, an in-process research project, and a residual premium. How are those pieces recognized at the acquisition date?',
      'Customer contracts and acquired in-process research are identifiable intangibles at fair value. Only the residual premium is goodwill.',
      'The entire premium, including the fair value of customer contracts, is lumped into goodwill and later amortized.',
      'In-process research is expensed on day one under both IFRS and US GAAP, and customer contracts are left unrecognized until cash is collected.',
      'In a business combination, identifiable intangibles are recognized separately from goodwill at fair value. That includes customer-related intangibles and acquired in-process research and development. Goodwill is only the residual. Expensing acquired in-process research at acquisition, or burying identifiable contracts inside goodwill, understates separable intangible assets. Goodwill itself is not amortized.',
    ),
  ]
}

function cf1(): Draft[] {
  const ni = 265_000
  const depreciation = 74_000
  const gain = 18_000
  const arIncrease = 22_000
  const inventoryDecrease = 9_000
  const apDecrease = 7_000
  const prepaidIncrease = 4_000
  const cfo =
    ni + depreciation - gain - arIncrease + inventoryDecrease - apDecrease - prepaidIncrease
  const endingCash = 210_000 + 180_000 - 90_000 + 40_000
  const landProceeds = 95_000
  return [
    numQ(
      'fsa-cf1',
      'medium',
      `Fernwhistle Paper uses the indirect method. Net income is ${usd(ni, 0)}, depreciation is ${usd(depreciation, 0)}, a gain on a land sale is ${usd(gain, 0)}, accounts receivable increased by ${usd(arIncrease, 0)}, inventory decreased by ${usd(inventoryDecrease, 0)}, accounts payable decreased by ${usd(apDecrease, 0)}, and prepaid expenses increased by ${usd(prepaidIncrease, 0)}. Cash from operations is closest to ${inline(String.raw`265{,}000 + 74{,}000 - 18{,}000 - 22{,}000 + 9{,}000 - 7{,}000 - 4{,}000`)}.`,
      cfo,
      [cfo + gain, cfo + 2 * arIncrease],
      (value) => usd(value, 0),
      (formatted) =>
        `Start with net income, add back the non-cash depreciation, subtract the gain that is not operating cash, subtract the receivable build, add the inventory drawdown, subtract the payable paydown, and subtract the prepaid increase. ${inline(String.raw`265{,}000 + 74{,}000 - 18{,}000 - 22{,}000 + 9{,}000 - 7{,}000 - 4{,}000`)} equals ${formatted}. Leaving the gain in earnings, or adding the receivable increase, gets the working-capital signs backward.`,
    ),
    ask(
      'fsa-cf1',
      'easy',
      'In the indirect cash flow statement of Lumenford Lighting, inventory rose because the firm stocked more finished lamps than it sold. How does that inventory increase affect cash from operations?',
      'It is subtracted from net income, because building inventory uses cash.',
      'It is added to net income, because more inventory proves that customers have already paid.',
      'It is an investing outflow, because inventory is a long-lived asset.',
      'An increase in an operating asset is a use of cash in the indirect method, so the inventory build is subtracted from net income inside CFO. It is not evidence of collection, and inventory held for sale is operating, not a capital expenditure in investing. A later sale will reverse the effect when inventory falls or when profit includes the margin.',
    ),
    numQ(
      'fsa-cf1',
      'medium',
      `Redcedar Cabinetry sold a parcel of land with a carrying amount of ${usd(70_000, 0)} for ${usd(95_000, 0)} cash. In the statement of cash flows, the investing inflow is closest to ${inline(String.raw`95{,}000`)}.`,
      landProceeds,
      [25_000, 70_000],
      (value) => usd(value, 0),
      (formatted) =>
        `The cash received is the investing inflow, so the line is ${formatted}. ${inline(String.raw`95{,}000 - 70{,}000`)} is only the gain of ${usd(25_000, 0)}, and that gain is removed from net income in the indirect operating section so it is not double counted. Reporting the carrying amount as the cash inflow understates the cash that actually arrived.`,
    ),
    ask(
      'fsa-cf1',
      'easy',
      'Under US GAAP, Brookmint Beverages pays interest on its bonds and pays a dividend on its common shares. How are those two cash payments classified?',
      'Interest paid is an operating outflow. Dividends paid are a financing outflow.',
      'Both payments are financing outflows, because both compensate capital providers.',
      'Both payments are operating outflows, because both reduce retained earnings.',
      'US GAAP classifies interest paid as operating and dividends paid as financing. The economic observation that both payments compensate capital providers does not override that classification. Dividends paid do not become operating merely because they are distributed out of earnings. IFRS, unlike US GAAP, would allow a policy choice for both payments.',
    ),
    ask(
      'fsa-cf1',
      'medium',
      'An IFRS reporter, Silverthistle Tea, is choosing a cash flow policy for interest paid and dividends paid. Which policy is acceptable?',
      'Either operating or financing, applied consistently. The two items do not have to use the same side of that choice.',
      'Interest paid must be operating and dividends paid must be financing, because IFRS copies the US GAAP rule.',
      'Both items must be investing, because they are returns on capital deployed in the business.',
      'IFRS allows interest paid to be classified as operating or financing, and it allows dividends paid the same choice. The policy should be applied consistently and disclosed. IFRS does not force the US GAAP split, and it does not put these payments in investing. An analyst who compares an IFRS firm with a US GAAP firm often reclassifies these lines before ranking CFO.',
    ),
    ask(
      'fsa-cf1',
      'medium',
      'Under IFRS, Orchard Line Grocers receives interest on surplus cash and receives dividends on a small equity holding. Which classification is permitted?',
      'Each receipt may be classified as operating or investing, with the choice applied consistently.',
      'Both receipts must be financing, matching the classification of dividends the firm pays.',
      'Interest received must be investing and dividends received must be operating, with no policy choice.',
      'IFRS permits interest received and dividends received to be classified as operating or investing. Financing is the category for obtaining and repaying capital, not for returns earned on assets the firm owns. There is a policy choice; the firm is not locked into one combination. US GAAP, by contrast, puts both receipts in operating.',
    ),
    ask(
      'fsa-cf1',
      'easy',
      'Under US GAAP, Maplehour Dairy receives interest on a deposit and dividends on a short-term equity investment. Where do those receipts appear in the cash flow statement?',
      'Both are operating inflows.',
      'Both are investing inflows, because they are returns on investments.',
      'Interest received is operating and dividends received are financing.',
      'US GAAP classifies interest received and dividends received as operating cash flows. That choice keeps them inside CFO even when an analyst thinks of them as returns on investment. IFRS would have allowed an investing classification. They are not financing inflows, because the firm is not issuing capital.',
    ),
    ask(
      'fsa-cf1',
      'hard',
      'Brackish Salt Co. has a bank overdraft that is repayable on demand and fluctuates as part of daily cash management. How do IFRS and US GAAP typically classify that overdraft?',
      'IFRS may include it in cash and cash equivalents. US GAAP generally treats it as a financing liability, not as a cash equivalent.',
      'Both frameworks include demand overdrafts in cash and cash equivalents with no disclosure.',
      'Both frameworks classify demand overdrafts as investing outflows because they finance equipment.',
      'IAS 7 allows a bank overdraft to be included in cash and cash equivalents when it is repayable on demand and forms an integral part of cash management. US GAAP generally does not treat an overdraft as a cash equivalent; it is a financing borrowing. Using one firm’s ending “cash” next to the other’s without reading that policy can misstate both liquidity and financing cash flow.',
    ),
    ask(
      'fsa-cf1',
      'medium',
      'Cinderpeak Aggregates acquires a crusher by issuing its own common shares. No cash changes hands. How is the acquisition reported in the cash flow statement?',
      'It is not reported as an investing or financing cash flow. It is disclosed as a noncash investing and financing activity.',
      'It is an investing outflow and a financing inflow of equal size, both inside the body of the statement.',
      'It is an operating outflow equal to the fair value of the shares, because the crusher will be depreciated.',
      'A noncash exchange of shares for a productive asset never enters the cash totals. Both IFRS and US GAAP require it to be disclosed, typically in a supplemental schedule or note, so the reader can see the investing commitment and the equity issued. Inventing equal cash legs would pretend cash moved. Depreciation of the crusher later affects the indirect operating reconciliation, but the acquisition itself is not CFO.',
    ),
    numQ(
      'fsa-cf1',
      'easy',
      `Lowtide Boatworks began the year with cash of ${usd(210_000, 0)}. Cash from operations was ${usd(180_000, 0)}, cash from investing was an outflow of ${usd(90_000, 0)}, and cash from financing was an inflow of ${usd(40_000, 0)}. Ending cash on the balance sheet is closest to ${inline(String.raw`210{,}000 + 180{,}000 - 90{,}000 + 40{,}000`)}.`,
      endingCash,
      [210_000 + 180_000 - 90_000 - 40_000, 180_000 - 90_000 + 40_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Ending cash equals beginning cash plus the three section totals, with outflows as negatives. ${inline(String.raw`210{,}000 + 180{,}000 - 90{,}000 + 40{,}000`)} equals ${formatted}. That ending balance is the cash line on the balance sheet, including cash equivalents under the firm’s policy. Subtracting the financing inflow, or dropping the opening balance, breaks the rollforward.`,
    ),
    ask(
      'fsa-cf1',
      'hard',
      'Whitecap Fisheries presents operating cash flow with the direct method under US GAAP and shows the same total a second time with the indirect method. Why can those two totals match?',
      'The direct and indirect methods are two presentations of the same operating cash flow. Under US GAAP the direct method also requires an indirect reconciliation.',
      'They match only when net income is zero, because the indirect method cannot be used by a profitable firm.',
      'They match because the direct method is a financing schedule and the indirect method is an investing schedule.',
      'Both methods compute cash from operating activities. The direct method lists cash collected from customers and cash paid to suppliers and employees. The indirect method starts at net income and reverses accruals. US GAAP requires a reconciliation of net income to operating cash flow when the direct method is used, so a reader may see both presentations of one CFO total. Neither presentation is the investing or financing section.',
    ),
    ask(
      'fsa-cf1',
      'medium',
      'A US GAAP filer, Ridgewell Pumps, pays income taxes and also buys a new lathe for cash. How are the tax payment and the lathe purchase classified?',
      'Taxes paid are operating. The lathe purchase is investing.',
      'Taxes paid are financing, and the lathe is operating because depreciation will run through net income.',
      'Both payments are investing, because both support long-term capacity.',
      'Under US GAAP, income taxes paid are classified as operating. Cash paid for property, plant, and equipment is investing. Depreciation will later be added back in the indirect operating section, but that add-back is not where the purchase is classified. IFRS allows taxes paid to be operating unless a specific tax cash flow can be identified with an investing or financing transaction, which is a narrower exception than moving every tax payment.',
    ),
  ]
}

function cf2(): Draft[] {
  const fcffA = math.fcff(420_000, 80_000, 0.25, 150_000)
  const fcfeA = math.fcfe(420_000, 150_000, 40_000)
  const fcffB = math.fcff(260_000, 50_000, 0.3, 190_000)
  const fcfeB = math.fcfe(260_000, 190_000, -80_000)
  const spread = fcffA - fcfeA
  const coverage = (480_000 + 60_000) / 60_000
  const dividendCover = math.fcfe(310_000, 90_000, 20_000) / 48_000
  return [
    numQ(
      'fsa-cf2',
      'medium',
      `Under US GAAP, Aster Dock Services reports CFO of ${usd(420_000, 0)}, cash interest paid of ${usd(80_000, 0)}, a 25% tax rate, and fixed-capital investment of ${usd(150_000, 0)}. FCFF is closest to ${block(String.raw`\mathrm{FCFF} = \mathrm{CFO} + \mathrm{Int}(1 - t) - \mathrm{FCInv}`)}.`,
      fcffA,
      [420_000 - 150_000, 420_000 + 80_000 - 150_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Because US GAAP puts interest paid inside CFO, free cash flow to the firm adds back after-tax interest so the cash is measured before payments to debt holders. ${block(String.raw`420{,}000 + 80{,}000(1 - 0.25) - 150{,}000`)} equals ${formatted}. Dropping the add-back, or adding pretax interest, mixes a financing cost back into the firm-level figure incorrectly.`,
    ),
    numQ(
      'fsa-cf2',
      'medium',
      `Using the same US GAAP dock company, CFO is ${usd(420_000, 0)}, fixed-capital investment is ${usd(150_000, 0)}, and net borrowing is ${usd(40_000, 0)}. FCFE is closest to ${block(String.raw`\mathrm{FCFE} = \mathrm{CFO} - \mathrm{FCInv} + \text{net borrowing}`)}.`,
      fcfeA,
      [420_000 - 150_000, 420_000 - 150_000 - 40_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Free cash flow to equity starts from CFO, subtracts fixed-capital investment, and adds net borrowing, which is new debt minus repayments. ${block(String.raw`420{,}000 - 150{,}000 + 40{,}000`)} equals ${formatted}. Ignoring borrowing understates cash available to owners this period. Subtracting the new borrowing treats a source as a use.`,
    ),
    numQ(
      'fsa-cf2',
      'hard',
      `For Aster Dock Services, FCFF is ${usd(fcffA, 0)} and FCFE is ${usd(fcfeA, 0)}. After-tax interest is ${usd(60_000, 0)} and net borrowing is ${usd(40_000, 0)}. FCFF minus FCFE is closest to ${inline(String.raw`\mathrm{Int}(1 - t) - \text{net borrowing}`)}.`,
      spread,
      [60_000 - 40_000 + fcffA, 60_000 + 40_000],
      (value) => usd(value, 0),
      (formatted) =>
        `The bridge is FCFF = FCFE + after-tax interest − net borrowing, so FCFF − FCFE = after-tax interest − net borrowing. ${inline(String.raw`60{,}000 - 40{,}000`)} equals ${formatted}. Adding the FCFF total into the bridge, or adding net borrowing instead of subtracting it, double counts cash that the two definitions already split between debt and equity.`,
    ),
    numQ(
      'fsa-cf2',
      'hard',
      `Under US GAAP, Halden Forge has CFO of ${usd(260_000, 0)}, interest paid of ${usd(50_000, 0)}, a 30% tax rate, fixed-capital investment of ${usd(190_000, 0)}, and net debt repayment of ${usd(80_000, 0)}. FCFE is closest to ${inline(String.raw`260{,}000 - 190{,}000 - 80{,}000`)}.`,
      fcfeB,
      [fcffB, 260_000 - 190_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Net borrowing is negative when the firm pays debt down, so FCFE = CFO − FCInv + (−80,000). ${inline(String.raw`260{,}000 - 190{,}000 - 80{,}000`)} equals ${formatted}. FCFF is still positive at ${usd(fcffB, 0)} because after-tax interest is added back and the debt repayment is a distribution to lenders, not a reduction of cash available to all providers. Stopping at CFO minus capital spending leaves the repayment out.`,
    ),
    numQ(
      'fsa-cf2',
      'easy',
      `Under US GAAP, Sable Courier has CFO of ${usd(480_000, 0)} after deducting cash interest of ${usd(60_000, 0)}. Cash interest coverage, defined as CFO plus interest paid, divided by interest paid, is closest to ${inline(String.raw`\frac{480{,}000 + 60{,}000}{60{,}000}`)}.`,
      coverage,
      [480_000 / 60_000, (480_000 - 60_000) / 60_000],
      times,
      (formatted) =>
        `CFO is already net of the interest payment, so the coverage ratio defined in the question adds that interest back before dividing. ${inline(String.raw`\frac{540{,}000}{60{,}000}`)} equals ${formatted}. Dividing the unadjusted CFO by interest understates coverage. Subtracting interest a second time pretends the cash operating result never had the capacity to pay the coupon.`,
    ),
    numQ(
      'fsa-cf2',
      'medium',
      `Quill & Copper Press has US GAAP CFO of ${usd(310_000, 0)}, fixed-capital investment of ${usd(90_000, 0)}, net borrowing of ${usd(20_000, 0)}, and common dividends of ${usd(48_000, 0)}. FCFE dividend coverage, FCFE divided by dividends, is closest to ${inline(String.raw`\frac{310{,}000 - 90{,}000 + 20{,}000}{48{,}000}`)}.`,
      dividendCover,
      [310_000 / 48_000, (310_000 - 90_000) / 48_000],
      times,
      (formatted) =>
        `FCFE is the cash available to common owners after capital spending and net borrowing. ${inline(String.raw`\frac{240{,}000}{48{,}000}`)} equals ${formatted}. Coverage built on raw CFO ignores the reinvestment the business still has to fund. Coverage built on CFO minus capital spending ignores the borrowing that added cash this period.`,
    ),
    ask(
      'fsa-cf2',
      'medium',
      'Ironleaf Packaging’s net income rose for a third year, but free cash flow fell because receivables and inventories grew faster than sales and capital spending jumped. Which interpretation is most accurate?',
      'Accrual profit can rise while free cash flow falls when working capital and reinvestment absorb the cash.',
      'Rising net income and falling free cash flow cannot occur together if the statements articulate.',
      'The pattern proves the cash flow statement is misclassified under US GAAP, because profit and cash must move in the same direction.',
      'Earnings recognize revenue before cash collection and deduct depreciation rather than the full capital outlay. A receivables build, an inventory build, and a step-up in fixed-capital investment can therefore consume cash in a year when profit looks healthy. The statements can still articulate. The pattern is a reason to ask whether the growth is being funded by the owners’ cash, not a proof that the cash flow statement is wrong.',
    ),
    ask(
      'fsa-cf2',
      'easy',
      'An analyst defining fixed-capital investment for FCFF and FCFE at Veldt Mill subtracts only the cash paid for new equipment and ignores cash received from selling old equipment. Which statement is most accurate?',
      'Fixed-capital investment is net of cash proceeds from disposals of long-lived assets. Omitting the proceeds overstates reinvestment and understates free cash flow.',
      'Disposal proceeds are operating cash and must not touch the fixed-capital investment figure.',
      'Disposal proceeds reduce net income only, so free cash flow already includes them through CFO with no further adjustment.',
      'FCInv in the free-cash-flow definitions is capital expenditure minus cash proceeds from selling long-lived assets. Those proceeds are investing inflows, not CFO. The gain or loss on the sale is reversed out of net income in the indirect method, but the cash proceeds themselves still reduce net reinvestment. Leaving them out makes the firm look more capital hungry than the cash account shows.',
    ),
    ask(
      'fsa-cf2',
      'hard',
      'Silverthistle Tea reports under IFRS and classifies all interest paid as a financing outflow. An analyst copies a US GAAP-style FCFF formula and adds after-tax interest to CFO anyway. What goes wrong?',
      'CFO was never reduced by the interest, so adding after-tax interest double counts cash that is still inside CFO and overstates FCFF.',
      'The add-back is still required and unchanged, because IFRS free cash flow is defined only on the US GAAP cash flow statement.',
      'The add-back should be pretax interest moved into investing, because IFRS relocates coupons to the investing section.',
      'The familiar FCFF add-back exists because US GAAP CFO is after interest. If an IFRS firm has already classified interest paid as financing, that cash is still in CFO. Adding after-tax interest again counts it twice. The repair is to start from the CFO the firm actually reported and add back after-tax interest only to the extent interest was deducted inside that CFO. IFRS does not move the coupon to investing.',
    ),
    ask(
      'fsa-cf2',
      'easy',
      'A credit analyst and an equity analyst look at the same US GAAP cash flow statement for Harbor Loom. Which description of the two free-cash-flow measures is most accurate?',
      'FCFF is cash available to all capital providers. FCFE is the cash left for common equity after fixed-capital investment and net borrowing.',
      'FCFF is cash available to common shareholders. FCFE is cash available to lenders only.',
      'FCFF and FCFE are always equal, because interest is a non-cash expense.',
      'Free cash flow to the firm is measured before payments to debt holders, which is why after-tax interest is added back to a US GAAP CFO figure. Free cash flow to equity is what remains for common owners after capital spending and after the net cash flowing to or from lenders. Interest is a cash item in this construction. The two totals differ whenever leverage is present.',
    ),
    ask(
      'fsa-cf2',
      'medium',
      'Fable Press pays a dividend larger than its FCFE by issuing new debt every year. Earnings are flat and capital spending equals depreciation. Which interpretation is most careful?',
      'The dividend is being funded by borrowing, so today’s FCFE coverage overstates what owners can take if the debt is not rolled forever.',
      'Net borrowing is a permanent source of free cash flow to equity and can be projected to grow with the dividend without limit.',
      'Because capital spending equals depreciation, FCFE must equal net income and the debt issue is irrelevant.',
      'Net borrowing raises FCFE this period, but it is not a sustainable source of owner cash if it exists only to fund the dividend. When maintenance spending is covered and earnings are flat, a dividend above the unlevered residual is a capital-structure choice, not evidence of growing owner earnings. Depreciation equaling capital spending does not make FCFE equal net income once working capital, interest classification, and debt flows are in the picture.',
    ),
    ask(
      'fsa-cf2',
      'easy',
      'A trainee adds depreciation back to CFO when computing FCFF for Mossbank Textiles, arguing that depreciation is cash the firm can spend. CFO was built with the indirect method. Which correction is most accurate?',
      'Depreciation has already been added back in arriving at CFO. Adding it again double counts a non-cash charge.',
      'Depreciation is an investing inflow and should be added a second time as a source of FCFF.',
      'Depreciation is subtracted from CFO in the indirect method, so the trainee is simply reversing that subtraction.',
      'In the indirect method, depreciation is added to net income because it reduced profit without using cash. CFO therefore already excludes that non-cash charge. Free cash flow then subtracts actual fixed-capital investment, which is the cash reinvestment, not depreciation. A second add-back treats an accounting allocation as if it were a second pile of cash.',
    ),
    ask(
      'fsa-cf2',
      'medium',
      'Northglass Ceramics has a large positive FCFF and a much smaller FCFE in the same year. Net income is positive and there was no equity issuance. Which reading best fits those two free-cash-flow figures?',
      'After-tax interest and debt repayment are absorbing cash before it reaches common equity, so lenders are ahead of owners in the cash waterfall.',
      'The gap proves that capital spending was classified as operating and both free-cash-flow numbers are unusable.',
      'FCFE is smaller than FCFF only when the firm issues shares, so the equity issuance must have been omitted from financing.',
      'FCFF is before debt service. FCFE subtracts the net cash paid to lenders. A wide gap with no equity issuance means after-tax interest and net repayment, not a share issue, explain why owners receive less free cash than all providers together. Capital spending is deducted in both definitions, so it does not by itself create the gap. The figures can still be used once that waterfall is understood.',
    ),
    ask(
      'fsa-cf2',
      'hard',
      'Kelp & Birch Foods shows rising CFO but flat FCFF because fixed-capital investment rose by the same amount as CFO. Working capital was stable. Which conclusion is most accurate?',
      'The extra operating cash was reinvested in long-lived assets, so cash available to capital providers did not rise.',
      'FCFF must rise one-for-one with CFO, so the flat FCFF figure is an arithmetic error.',
      'Stable working capital means fixed-capital investment cannot change FCFF at all.',
      'FCFF subtracts fixed-capital investment from a US GAAP-style operating start. If that investment increases dollar for dollar with CFO, and after-tax interest is unchanged, FCFF stays flat. That is reinvestment, not an arithmetic failure. Working capital affects CFO; once CFO is known, a further change in capital spending still moves FCFF. Owners and lenders do not have more distributable cash just because operations collected more.',
    ),
  ]
}

function inventory(): Draft[] {
  const layers = [
    { units: 200, cost: 15 },
    { units: 250, cost: 18 },
    { units: 150, cost: 21 },
  ]
  const sold = 400
  const fifo = math.inventoryFlows(layers, sold, 'fifo')
  const lifo = math.inventoryFlows(layers, sold, 'lifo')
  const average = math.inventoryFlows(layers, sold, 'average')
  const purchases = 1_150_000 - 420_000 + 390_000
  const fifoInventory = 860_000 + 145_000
  const equityAdjust = 145_000 * (1 - 0.3)
  return [
    numQ(
      'fsa-inventory',
      'easy',
      `Hearthlane Bakeries had these flour layers, oldest first: 200 units at ${usd(15, 0)}, 250 units at ${usd(18, 0)}, and 150 units at ${usd(21, 0)}. It sold 400 units. FIFO cost of goods sold is closest to ${inline(String.raw`200 \times 15 + 200 \times 18`)}.`,
      fifo.cogs,
      [lifo.cogs, average.cogs],
      (value) => usd(value, 0),
      (formatted) =>
        `FIFO sells the oldest layers first. ${inline(String.raw`200 \times 15 + 200 \times 18`)} equals ${formatted}. LIFO would have sold the newest units and produced a higher cost because the purchase prices rose. The weighted-average cost sits between those two cost-of-goods figures.`,
    ),
    numQ(
      'fsa-inventory',
      'medium',
      `Using Hearthlane’s layers, oldest first — 200 units at ${usd(15, 0)}, 250 at ${usd(18, 0)}, and 150 at ${usd(21, 0)} — LIFO cost of goods sold for 400 units sold is closest to ${inline(String.raw`150 \times 21 + 250 \times 18`)}.`,
      lifo.cogs,
      [fifo.cogs, average.cogs],
      (value) => usd(value, 0),
      (formatted) =>
        `LIFO, which US GAAP permits and IFRS does not, sells the newest layers first. ${inline(String.raw`150 \times 21 + 250 \times 18`)} equals ${formatted}. With rising prices that cost is higher than FIFO, so LIFO profit and ending inventory are lower. The average-cost result is between the two flow assumptions.`,
    ),
    numQ(
      'fsa-inventory',
      'medium',
      `The same bakery layers cost ${usd(10_650, 0)} for 600 units. Weighted-average cost of goods sold for 400 units is closest to ${inline(String.raw`\frac{10{,}650}{600} \times 400`)}.`,
      average.cogs,
      [fifo.cogs, lifo.cogs],
      (value) => usd(value, 0),
      (formatted) =>
        `Average cost uses one unit cost for every unit available: total cost divided by total units, then multiplied by units sold. ${inline(String.raw`\frac{10{,}650}{600} \times 400`)} equals ${formatted}. It does not track which physical sack was sold. Because prices rose through the period, this cost lands between FIFO and LIFO.`,
    ),
    numQ(
      'fsa-inventory',
      'easy',
      `Prices rose through Hearthlane’s three purchase layers of 200, 250, and 150 units. After selling 400 units, FIFO ending inventory is closest to ${inline(String.raw`10{,}650 - (200 \times 15 + 200 \times 18)`)}.`,
      fifo.ending,
      [lifo.ending, average.ending],
      (value) => usd(value, 0),
      (formatted) =>
        `Ending inventory is total cost available minus cost of goods sold. FIFO leaves the newest, most expensive units in stock, so ending inventory is ${formatted}. ${inline(String.raw`10{,}650 - 6{,}600`)} is that subtraction. LIFO would have left the older, cheaper layers on the balance sheet, and average cost would have left a balance between them.`,
    ),
    numQ(
      'fsa-inventory',
      'easy',
      `Brackish Salt Co. began with inventory of ${usd(420_000, 0)}, ended with inventory of ${usd(390_000, 0)}, and reported cost of goods sold of ${usd(1_150_000, 0)}. Purchases for the period are closest to ${inline(String.raw`1{,}150{,}000 - 420{,}000 + 390{,}000`)}.`,
      purchases,
      [1_150_000 - 420_000, 420_000 + 1_150_000 - 390_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Cost of goods sold equals beginning inventory plus purchases minus ending inventory. Rearranged, purchases equal cost of goods sold minus beginning inventory plus ending inventory. ${inline(String.raw`1{,}150{,}000 - 420{,}000 + 390{,}000`)} equals ${formatted}. Dropping the ending balance, or adding beginning inventory to cost of goods sold, does not recover the goods that entered the warehouse.`,
    ),
    numQ(
      'fsa-inventory',
      'medium',
      `Under US GAAP, Cinderpeak Aggregates uses LIFO. LIFO inventory is ${usd(860_000, 0)} and the LIFO reserve is ${usd(145_000, 0)}. Inventory restated to FIFO is closest to ${inline(String.raw`860{,}000 + 145{,}000`)}.`,
      fifoInventory,
      [860_000 - 145_000, 145_000],
      (value) => usd(value, 0),
      (formatted) =>
        `The LIFO reserve is the excess of FIFO inventory over LIFO inventory when prices have risen. Adding the reserve puts the balance sheet on a FIFO-like current cost: ${inline(String.raw`860{,}000 + 145{,}000`)} = ${formatted}. Subtracting the reserve would move further away from current cost. The reserve itself is not the inventory balance.`,
    ),
    numQ(
      'fsa-inventory',
      'hard',
      `Cinderpeak’s LIFO reserve of ${usd(145_000, 0)} has accumulated while the tax rate stayed at 30%. The cumulative addition to retained earnings if the firm were restated to FIFO is closest to ${inline(String.raw`145{,}000 \times (1 - 0.30)`)}.`,
      equityAdjust,
      [145_000, 145_000 * 0.3],
      (value) => usd(value, 0),
      (formatted) =>
        `If FIFO profit has been higher over time, the extra profit net of tax is what would have accumulated in retained earnings. The tax portion is a deferred tax liability. ${inline(String.raw`145{,}000 \times 0.70`)} equals ${formatted}. Adding the whole reserve to equity ignores the tax that would have been accrued. Adding only the tax portion records the liability as if it were earnings.`,
    ),
    numQ(
      'fsa-inventory',
      'easy',
      `At year-end, Kelp & Birch Foods has inventory carried at cost of ${usd(520_000, 0)}. Net realizable value is ${usd(487_000, 0)}. Under IFRS, the inventory carrying amount after the required measurement is closest to ${inline(String.raw`\min(520{,}000,\ 487{,}000)`)}.`,
      487_000,
      [520_000, 33_000],
      (value) => usd(value, 0),
      (formatted) =>
        `IFRS measures inventory at the lower of cost and net realizable value. Because NRV is below cost, the write-down is ${usd(33_000, 0)} and the carrying amount becomes ${formatted}. ${inline(String.raw`\min(520{,}000,\ 487{,}000)`)} is the test. Keeping historical cost would ignore the loss. Reporting only the write-down as the new inventory balance would wipe out the units that still have value.`,
    ),
    ask(
      'fsa-inventory',
      'easy',
      'A US subsidiary of an IFRS parent wants to adopt LIFO so taxable income falls while purchase prices rise. The parent must stay comparable across the group. Which statement is most accurate?',
      'LIFO is permitted under US GAAP and prohibited under IFRS, so the IFRS group cannot adopt LIFO in its consolidated statements.',
      'LIFO is required by IFRS whenever prices rise, and US GAAP forbids it.',
      'Both frameworks allow LIFO, and neither allows FIFO when prices are rising.',
      'US GAAP still permits LIFO. IFRS does not. An analyst comparing a LIFO filer with an IFRS filer uses the LIFO reserve to put inventory and, with tax, equity on a more current-cost basis. Rising prices do not force a firm onto LIFO, and FIFO remains available under both frameworks.',
    ),
    ask(
      'fsa-inventory',
      'medium',
      'Stoneferry Cement has used LIFO for years while prices rose, so its oldest layers are far below current cost. This year a strike forces it to sell deep into those layers. What happens to reported profit?',
      'LIFO liquidation dips into old low-cost layers, so cost of goods sold falls and profit spikes relative to a normal replacement year.',
      'LIFO liquidation raises cost of goods sold to current cost and depresses profit below FIFO.',
      'Liquidation has no profit effect, because LIFO always expenses the newest purchases even when the physical pile is gone.',
      'Under LIFO the accounting layers, not the physical pile, determine cost. When volume falls enough to consume an old layer, that layer’s low historical cost becomes cost of goods sold. Profit jumps even though the firm is not more efficient, and the profit will not repeat once purchasing resumes. That is the opposite of matching current cost. The LIFO reserve usually shrinks, which is the disclosure an analyst watches.',
    ),
    ask(
      'fsa-inventory',
      'medium',
      'Last year Wick & Amber Candles wrote inventory down under the lower-of-cost-and-NRV test. This year the same goods recovered, and NRV is above the original cost. How do IFRS and US GAAP differ on reversing that write-down?',
      'IFRS allows a reversal up to original cost. US GAAP generally prohibits a reversal of an inventory write-down.',
      'Both frameworks require the reversal, and both allow the new carrying amount to exceed original cost.',
      'US GAAP requires the reversal and IFRS prohibits any write-down in the first place.',
      'Both frameworks write inventory down when net realizable value falls below cost. If value recovers, IFRS allows the earlier write-down to be reversed, but not above the original cost. US GAAP does not allow that reversal for inventory measured in the ordinary course; the written-down amount becomes the new cost basis. A recovery that shows up as profit under IFRS will not show up under US GAAP.',
    ),
    ask(
      'fsa-inventory',
      'hard',
      'A US GAAP LIFO filer, Halden Forge, measures inventory at the lower of cost or market. Replacement cost is 30, net realizable value is 50, NRV less the normal profit margin is 36, and historical cost is 48. Which unit amount is the market ceiling-and-floor result used in the comparison with cost?',
      '36, because replacement cost below the floor is raised to NRV minus the normal margin, and that market amount is below cost.',
      '30, because market means raw replacement cost with no floor or ceiling.',
      '48, because LIFO inventory is never written down when replacement cost is positive.',
      'Under US GAAP, LIFO and the retail inventory method use the lower of cost or market, and market is replacement cost bounded by a ceiling of NRV and a floor of NRV less the normal profit margin. Replacement cost of 30 is below the floor of 36, so market is 36. Cost is 48, so the inventory is written down to 36. Unbounded replacement cost would overstate the loss. Leaving the units at historical cost ignores a market amount below cost. IFRS would instead compare cost with NRV of 50 and would not write the units down.',
    ),
    ask(
      'fsa-inventory',
      'hard',
      'Marlowe Instruments asks whether FIFO and LIFO cost of goods sold depend on the choice between a periodic and a perpetual inventory system. Which statement is most accurate?',
      'FIFO cost of goods sold is the same under periodic and perpetual systems. LIFO cost of goods sold can differ between them.',
      'LIFO cost of goods sold is the same under both systems, while FIFO differs whenever a sale occurs before the last purchase.',
      'Neither method is affected by the system, because periodic and perpetual records always liquidate the same layers.',
      'With FIFO, the oldest costs leave first whether you update continuously or only at period end, so periodic and perpetual FIFO match. With LIFO, a perpetual system can sell a layer that arrived earlier in the year before a later purchase exists, while a periodic system treats the last purchases of the whole period as sold. Those LIFO costs can differ. Weighted average (periodic) also differs from a moving average (perpetual).',
    ),
    ask(
      'fsa-inventory',
      'medium',
      'Purchase prices at Copperline Wire rose steadily all year. The firm can report under US GAAP using FIFO or LIFO. Relative to LIFO, which FIFO outcome is most accurate?',
      'FIFO produces lower cost of goods sold, higher ending inventory, higher pretax profit, and higher taxes.',
      'FIFO produces higher cost of goods sold, lower ending inventory, and a larger LIFO reserve.',
      'FIFO and LIFO report the same cost of goods sold whenever prices rise, and taxes differ only if the tax rate changes.',
      'When prices rise, FIFO puts older, cheaper units into cost of goods sold and leaves recent, expensive units in ending inventory. Profit and taxes are therefore higher than under LIFO, which is one reason a US taxpayer may prefer LIFO. The LIFO reserve is a LIFO disclosure, and it grows in this environment; it is not a FIFO output. The two methods do not report the same cost when prices move.',
    ),
  ]
}

function ltassets(): Draft[] {
  const profitLift = 150_000 - 150_000 / 5
  const straightLine = (480_000 - 30_000) / 9
  const declining = 480_000 * (2 / 9)
  const ifrsImpairment = 640_000 - Math.max(560_000, 590_000)
  const gain = 90_000 - (250_000 - 175_000)
  return [
    numQ(
      'fsa-ltassets',
      'easy',
      `Duneward Glass spends ${usd(150_000, 0)} at the start of the year on a kiln. If the cost is expensed, pretax profit falls by the full amount. If it is capitalized and depreciated straight line over five years with no salvage, year-1 depreciation is ${usd(30_000, 0)}. Relative to expensing, capitalizing raises year-1 pretax profit by an amount closest to ${inline(String.raw`150{,}000 - \frac{150{,}000}{5}`)}.`,
      profitLift,
      [150_000, 30_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Expensing recognizes ${usd(150_000, 0)} immediately. Capitalizing recognizes only this year’s depreciation. The pretax difference is ${inline(String.raw`150{,}000 - 30{,}000`)} = ${formatted}. In later years the capitalized asset still produces depreciation, so the early profit advantage reverses. Quoting the entire cash outlay, or quoting only the depreciation, does not measure the gap between the two accounting choices.`,
    ),
    ask(
      'fsa-ltassets',
      'medium',
      'The same kiln cash outflow is classified under US GAAP. Compared with expensing the kiln cost, what does capitalizing it do to the cash flow statement in the year of the spending?',
      'It moves the outflow from operating to investing, so CFO is higher by the full cash amount and CFI is lower by the same amount. Total cash is unchanged.',
      'It raises total cash, because capitalized assets generate an investing inflow equal to depreciation.',
      'It leaves every cash flow section unchanged, because the choice affects only the income statement.',
      'Capitalizing does not create cash. It reclassifies the outflow from CFO to investing. CFO is therefore higher, and investing cash flow is lower, by the full USD 150,000 relative to expensing. Depreciation of a capitalized cost is non-cash and does not offset that classification. Analysts who compare firms with different capitalization policies often put the spending back on a consistent line before ranking operating cash flow.',
    ),
    numQ(
      'fsa-ltassets',
      'easy',
      `Ridgewell Pumps buys equipment for ${usd(480_000, 0)}, expects a ${usd(30_000, 0)} salvage value, and uses straight-line depreciation over nine years. Annual depreciation is closest to ${inline(String.raw`\frac{480{,}000 - 30{,}000}{9}`)}.`,
      straightLine,
      [480_000 / 9, (480_000 - 30_000) / 8],
      (value) => usd(value, 0),
      (formatted) =>
        `Straight-line depreciation allocates depreciable amount, which is cost minus salvage, evenly over the useful life. ${inline(String.raw`\frac{450{,}000}{9}`)} equals ${formatted}. Ignoring salvage overstates the depreciable base. Shortening the denominator to eight years would force the asset to zero a year early and is not the estimate the firm adopted.`,
    ),
    numQ(
      'fsa-ltassets',
      'medium',
      `The same equipment cost ${usd(480_000, 0)} and has a nine-year life. Double-declining-balance depreciation in year 1, before any switch to straight line, is closest to ${inline(String.raw`480{,}000 \times \frac{2}{9}`)}.`,
      declining,
      [straightLine, ((480_000 - 30_000) * 2) / 9],
      (value) => usd(value, 0),
      (formatted) =>
        `Double-declining balance applies twice the straight-line rate to carrying amount and does not deduct salvage in the first year. The rate is 2/9, so ${inline(String.raw`480{,}000 \times \frac{2}{9}`)} equals ${formatted}. Straight-line depreciation is much smaller. Applying the double rate to cost minus salvage understates year-1 expense relative to the declining-balance method the question asks for.`,
    ),
    numQ(
      'fsa-ltassets',
      'hard',
      `Under IFRS, a kiln at Duneward Glass has a carrying amount of ${usd(640_000, 0)}. Value in use is ${usd(560_000, 0)} and fair value less costs of disposal is ${usd(590_000, 0)}. The impairment loss is closest to ${inline(String.raw`640{,}000 - \max(560{,}000,\ 590{,}000)`)}.`,
      ifrsImpairment,
      [640_000 - 560_000, 0],
      (value) => usd(value, 0),
      (formatted) =>
        `Under IFRS the recoverable amount is the higher of value in use and fair value less costs of disposal. That amount is ${usd(590_000, 0)}, so the loss is ${formatted}. ${inline(String.raw`640{,}000 - 590{,}000`)} uses the higher of the two recoveries. Using the lower one would overstate the loss. A zero loss would be the US GAAP recoverability result only if undiscounted cash flows covered the carrying amount, which is a different test.`,
    ),
    ask(
      'fsa-ltassets',
      'hard',
      'The same kiln has a carrying amount of 640,000. Undiscounted future cash flows are 700,000 and fair value is 590,000. Under US GAAP, for an asset to be held and used, what impairment loss is recognized?',
      'No impairment loss, because undiscounted cash flows exceed the carrying amount, so the recoverability test is passed.',
      'A loss of 50,000, because US GAAP always compares carrying amount with fair value in one step.',
      'A loss of 80,000, because US GAAP uses value in use and ignores the recoverability screen.',
      'US GAAP tests recoverability of assets to be held and used with undiscounted future cash flows. Those cash flows, 700,000, exceed the carrying amount, 640,000, so the asset is recoverable and no impairment loss is recognized even though fair value is lower. IFRS would have compared the carrying amount with the higher of value in use and fair value less costs, without an undiscounted screen. The two frameworks can therefore disagree on whether a loss exists.',
    ),
    ask(
      'fsa-ltassets',
      'medium',
      'Oakmere Furniture reports under IFRS and elects the revaluation model for a class of equipment. Carrying amount is 300,000 and the revalued amount is 380,000. There is no prior revaluation loss. How is the increase reported, and could a US GAAP filer do the same?',
      'The 80,000 increase goes to other comprehensive income as a revaluation surplus. US GAAP does not permit the revaluation model.',
      'The 80,000 increase is profit from continuing operations under both IFRS and US GAAP.',
      'The increase is a direct credit to cash, because revaluation is treated as an investing inflow under IFRS only.',
      'IFRS allows a revaluation model for property, plant, and equipment. An increase above carrying amount, when no prior loss is being reversed, is recognized in OCI and accumulated in equity as a revaluation surplus, not in profit. US GAAP requires the cost model and does not permit that write-up. Revaluation is not cash and does not appear as an investing inflow.',
    ),
    ask(
      'fsa-ltassets',
      'medium',
      'Fernwhistle Paper finishes the research phase of a new pulping process and begins development. Technical feasibility, intention, ability, probable benefits, resources, and reliable measurement are all documented. How do IFRS and US GAAP treat the development spending?',
      'IFRS capitalizes qualifying development costs. US GAAP generally expenses research and development, with limited software exceptions.',
      'Both frameworks capitalize research and development once management approves the project budget.',
      'Both frameworks expense development, and IFRS capitalizes the earlier research phase instead.',
      'Research is expensed under both frameworks. IFRS capitalizes development when the IAS 38 criteria are met, including technical feasibility and probable future economic benefits that can be measured reliably. US GAAP generally expenses R&D as incurred. Software developed for sale or for internal use has specific US GAAP exceptions, but a pulping process does not become a capitalized asset just because a budget was approved. The research phase itself stays an expense even under IFRS.',
    ),
    numQ(
      'fsa-ltassets',
      'easy',
      `Lowtide Boatworks sells a dry dock that cost ${usd(250_000, 0)} and has accumulated depreciation of ${usd(175_000, 0)}. Cash proceeds are ${usd(90_000, 0)}. The gain on derecognition is closest to ${inline(String.raw`90{,}000 - (250{,}000 - 175{,}000)`)}.`,
      gain,
      [90_000, 250_000 - 175_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Derecognition removes the cost and the accumulated depreciation. Carrying amount is ${usd(75_000, 0)}. Proceeds above that carrying amount are a gain of ${formatted}. ${inline(String.raw`90{,}000 - 75{,}000`)} is the comparison. The cash proceeds are an investing inflow, but they are not the gain. The carrying amount is what leaves the balance sheet, not what is reported as profit.`,
    ),
    ask(
      'fsa-ltassets',
      'medium',
      'Aster Dock Services owns a renewable operating license that it expects to renew indefinitely, with evidence that renewal will be granted at insignificant cost. It also owns a patent with eight years of legal life left. How are the two intangibles amortized?',
      'The renewable license is indefinite-lived and is not amortized; it is tested for impairment. The patent is amortized over its remaining useful life.',
      'Both assets are amortized over eight years, because no intangible may have an indefinite life under IFRS or US GAAP.',
      'Neither asset is amortized. Both are written off only if the firm is liquidated.',
      'An intangible with a finite legal or economic life is amortized. A license that is expected to be renewed indefinitely, when renewal evidence supports that view, has an indefinite useful life and is not amortized under IFRS or US GAAP. It is tested for impairment. Indefinite does not mean permanent: if renewal stops being likely, the asset becomes finite and amortization starts. A patent with a remaining legal life is a finite-lived intangible.',
    ),
  ]
}

function liabilities(): Draft[] {
  const leaseLiability = math.annuityPv(40_000, 0.06, 5)
  const leaseDue = leaseLiability * 1.06
  const contribution = 5_000_000 * 0.07
  const interestExpense = 940_000 * 0.06
  const endingDiscount = 940_000 + (interestExpense - 40_000)
  const endingPremium = 1_080_000 - (70_000 - 1_080_000 * 0.05)
  const annualGrant = 1_200_000 / 4
  return [
    ask(
      'fsa-liabilities',
      'easy',
      'On the first day of a multi-year equipment lease, the lessee at Nimbus Parcel recognizes neither an asset nor a liability because the contract is called a lease rather than a loan. Under current IFRS and US GAAP lessee accounting, which statement is most accurate?',
      'The lessee recognizes a right-of-use asset and a lease liability for a lease that is not a short-term or other scoped exception.',
      'Lessees recognize the liability only under IFRS. US GAAP keeps every lease off the balance sheet.',
      'Lessees recognize rent expense only, and neither framework puts a lease liability on the balance sheet.',
      'Current lessee accounting puts nearly all leases on the balance sheet as a right-of-use asset and a lease liability. IFRS 16 uses one lessee model aside from short-term and low-value exceptions. US GAAP also recognizes the asset and liability, then splits leases into operating and finance leases for expense and cash-flow presentation. Calling the contract a lease does not by itself keep it off the books.',
    ),
    numQ(
      'fsa-liabilities',
      'medium',
      `Plover Medical Supply signs a lease with five year-end payments of ${usd(40_000, 0)}. The rate implicit in the lease is 6%, and the payments are an ordinary annuity. The initial lease liability is closest to ${inline(String.raw`40{,}000 \times \frac{1 - (1.06)^{-5}}{0.06}`)}.`,
      leaseLiability,
      [40_000 * 5, leaseDue],
      (value) => usd(value, 0),
      (formatted) =>
        `The lease liability starts at the present value of unpaid lease payments. For an ordinary annuity, ${inline(String.raw`40{,}000 \times \frac{1-(1.06)^{-5}}{0.06}`)} equals ${formatted}. The undiscounted sum of ${usd(200_000, 0)} ignores the time value of money. An annuity-due factor would fit payments at the beginning of each year, which this contract does not use.`,
    ),
    ask(
      'fsa-liabilities',
      'hard',
      'A US GAAP lessee classifies one equipment contract as a finance lease and another as an operating lease. Both are recognized on the balance sheet. Which presentation difference is most accurate?',
      'The finance lease expenses depreciation plus interest, so the total is front-loaded, and the principal payment is financing cash flow. The operating lease generally expenses a single straight-line lease cost, and the cash payment is operating.',
      'Both leases expense a single straight-line rent cost, and both cash payments are financing.',
      'The operating lease is off balance sheet, while the finance lease expenses only interest and never depreciates the right-of-use asset.',
      'US GAAP still distinguishes operating and finance leases after both are recognized. Finance-lease expense is interest plus amortization and is usually higher in the early years. Cash principal is financing and cash interest is operating. Operating-lease expense is generally a single straight-line cost, and the cash lease payment is classified as operating. IFRS lessees do not keep that operating-lease expense pattern; they recognize depreciation and interest.',
    ),
    ask(
      'fsa-liabilities',
      'medium',
      'An IFRS lessee at Bramble Transit has a five-year equipment lease that is neither short-term nor low value. How does the income statement and the cash flow statement present it?',
      'Depreciation of the right-of-use asset and interest on the liability hit profit, so expense is typically front-loaded. Principal is a financing outflow, and interest follows the firm’s policy for interest paid.',
      'A single straight-line operating rent expense is required, and the entire cash payment is investing.',
      'The lease is disclosed only in the notes, with no expense until the final bargain purchase payment.',
      'IFRS 16 uses one lessee model for this contract. The right-of-use asset is depreciated and the liability produces interest, so total expense is typically higher early in the lease than a straight-line rent figure. In the cash flow statement, the principal portion is financing. The interest portion is operating or financing, consistent with the firm’s policy for interest paid. There is no US-style operating-lease expense pattern and no investing classification of the rent.',
    ),
    numQ(
      'fsa-liabilities',
      'easy',
      `Maplehour Dairy sponsors a defined-contribution plan and is committed to contribute 7% of the year’s eligible salaries of ${usd(5_000_000, 0)}. It has no obligation to guarantee the investment result. Pension expense for the year is closest to ${inline(String.raw`0.07 \times 5{,}000{,}000`)}.`,
      contribution,
      [0, 5_000_000],
      (value) => usd(value, 0),
      (formatted) =>
        `A defined-contribution expense is the contribution the employer owes for the period. ${inline(String.raw`0.07 \times 5{,}000{,}000`)} equals ${formatted}. The employees bear the investment risk, so the employer does not accrue actuarial gains and losses. Expensing the entire payroll would treat wages and the retirement contribution as the same line, and recording nothing would ignore a cost that has been earned.`,
    ),
    ask(
      'fsa-liabilities',
      'medium',
      'Stoneferry Cement promises retirees a benefit based on final salary and years of service. Plan assets are invested in a mix chosen by the company, and the company must fund any shortfall. Which statement about this defined-benefit plan is most accurate?',
      'The employer bears the investment and actuarial risk. The balance sheet shows the plan’s funded status, not just the cash contributed this year.',
      'The employer’s expense equals the cash contribution, and the plan assets stay off the employer’s disclosures.',
      'Employees bear the longevity risk, so an underfunded plan is an off-balance-sheet contingency with no recognized liability.',
      'In a defined-benefit plan the employer promises a benefit, so investment performance, salary growth, and longevity sit with the employer. The recognized net position is the funded status: the obligation minus the plan assets. That is different from a defined-contribution plan, where expense is the contribution and the employees bear the investment outcome. Underfunding is not ignored merely because it will be paid in later years.',
    ),
    numQ(
      'fsa-liabilities',
      'medium',
      `Kite & Lantern Retail grants employees equity-settled share options with a total grant-date fair value of ${usd(1_200_000, 0)}. The options cliff-vest after four years of service. Forfeitures are expected to be zero, and the share price doubles in year 1. Year-1 compensation expense is closest to ${inline(String.raw`\frac{1{,}200{,}000}{4}`)}.`,
      annualGrant,
      [0, 1_200_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Equity-settled share-based payment is measured at grant-date fair value and recognized as compensation expense over the vesting period. ${inline(String.raw`\frac{1{,}200{,}000}{4}`)} equals ${formatted}. The award is not free, and expense does not wait until vesting day. A later share-price increase does not remeasure an equity-settled award. Cash-settled awards are different: those liabilities are remeasured until settlement.`,
    ),
    numQ(
      'fsa-liabilities',
      'hard',
      `On 1 January, Yarrow Dental Labs has a bond liability with a carrying amount of ${usd(940_000, 0)}. The bonds have a face value of ${usd(1_000_000, 0)} and a 4% annual coupon. The effective interest rate at issuance was 6%. Using the effective-interest method, the year-end carrying amount is closest to ${inline(String.raw`940{,}000 + (940{,}000 \times 0.06 - 40{,}000)`)}.`,
      endingDiscount,
      [940_000, 1_000_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Interest expense is carrying amount times the effective rate, ${usd(interestExpense, 0)}. The coupon cash is ${usd(40_000, 0)}. The difference amortizes the discount and increases the liability. ${inline(String.raw`940{,}000 + 16{,}400`)} equals ${formatted}. Leaving the carrying amount unchanged would be a cash-coupon method. Jumping straight to face value recognizes the entire remaining discount in one year.`,
    ),
    numQ(
      'fsa-liabilities',
      'hard',
      `Ivorstead Tools carries a bond at ${usd(1_080_000, 0)}. Face value is ${usd(1_000_000, 0)}, the annual coupon is 7%, and the effective rate at issuance was 5%. After one year of effective-interest amortization, the carrying amount is closest to ${inline(String.raw`1{,}080{,}000 - (70{,}000 - 1{,}080{,}000 \times 0.05)`)}.`,
      endingPremium,
      [1_080_000 + (70_000 - 1_080_000 * 0.05), 1_080_000 - 70_000],
      (value) => usd(value, 0),
      (formatted) =>
        `On a premium bond, interest expense is below the cash coupon. The extra cash paid amortizes the premium and pulls the carrying amount down toward face. ${inline(String.raw`1{,}080{,}000 - (70{,}000 - 54{,}000)`)} equals ${formatted}. Adding the amortization would move the liability away from face. Subtracting the entire coupon ignores the portion that is interest expense rather than principal amortization.`,
    ),
    ask(
      'fsa-liabilities',
      'medium',
      'Copperline Wire has a long-term note with a debt covenant requiring a current ratio of at least 1.5. At year-end the ratio is 1.2, and the lender has not granted a waiver. The note’s contractual maturity is still four years away. Why does the classification matter to a liquidity analysis?',
      'Without a waiver or an unconditional right to defer settlement, the debt can become currently payable, so a long contractual maturity no longer means the cash outflow is distant.',
      'Covenant breaches are disclosed only in the auditor’s opinion and never change the current and noncurrent split.',
      'A breached covenant converts the note into equity, which raises the current ratio back above the threshold.',
      'Debt classification follows the rights that exist at the reporting date. If a breach makes the debt repayable on demand and the lender has not waived that right, the liability is current even though the original maturity date is years away. That reclassification can worsen every liquidity ratio that uses current liabilities. It does not convert debt into equity, and it is not confined to the audit report.',
    ),
  ]
}

function tax(): Draft[] {
  const pretax = 2_000_000
  const muni = 200_000
  const excessDep = 400_000
  const rate = 0.25
  const taxable = pretax - muni - excessDep
  const currentTax = taxable * rate
  const deferredTax = excessDep * rate
  const taxExpense = currentTax + deferredTax
  const etr = taxExpense / pretax
  const cashRate = currentTax / pretax
  const simplePayable = (1_500_000 - 200_000) * 0.3
  const simpleExpense = 1_500_000 * 0.3
  const dtlIncrease = simpleExpense - simplePayable
  const warrantyDta = 90_000 * 0.21
  const rateIncrease = 800_000 * (0.28 - 0.2)
  const unearnedDta = 100_000 * 0.25
  return [
    numQ(
      'fsa-tax',
      'medium',
      `Lumenford Lighting’s pretax accounting profit is ${usd(pretax, 0)}. It includes ${usd(muni, 0)} of tax-exempt municipal interest. Tax depreciation exceeds book depreciation by ${usd(excessDep, 0)}. The tax rate is 25%, and taxes assessed this year are paid this year. The effective tax rate, tax expense divided by pretax accounting profit, is closest to ${inline(String.raw`\frac{450{,}000}{2{,}000{,}000}`)}.`,
      etr,
      [0.25, cashRate],
      (value) => pct(value, 2),
      (formatted) =>
        `Taxable profit is pretax profit minus the permanent exemption minus the temporary depreciation difference, so current tax is ${usd(currentTax, 0)}. Deferred tax expense on the taxable temporary difference is ${usd(deferredTax, 0)}. Tax expense is ${usd(taxExpense, 0)}. ${inline(String.raw`\frac{450{,}000}{2{,}000{,}000}`)} equals ${formatted}. The statutory 25% ignores the permanent difference. The cash tax rate of ${pct(cashRate, 2)} uses taxes paid rather than tax expense.`,
    ),
    numQ(
      'fsa-tax',
      'medium',
      `Using Lumenford’s facts — pretax profit ${usd(pretax, 0)}, tax-exempt interest ${usd(muni, 0)}, excess tax depreciation ${usd(excessDep, 0)}, a 25% rate, and current tax paid in full — the cash tax rate is closest to ${inline(String.raw`\frac{350{,}000}{2{,}000{,}000}`)}.`,
      cashRate,
      [etr, 0.25],
      (value) => pct(value, 2),
      (formatted) =>
        `The cash tax rate divides taxes paid by pretax accounting profit. Taxes paid equal current tax of ${usd(currentTax, 0)}, not tax expense. ${inline(String.raw`\frac{350{,}000}{2{,}000{,}000}`)} equals ${formatted}. The effective rate of ${pct(etr, 2)} includes deferred tax expense that was not paid this year. The statutory rate ignores both the permanent exemption and the timing difference.`,
    ),
    numQ(
      'fsa-tax',
      'easy',
      `Under both IFRS and US GAAP, Harbor Loom has pretax book profit of ${usd(1_500_000, 0)}. Tax depreciation is ${usd(200_000, 0)} higher than book depreciation, and there are no permanent differences. The enacted tax rate is 30%. Taxes payable for the year are closest to ${inline(String.raw`(1{,}500{,}000 - 200{,}000) \times 0.30`)}.`,
      simplePayable,
      [simpleExpense, 200_000 * 0.3],
      (value) => usd(value, 0),
      (formatted) =>
        `Faster tax depreciation makes taxable profit lower than book profit. Taxes payable are ${formatted}. ${inline(String.raw`1{,}300{,}000 \times 0.30`)} is that current tax. Tax expense of ${usd(simpleExpense, 0)} is larger because it includes deferred tax on the temporary difference. The depreciation difference times the rate is the deferred amount, not the cash tax.`,
    ),
    numQ(
      'fsa-tax',
      'medium',
      `Harbor Loom’s only temporary difference is the ${usd(200_000, 0)} of extra tax depreciation, and the rate is 30%. The increase in the deferred tax liability is closest to ${inline(String.raw`200{,}000 \times 0.30`)}.`,
      dtlIncrease,
      [simplePayable, simpleExpense],
      (value) => usd(value, 0),
      (formatted) =>
        `A taxable temporary difference from accelerated tax depreciation creates a deferred tax liability. The increase is the difference times the rate, ${formatted}. ${inline(String.raw`200{,}000 \times 0.30`)} equals tax expense of ${usd(simpleExpense, 0)} minus taxes payable of ${usd(simplePayable, 0)}. Taxes payable are lower than tax expense. Quoting either the whole tax expense or the whole current tax misses the deferred piece that will reverse when book depreciation later catches up.`,
    ),
    ask(
      'fsa-tax',
      'easy',
      'Because Harbor Loom’s tax depreciation is faster than its book depreciation, taxes payable are below tax expense and a deferred tax liability increases. Which economic reading of that deferred tax liability is most accurate?',
      'The firm has postponed cash tax relative to the tax expense recognized in profit. The postponement reverses if the depreciation difference turns around.',
      'The firm has paid more cash tax than it recognized as expense, so the balance is a deferred tax asset.',
      'The balance is a permanent saving and will never reverse, because tax depreciation is always faster.',
      'Accelerated tax depreciation lowers taxable income now, so cash tax is below the book tax expense. That gap is a deferred tax liability, not an asset. It is a timing difference: as the asset ages, book depreciation can exceed tax depreciation and the liability reverses. It is not a permanent difference such as tax-exempt interest, which changes the effective rate and does not create a deferred balance.',
    ),
    numQ(
      'fsa-tax',
      'medium',
      `Whitecap Fisheries accrues a warranty expense of ${usd(90_000, 0)} that will be deductible on the tax return only when the repairs are paid. The tax rate is 21%. The originating deferred tax asset is closest to ${inline(String.raw`90{,}000 \times 0.21`)}.`,
      warrantyDta,
      [90_000, 90_000 * (1 - 0.21)],
      (value) => usd(value, 0),
      (formatted) =>
        `The warranty reduces book profit now and taxable profit later, so the firm pays more tax today than the book expense implies. That prepaid tax is a deferred tax asset of ${formatted}. ${inline(String.raw`90{,}000 \times 0.21`)} measures the future tax saving. The full accrual is the accounting expense, not the deferred tax. The after-tax accrual is the profit effect, not the balance-sheet tax asset.`,
    ),
    ask(
      'fsa-tax',
      'hard',
      'Under US GAAP, Sable Courier has a deferred tax asset and raises the valuation allowance because new evidence says it is more likely than not that part of the asset will not be realized. What is the profit effect of increasing the allowance?',
      'Income tax expense rises by the increase in the valuation allowance, and the net deferred tax asset falls.',
      'Income tax expense falls, because a larger allowance is a direct credit to revenue.',
      'The allowance increase is recorded in other comprehensive income and does not affect tax expense or the net asset.',
      'US GAAP recognizes a deferred tax asset and then reduces it with a valuation allowance when realization is not more likely than not. Increasing that allowance raises income tax expense and lowers the net asset. It is not revenue and it is not an OCI item in the ordinary case of an operating temporary difference. IFRS does not use a valuation-allowance account; it recognizes the deferred tax asset only to the extent it is probable that taxable profit will be available.',
    ),
    numQ(
      'fsa-tax',
      'hard',
      `A deferred tax liability was measured on a taxable temporary difference of ${usd(800_000, 0)} at an enacted 20% rate. The enacted rate rises to 28% and no other facts change. Under US GAAP, the increase in tax expense from remeasuring the liability is closest to ${inline(String.raw`800{,}000 \times (0.28 - 0.20)`)}.`,
      rateIncrease,
      [800_000 * 0.28, 800_000 * 0.2],
      (value) => usd(value, 0),
      (formatted) =>
        `Deferred taxes are remeasured when the enacted rate changes. The liability moves from ${usd(160_000, 0)} to ${usd(224_000, 0)}, and the ${formatted} increase is deferred tax expense. ${inline(String.raw`800{,}000 \times 0.08`)} is that increment. Reporting the entire new liability, or the old liability, as this year’s tax expense double counts a balance that was already on the statement.`,
    ),
    ask(
      'fsa-tax',
      'medium',
      'Ironleaf Packaging has a deferred tax liability that will reverse next year when accelerated tax depreciation turns around, and a deferred tax asset that will reverse in eight years. How are the two balances classified on the balance sheet under current IFRS and US GAAP?',
      'Both are classified as noncurrent. Deferred tax balances are not split into current and noncurrent by the timing of reversal.',
      'The one-year liability is current and the eight-year asset is noncurrent.',
      'Both are current, because deferred taxes are always settled with the next tax payment.',
      'Under current IFRS and US GAAP, deferred tax assets and liabilities are presented as noncurrent. The old practice of classifying each temporary difference by the current or noncurrent character of the related asset, or by the year of reversal, is gone. A reversal next year does not make the deferred tax liability a current liability. The cash tax next year will show up in taxes payable, which is a separate current amount.',
    ),
    ask(
      'fsa-tax',
      'hard',
      'A tax-rate cut has cleared the legislature and, under the jurisdiction’s process, the remaining signature is considered perfunctory. The new rate is therefore substantively enacted but not yet enacted. Which measurement difference is most accurate?',
      'IFRS may measure deferred taxes at the substantively enacted rate. US GAAP waits for the enacted rate.',
      'Both frameworks must keep using the old rate until the first tax return is filed under the new rate.',
      'US GAAP uses the substantively enacted rate, and IFRS uses only rates that have already appeared on a filed return.',
      'The measurement rate is a known IFRS and US GAAP difference. US GAAP uses enacted tax rates. IFRS uses rates that are enacted or substantively enacted by the reporting date. A rate that is only proposed does not qualify under either description. Waiting for the next filed return would leave the existing deferred tax balance on a stale rate after the law is already in force.',
    ),
    numQ(
      'fsa-tax',
      'easy',
      `Veldt Mill’s current tax payable for the year is ${usd(410_000, 0)} and its deferred tax expense is ${usd(55_000, 0)}. There is no tax charged to OCI. Income tax expense in profit or loss is closest to ${inline(String.raw`410{,}000 + 55{,}000`)}.`,
      410_000 + 55_000,
      [410_000, 410_000 - 55_000],
      (value) => usd(value, 0),
      (formatted) =>
        `Total tax expense recognized in profit is current tax plus deferred tax expense, when none of the tax is allocated to OCI or equity. ${inline(String.raw`410{,}000 + 55{,}000`)} equals ${formatted}. Current tax alone is the cash or payable figure. Subtracting the deferred expense would describe a firm whose deferred taxes reduced expense, which is the opposite of a deferred tax expense.`,
    ),
    ask(
      'fsa-tax',
      'medium',
      'Quill & Copper Press has a tax loss this year that the tax law allows it to carry forward against future taxable profits. Management expects those profits, but not with certainty. How does the loss become a deferred tax asset?',
      'The carryforward can create a deferred tax asset, recognized under IFRS only to the extent realization is probable and reduced under US GAAP by a valuation allowance if realization is not more likely than not.',
      'A tax-loss carryforward is a permanent difference, so it lowers the effective rate and never creates a deferred tax asset.',
      'Both frameworks recognize the full carryforward as an asset with no realizability test.',
      'A loss carryforward is a deductible temporary difference: the tax saving arrives in a later year when taxable profit is available. That future saving is a deferred tax asset, subject to a realizability screen. IFRS recognizes it to the extent it is probable. US GAAP recognizes it and then applies a valuation allowance when more-likely-than-not realization fails. It is not a permanent difference, and it is not booked in full while ignoring whether future profits exist.',
    ),
    numQ(
      'fsa-tax',
      'medium',
      `Bramble Transit collects ${usd(100_000, 0)} of rent in December that is taxable on receipt and will be recognized as accounting revenue next year. The tax rate is 25%. The deferred tax asset originating this year is closest to ${inline(String.raw`100{,}000 \times 0.25`)}.`,
      unearnedDta,
      [100_000, 100_000 * 0.75],
      (value) => usd(value, 0),
      (formatted) =>
        `Tax is paid now on cash the books have not yet earned, so taxable profit is temporarily higher than book profit. The tax already paid is a deferred tax asset of ${formatted}, which reverses when the rent becomes accounting revenue. ${inline(String.raw`100{,}000 \times 0.25`)} is the tax on that timing difference. The full cash receipt is a contract liability, not the tax asset, and the after-tax cash is not a deferred tax balance.`,
    ),
    ask(
      'fsa-tax',
      'easy',
      'An analyst comparing two years at Fable Press sees tax expense steady near the statutory rate while taxes paid fall, and the decline is explained by a growing deferred tax liability from equipment. Which interpretation is most accurate?',
      'The effective tax rate can stay near the statutory rate while the cash tax rate falls, because the depreciation timing difference postpones cash tax.',
      'A growing deferred tax liability means the effective tax rate and the cash tax rate are the same number.',
      'Taxes paid are the numerator of the effective tax rate, so the effective rate must fall whenever the liability grows.',
      'The effective tax rate uses tax expense. The cash tax rate uses taxes paid. Accelerated tax depreciation creates a deferred tax liability and lowers taxes payable relative to tax expense, so the cash rate can fall while the effective rate stays close to the statutory rate. The two rates are not the same number. Using taxes paid in the effective-rate numerator would erase the distinction the deferred tax balance is there to explain.',
    ),
  ]
}

function quality(): Draft[] {
  return [
    ask(
      'fsa-quality',
      'easy',
      'Northglass Ceramics lengthens the useful lives of its kilns in a year when sales are flat. The change cuts depreciation and lifts operating profit. No technology change supports the longer lives. How should an analyst label the choice?',
      'Aggressive, because a longer life pulls depreciation out of the current period and raises current profit.',
      'Conservative, because any change in an estimate is a cautious delay of profit.',
      'Neutral, because useful-life changes are prohibited from affecting profit under IFRS and US GAAP.',
      'Extending useful lives without new evidence reduces current depreciation and shifts expense into later years. That brings profit forward and is an aggressive bias. A conservative bias would expense sooner, for example by shortening lives or impairing earlier. Estimate changes are allowed, and they do affect profit prospectively, which is why the analyst asks whether the new life is evidence or a target.',
    ),
    ask(
      'fsa-quality',
      'medium',
      'In the last week of the quarter, Kite & Lantern Retail ships extra goods to dealers and records the sales. The dealers have an unlimited right to return unsold goods, and history shows a large share comes back. Which reporting risk is this?',
      'Channel stuffing, which recognizes revenue before the performance obligation is really satisfied and borrows sales from the next period.',
      'A cookie-jar reserve, which over-accrues an expense today so it can be released as profit later.',
      'A LIFO liquidation, which raises profit by selling old inventory layers.',
      'Pushing unordered or returnable goods into the channel records revenue the firm has not earned and often inflates receivables. Later returns or discounts reverse the picture. A cookie-jar reserve is an expense accrual, not a fake shipment. LIFO liquidation is an inventory-cost effect. The warning signs here are quarter-end volume, loose return rights, and receivables that grow faster than sell-through.',
    ),
    ask(
      'fsa-quality',
      'medium',
      'During a strong year, Orchard Line Grocers accrues an unusually large restructuring provision that it does not use. The next year, when sales disappoint, it reverses the unused provision into profit. What is that pattern called?',
      'A cookie-jar or rainy-day reserve: over-accruing in a good year and releasing the accrual to smooth a weak year.',
      'Conservative revenue recognition, because the reversal proves the original expense was too small.',
      'A change in accounting principle that must be applied retrospectively to inventory.',
      'Building an excessive liability and later releasing it moves profit from a strong year into a weak year. The earnings look smoother than the business was. That is a cookie-jar reserve, and it is an aggressive use of the later reversal even though the original accrual looked cautious. It is not evidence that the first expense was too small, and it is not an inventory accounting-principle change.',
    ),
    ask(
      'fsa-quality',
      'medium',
      'Every year for five years, Pinion Analytics excludes “nonrecurring” restructuring and stock-based pay from its headline non-GAAP profit. Both items appear again in the current year. Which reading is most careful?',
      'Repeated exclusions of the same costs can overstate sustainable earnings even when each release reconciles the figure to GAAP.',
      'A reconciled non-GAAP figure is a better measure of profit than GAAP whenever management prefers it.',
      'Stock-based pay is not a cost, so excluding it every year is required under IFRS and US GAAP.',
      'Non-GAAP measures are allowed when they are reconciled and explained, but quality suffers when the adjustments are permanent costs wearing a one-time label. Restructuring that returns every year, and share-based pay that is ordinary compensation, are part of the cost of staying in business. A reconciliation does not make the adjusted number the better measure of sustainable earnings. Neither framework requires those exclusions from GAAP profit.',
    ),
    ask(
      'fsa-quality',
      'easy',
      'Sales at Sablefinch Apparel grew 6% this year while accounts receivable grew 28%. The allowance for doubtful accounts fell as a percentage of receivables. Which question should the analyst ask first?',
      'Whether revenue and collections are deteriorating, because receivables are outgrowing sales and the loss allowance is getting thinner.',
      'Whether depreciation lives are too short, because receivable growth is caused by accelerated depreciation.',
      'Whether the inventory LIFO reserve is too large, because receivable spikes are a LIFO disclosure.',
      'Receivables should roughly track credit sales if collection terms and customer quality are stable. Faster receivable growth, plus a smaller allowance ratio, can mean channel stuffing, extended terms, or an allowance that is no longer enough. Those are earnings-quality warnings. They are not explained by depreciation lives or by the LIFO reserve, which relates to inventory layers rather than to customer balances.',
    ),
    ask(
      'fsa-quality',
      'medium',
      'For four years, net income at Lowtide Boatworks has risen while cash from operations has stayed below net income and the gap has widened. Capital spending is modest and there is no large one-time gain. Which interpretation is most accurate?',
      'Persistent accrual earnings without cash conversion are a warning that profit may be coming from working-capital builds or soft estimates rather than from collected sales.',
      'CFO below net income is required whenever depreciation is positive, so the gap has no information.',
      'The pattern is conservative, because delaying cash collections always understates revenue.',
      'Depreciation makes CFO differ from net income in a single year, but a widening gap over several years, with modest capital spending and no gain to explain it, points to accruals: receivables, inventory, capitalized costs, or reserves. High-quality earnings eventually turn into cash. The pattern is not conservative. Delaying collection does not by itself mean revenue was understated; it may mean revenue was recognized too soon.',
    ),
    ask(
      'fsa-quality',
      'easy',
      'An investment memo calls Mossbank Textiles “high quality” because it beat the consensus earnings number. The beat came from a gain on selling a warehouse, and operating margins fell. Which use of the word quality is most accurate?',
      'High-quality earnings are sustainable and adequate, not merely a number that exceeds a forecast. A one-time gain is low-quality earnings even if it beats consensus.',
      'Any earnings beat is high quality by definition, whatever its source.',
      'High-quality reporting means the firm never recognizes gains in net income.',
      'Earnings quality is about whether the profit is repeatable and economically real. A warehouse sale can be faithfully reported and still be a poor base for a forecast. Decision-useful reporting can be high quality even in a weak year; that is a comment on the disclosure, not a claim that the gain will recur. Beating a forecast is not the definition. Gains on real disposals are recognized in net income; quality analysis separates them instead of pretending they are forbidden.',
    ),
    ask(
      'fsa-quality',
      'hard',
      'Fernwhistle Paper meets every IFRS criterion to capitalize a development project, then expenses the entire cost anyway in a profitable year. Which bias is that, relative to the applicable IFRS treatment?',
      'Conservative, because expensing a qualifying development cost recognizes the cost sooner and lowers current profit.',
      'Aggressive, because any departure from the firm’s usual policy raises current profit.',
      'Neutral, because IFRS gives a free choice to expense or capitalize development once the criteria are met.',
      'When the IFRS criteria are met, development costs are capitalized. Choosing to expense them anyway, if that choice were acceptable, would pull expense forward and depress current profit, which is a conservative bias. It is not aggressive, and it does not raise profit. The criteria are not an optional menu: failing them means expense, and meeting them means capitalize. An analyst still asks whether the “criteria met” judgment itself is being used aggressively in other years.',
    ),
    ask(
      'fsa-quality',
      'medium',
      'The aging of receivables at Redcedar Cabinetry worsened, with more balances past 90 days, but the allowance for doubtful accounts fell both in dollars and as a percentage of receivables. What does that combination suggest?',
      'The allowance may be understated, which would overstate receivables and current profit. That is an aggressive accrual estimate.',
      'A lower allowance is the required result of a worse aging, so profit is unaffected.',
      'The change is conservative, because a smaller allowance reduces assets and therefore reduces risk.',
      'A worse aging normally supports a larger allowance, not a smaller one. Cutting the allowance reduces bad-debt expense and increases profit and net receivables. That brings earnings forward and is aggressive. A smaller allowance increases assets; it does not reduce them. The conservative direction, if the aging has deteriorated, is a larger provision, not a release.',
    ),
    ask(
      'fsa-quality',
      'hard',
      'Marlowe Instruments bills a customer for pumps that remain in Marlowe’s warehouse. The customer did not request the arrangement, has not taken title, and Marlowe can still redirect the pumps to other buyers. Management records the revenue. Which description is most accurate?',
      'This bill-and-hold arrangement does not meet the conditions for revenue recognition and is an aggressive acceleration of sales.',
      'Billing alone satisfies the performance obligation under IFRS and US GAAP, so the revenue is timely.',
      'The transaction is a financing inflow and should be recorded as debt, with no earnings-quality implication.',
      'Bill-and-hold revenue requires a substantive reason, the customer’s request, transfer of control, a separately identified product, and readiness for delivery. Here the seller still controls the goods and can redirect them, so recognizing revenue is not supported. It inflates sales and receivables. The cash, if collected, is closer to a customer deposit than to earned revenue. The quality issue is real even if the cash-flow line is later corrected.',
    ),
    ask(
      'fsa-quality',
      'medium',
      'A large share of Aster Dock Services’ revenue comes from a company controlled by the chief executive’s family. The notes mention the relationship in one sentence and do not disclose the terms. Receivables from that customer are older than third-party receivables. Why is this a reporting-quality warning?',
      'Related-party sales can be executed at non-market terms, and thin disclosure plus slower collection makes it harder to judge whether the revenue is arm’s length and collectible.',
      'Related-party revenue is prohibited, so the mere existence of the customer requires an adverse audit opinion.',
      'Family-controlled customers must be consolidated, and receivables from them are always eliminated, so the aging is irrelevant.',
      'Related-party transactions are not automatically improper, and they do not automatically require consolidation unless control exists the other way. They do require enough disclosure to see price, volume, and terms. Older related-party receivables raise the chance that revenue or price was arranged to hit a target and that collection is soft. The warning is incomplete disclosure plus unusual terms, not a rule that the audit opinion must be adverse.',
    ),
    ask(
      'fsa-quality',
      'hard',
      'Two filings bother an analyst. One firm stays inside the standards but consistently chooses the most income-increasing estimate the range allows. Another firm invents sales invoices. How should the analyst separate those problems?',
      'The first is biased but possibly compliant reporting. The second is fraudulent reporting. Both can mislead a forecast, and the biased file can still receive a clean audit opinion.',
      'Both are the same event, because any aggressive estimate is fraud and both require a disclaimer of opinion.',
      'Neither affects earnings quality if the cash flow statement reconciles to the balance-sheet cash balance.',
      'Reporting quality sits on a spectrum. Choices can be faithful and neutral, faithfully compliant but biased, or outside the standards entirely. A clean opinion speaks to fair presentation within materiality; it does not mean every estimate was the most sustainable choice. Invented invoices are misstatements of a different kind. A cash-flow statement that ties to the cash account does not rehabilitate fictitious revenue, because the fictitious sale may never have collected cash and may sit in receivables instead.',
    ),
  ]
}

function ratios(): Draft[] {
  const current = 620 / 280
  const quick = (80 + 40 + 210) / 280
  const cashRatio = (80 + 40) / 280
  const dso = math.dayCount(360, 4_380, 365)
  const dio = math.dayCount(180, 1_440, 365)
  const dpo = math.dayCount(120, 1_440, 365)
  const ccc = math.cashConversionCycle(dio, dso, dpo)
  const grocerCcc = math.cashConversionCycle(22, 8, 47)
  const roe3 = math.dupontThree(0.06, 2, 1.5)
  const roe5 = math.dupontFive(0.8, 0.75, 0.16, 1.25, 2)
  const interestCover = 300 / 40
  const debtToEquity = 450 / 300
  const debtToAssets = 450 / 900
  const grossMargin = (5_000 - 3_200) / 5_000
  const netMargin = 195 / 2_000
  const turnover = 2_000 / 1_000
  const roa = 195 / 1_000
  return [
    numQ(
      'fsa-ratios',
      'easy',
      `Kite & Lantern Retail has cash of 80, marketable securities of 40, receivables of 210, inventory of 260, and prepaids of 30, so current assets are 620. Current liabilities are 280. The current ratio is closest to ${inline(String.raw`\frac{620}{280}`)}.`,
      current,
      [quick, cashRatio],
      times,
      (formatted) =>
        `The current ratio divides all current assets by current liabilities. ${inline(String.raw`\frac{620}{280}`)} equals ${formatted}. The quick ratio of ${times(quick)} drops inventory and prepaids. The cash ratio of ${times(cashRatio)} keeps only cash and marketable securities. A higher current ratio is not automatically safer if the inventory is unsaleable, which is why the narrower ratios exist.`,
    ),
    numQ(
      'fsa-ratios',
      'easy',
      `Using Kite & Lantern’s balances — cash 80, marketable securities 40, receivables 210, inventory 260, prepaids 30, and current liabilities 280 — the quick ratio is closest to ${inline(String.raw`\frac{80 + 40 + 210}{280}`)}.`,
      quick,
      [current, cashRatio],
      times,
      (formatted) =>
        `The quick ratio keeps the more liquid current assets and leaves out inventory and prepaids. ${inline(String.raw`\frac{330}{280}`)} equals ${formatted}. Including inventory returns the current ratio. Dropping receivables as well as inventory produces the cash ratio. The quick ratio answers a tighter liquidity question than the current ratio when inventory may not convert at book value.`,
    ),
    numQ(
      'fsa-ratios',
      'medium',
      `Still using cash 80, marketable securities 40, and current liabilities 280 for Kite & Lantern, the cash ratio is closest to ${inline(String.raw`\frac{80 + 40}{280}`)}.`,
      cashRatio,
      [quick, current],
      times,
      (formatted) =>
        `The cash ratio uses cash and short-term marketable securities only. ${inline(String.raw`\frac{120}{280}`)} equals ${formatted}. Receivables belong in the quick ratio, and inventory belongs in the current ratio. The cash ratio is the most severe of the three liquidity tests and can look weak for a healthy retailer that does not hold idle cash.`,
    ),
    numQ(
      'fsa-ratios',
      'easy',
      `Orchard Line Grocers has average receivables of 360 and annual credit sales of 4,380. Using a 365-day year, days of sales outstanding are closest to ${inline(String.raw`\frac{360}{4{,}380} \times 365`)}.`,
      dso,
      [math.dayCount(360, 4_380, 360), 4_380 / 360],
      days,
      (formatted) =>
        `Days of sales outstanding is the average receivable divided by credit sales, multiplied by 365. ${inline(String.raw`\frac{360}{4{,}380} \times 365`)} equals ${formatted}. A 360-day convention produces a slightly different count and should not be mixed into a 365-day comparison. Sales divided by receivables is the turnover multiple, not a day count.`,
    ),
    numQ(
      'fsa-ratios',
      'easy',
      `Hearthlane Bakeries holds average inventory of 180. Cost of goods sold for the year is 1,440. Using a 365-day year, days of inventory on hand are closest to ${inline(String.raw`\frac{180}{1{,}440} \times 365`)}.`,
      dio,
      [math.dayCount(180, 2_400, 365), math.dayCount(180, 1_440, 360)],
      days,
      (formatted) =>
        `Inventory days use cost of goods sold as the flow, not sales, because inventory is carried at cost. ${inline(String.raw`\frac{180}{1{,}440} \times 365`)} equals ${formatted}. Dividing by sales of 2,400 would understate the days the cost sits in the warehouse. A 360-day year is a different convention and breaks comparability with a 365-day receivables measure.`,
    ),
    numQ(
      'fsa-ratios',
      'medium',
      `Hearthlane’s average accounts payable are 120 and its cost of goods sold is 1,440, which is the purchases proxy the analyst is using. Days payable outstanding on a 365-day year are closest to ${inline(String.raw`\frac{120}{1{,}440} \times 365`)}.`,
      dpo,
      [math.dayCount(120, 2_400, 365), math.dayCount(180, 1_440, 365)],
      days,
      (formatted) =>
        `Payables days divide the payable balance by the purchase flow and multiply by 365. With cost of goods sold as the stated proxy, ${inline(String.raw`\frac{120}{1{,}440} \times 365`)} equals ${formatted}. Using sales in the denominator mixes a retail-price flow with a cost liability. Using the inventory balance instead of the payable balance computes inventory days.`,
    ),
    numQ(
      'fsa-ratios',
      'medium',
      `A working-capital study uses inventory days of ${num(dio, 1)}, receivable days of ${num(dso, 1)}, and payable days of ${num(dpo, 1)}. The cash conversion cycle is closest to ${inline(String.raw`\mathrm{DIO} + \mathrm{DSO} - \mathrm{DPO}`)}.`,
      ccc,
      [dio + dso + dpo, dio - dso + dpo],
      days,
      (formatted) =>
        `The cash conversion cycle is the net time from paying suppliers to collecting customers: inventory days plus receivable days minus payable days. ${inline(String.raw`${num(dio, 1)} + ${num(dso, 1)} - ${num(dpo, 1)}`)} equals ${formatted}. Adding the payable days treats supplier credit as a use of cash. Subtracting receivable days instead of payable days drops the customer lag and keeps the wrong liability.`,
    ),
    numQ(
      'fsa-ratios',
      'medium',
      `Red Kettle’s food subsidiary, treated here as Brookmint Grocers, turns inventory in 22 days, collects in 8 days, and pays suppliers in 47 days. Its cash conversion cycle is closest to ${inline(String.raw`22 + 8 - 47`)}.`,
      grocerCcc,
      [22 + 8 + 47, 47 - 22 - 8],
      (value) => `${num(value, 0)} days`,
      (formatted) =>
        `Cash conversion is inventory days plus receivable days minus payable days. ${inline(String.raw`22 + 8 - 47`)} equals ${formatted}. A negative cycle means the grocer collects from customers and sells the stock before it pays suppliers, so trade credit is funding the operating cycle. Adding all three days ignores that benefit. The absolute value would hide the sign that makes the business model interesting.`,
    ),
    numQ(
      'fsa-ratios',
      'easy',
      `Fable Press has a net profit margin of 6%, asset turnover of 2.00, and an equity multiplier of 1.50. Three-component DuPont ROE is closest to ${block(String.raw`\mathrm{ROE} = 0.06 \times 2.00 \times 1.50`)}.`,
      roe3,
      [0.06 * 2, 0.06 * 1.5],
      (value) => pct(value, 2),
      (formatted) =>
        `Three-component DuPont writes ROE as net margin times asset turnover times the equity multiplier. ${block(String.raw`0.06 \times 2.00 \times 1.50`)} equals ${formatted}. Stopping after margin and turnover produces a return on assets, not a return on equity. Multiplying margin only by leverage skips the sales the assets generate. Two firms can share this ROE with very different margins and turns.`,
    ),
    numQ(
      'fsa-ratios',
      'hard',
      `Copperline Wire has a tax burden of 0.80, an interest burden of 0.75, an EBIT margin of 16%, asset turnover of 1.25, and financial leverage of 2.00. Five-component DuPont ROE is closest to ${block(String.raw`0.80 \times 0.75 \times 0.16 \times 1.25 \times 2.00`)}.`,
      roe5,
      [0.75 * 0.16 * 1.25 * 2, 0.8 * 0.75 * 0.16 * 1.25],
      (value) => pct(value, 2),
      (formatted) =>
        `The five-component split separates tax, interest, EBIT margin, turnover, and leverage. ${block(String.raw`0.80 \times 0.75 \times 0.16 \times 1.25 \times 2.00`)} equals ${formatted}. Dropping the tax burden pretends the firm keeps every pretax dollar. Dropping leverage produces an unlevered return, not ROE. The interest burden of 0.75 means interest has already taken a quarter of EBIT before tax.`,
    ),
    ask(
      'fsa-ratios',
      'medium',
      'Two suppliers each report a 15% return on equity. Bramble Transit has a high net margin, low asset turnover, and modest leverage. Nimbus Parcel has a thin margin, high turnover, and higher leverage. Which conclusion is most accurate?',
      'The equal ROE figures hide different businesses. One is a margin story and the other is a turnover-and-leverage story, so a single ROE ranking is not a comparison of operating models.',
      'Equal ROE means the two firms have the same margin, the same turnover, and the same leverage.',
      'The higher-turnover firm is always the safer credit, because turnover cancels leverage in every coverage ratio.',
      'DuPont exists so that a common ROE is not mistaken for a common business. Margin, turnover, and leverage can offset one another. The parcel firm’s extra leverage raises the equity return and also raises risk for a lender; turnover does not cancel that leverage in an interest-coverage ratio. Credit work still looks at the debt and the stability of the thin margin.',
    ),
    numQ(
      'fsa-ratios',
      'easy',
      `Veldt Mill has EBIT of 300 and interest expense of 40. Interest coverage, defined as EBIT divided by interest expense, is closest to ${inline(String.raw`\frac{300}{40}`)}.`,
      interestCover,
      [300 / 80, (300 - 40) / 40],
      times,
      (formatted) =>
        `This coverage ratio asks how many times operating profit covers the interest accrual. ${inline(String.raw`\frac{300}{40}`)} equals ${formatted}. Doubling the interest without a fact to support it understates coverage. Subtracting interest before dividing uses a pretax-profit numerator and answers a different, tighter question than the EBIT coverage the stem defined.`,
    ),
    numQ(
      'fsa-ratios',
      'medium',
      `Halden Forge has interest-bearing debt of 450, total liabilities of 600, equity of 300, and assets of 900. Debt-to-equity, using only interest-bearing debt, is closest to ${inline(String.raw`\frac{450}{300}`)}.`,
      debtToEquity,
      [600 / 300, 450 / 900],
      times,
      (formatted) =>
        `The ratio in the question puts interest-bearing debt over equity. ${inline(String.raw`\frac{450}{300}`)} equals ${formatted}. Total liabilities over equity is larger because it folds in operating liabilities such as payables. Debt over assets is a different solvency ratio with a smaller numerator base and a larger denominator. The stem has to be read for which claims are called debt.`,
    ),
    numQ(
      'fsa-ratios',
      'medium',
      `Using Halden Forge’s interest-bearing debt of 450 and assets of 900, debt-to-assets is closest to ${inline(String.raw`\frac{450}{900}`)}.`,
      debtToAssets,
      [600 / 900, 450 / 300],
      (value) => pct(value, 2),
      (formatted) =>
        `Debt-to-assets divides the interest-bearing debt named in the question by total assets. ${inline(String.raw`\frac{450}{900}`)} equals ${formatted}. Using every liability would mix payables into a ratio the stem limited to interest-bearing debt. Debt-to-equity is the same debt divided by equity, a multiple rather than this percentage of assets.`,
    ),
    numQ(
      'fsa-ratios',
      'easy',
      `Whitecap Fisheries has sales of 5,000 and cost of goods sold of 3,200. The gross margin is closest to ${inline(String.raw`\frac{5{,}000 - 3{,}200}{5{,}000}`)}.`,
      grossMargin,
      [(5_000 - 3_200) / 3_200, 3_200 / 5_000],
      (value) => pct(value, 2),
      (formatted) =>
        `Gross margin is gross profit divided by sales. ${inline(String.raw`\frac{1{,}800}{5{,}000}`)} equals ${formatted}. Dividing gross profit by cost of goods sold produces a markup on cost, which is a different commercial quote. Cost of goods sold over sales is the complement of the gross margin, not the margin itself.`,
    ),
    numQ(
      'fsa-ratios',
      'easy',
      `A compact income statement shows sales of 2,000 and net income of 195. The net profit margin is closest to ${inline(String.raw`\frac{195}{2{,}000}`)}.`,
      netMargin,
      [195 / 1_000, (2_000 - 195) / 2_000],
      (value) => pct(value, 2),
      (formatted) =>
        `Net profit margin divides net income by sales. ${inline(String.raw`\frac{195}{2{,}000}`)} equals ${formatted}. Dividing by assets would start a return on assets, not a margin. The complement, the share of sales that is not profit, is not the margin a DuPont model uses as net margin.`,
    ),
    numQ(
      'fsa-ratios',
      'easy',
      `The same compact firm has sales of 2,000 and average assets of 1,000. Total asset turnover is closest to ${inline(String.raw`\frac{2{,}000}{1{,}000}`)}.`,
      turnover,
      [1_000 / 2_000, 195 / 1_000],
      times,
      (formatted) =>
        `Asset turnover measures how many sales dollars the asset base produces. ${inline(String.raw`\frac{2{,}000}{1{,}000}`)} equals ${formatted}. Inverting it gives assets per sales dollar, which is a capital-intensity measure rather than turnover. Net income over assets is a return, not a turnover, and it already mixes margin into the asset base.`,
    ),
    numQ(
      'fsa-ratios',
      'medium',
      `Net income is 195 and average assets are 1,000. EBIT is 300. Return on assets, defined as net income divided by average assets, is closest to ${inline(String.raw`\frac{195}{1{,}000}`)}.`,
      roa,
      [300 / 1_000, 195 / 500],
      (value) => pct(value, 2),
      (formatted) =>
        `The definition in the stem uses net income in the numerator. ${inline(String.raw`\frac{195}{1{,}000}`)} equals ${formatted}. EBIT over assets is an operating return that has not been reduced by interest or tax. Net income over equity is ROE. Some analysts prefer EBIT after tax in the numerator so leverage does not distort the asset return; that is a different definition from the one this question asked for.`,
    ),
    ask(
      'fsa-ratios',
      'medium',
      'An equity multiplier of 3.0 is the only leverage figure in a DuPont model of Cinderpeak Aggregates. Which statement translates that multiple into the balance sheet?',
      'Assets are three times equity, so liabilities finance two-thirds of the assets.',
      'Debt is three times EBITDA, so interest coverage is 3.0.',
      'Equity is three times assets, so the firm has no liabilities.',
      'The equity multiplier in DuPont is average assets divided by average equity. A value of 3 means each equity dollar supports three asset dollars, and the other two are financed by liabilities of some kind. It is not a debt-to-EBITDA multiple and it is not an interest-coverage ratio. Inverting it would describe a firm that is overcapitalized with equity rather than the levered firm the multiple actually describes.',
    ),
    ask(
      'fsa-ratios',
      'hard',
      'Two firms have the same EBIT. Firm A’s interest burden ratio, EBT divided by EBIT, is 0.95. Firm B’s interest burden ratio is 0.60. Which interpretation is most accurate?',
      'Firm B carries the heavier interest burden, because a lower EBT-to-EBIT ratio means interest consumes more of operating profit.',
      'Firm A carries the heavier interest burden, because a higher ratio always means more interest expense.',
      'The ratios cannot be compared, because an interest burden above 1 is the only ratio that measures interest.',
      'In the five-component DuPont identity the interest burden is EBT/EBIT, which equals 1 when there is no interest and falls as interest grows. Firm B’s 0.60 means forty percent of EBIT is absorbed by interest, versus five percent at Firm A. The higher ratio is the lighter burden. Both numbers are below 1 in the usual case of positive interest and positive EBIT, so a value above 1 is not required for the comparison to make sense.',
    ),
  ]
}

function model(): Draft[] {
  const nextSales = 18_000_000 * 1.08
  const wcNeed = nextSales * 0.12 - 2_000_000
  return [
    ask(
      'fsa-model',
      'easy',
      'An analyst builds a financial statement model of Pinion Analytics for a valuation. Which starting point best matches a sales-driven model?',
      'Forecast the revenue drivers first, then margins, working capital, capital spending, and the financing that plugs the cash gap.',
      'Forecast next year’s earnings per share first, then force every statement to equal that earnings number.',
      'Forecast the dividend, and leave the income statement and balance sheet for a later project because they do not affect cash.',
      'A sales-driven model starts with the activity that creates the statements: prices, volumes, subscribers, or another revenue driver. Margins convert that revenue into profit. Working capital and capital spending convert it into cash. Financing fills the gap so the balance sheet balances. Starting from a target EPS, or from a dividend with no statements behind it, hides the operating assumptions the valuation depends on.',
    ),
    ask(
      'fsa-model',
      'medium',
      'In a projected balance sheet for Harbor Loom, assets do not equal liabilities plus equity after the operating lines are filled in. The firm has a stated policy of drawing or repaying a revolver to absorb the difference. What is that revolver balance doing in the model?',
      'It is the plug that makes the balance sheet balance, and it should be checked against covenants and against whether the cash swing is credible.',
      'It is ignored, because a forecast balance sheet is allowed to be out of balance by the amount of net income.',
      'It replaces the revenue forecast, because the revolver is the firm’s only sales driver.',
      'Something has to absorb the difference between the assets the operations need and the liabilities and equity the earnings and capital structure produce. A revolver or a cash balance is a common plug. The plug is not permission to leave the sheet unbalanced, and it is not a substitute for the revenue forecast. A plug that breaches a covenant, or that swings by an implausible amount, means an operating assumption needs another look.',
    ),
    ask(
      'fsa-model',
      'medium',
      'The base case for Redcedar Cabinetry holds the gross margin 800 basis points above the industry for ten years. Rivalry is intense, switching costs are low, and new plants are easy to finance. How should Porter’s forces change the model?',
      'The sustained margin premium is hard to defend. Competition should push the forecast margin back toward the industry unless the firm has a specific advantage the forces do not erode.',
      'Porter’s forces apply only to the revenue growth rate, so a margin premium can be held with no extra justification.',
      'Intense rivalry raises the justified margin, because competitors keep prices high to protect returns.',
      'Buyer power, easy entry, and intense rivalry attack excess margins. A forecast that keeps a large premium for a decade needs a moat the forces do not remove: a brand, a cost position, a switching cost, or a capacity constraint. Rivalry does not support higher prices. Leaving the margin untouched because the framework is “about growth” misses the line the forces usually hit first.',
    ),
    numQ(
      'fsa-model',
      'easy',
      `Last year’s sales at Wick & Amber Candles were ${usd(18_000_000, 0)}. The base case grows sales 8%. Next year’s sales are closest to ${inline(String.raw`18{,}000{,}000 \times 1.08`)}.`,
      nextSales,
      [18_000_000 * 0.08, 18_000_000 + 0.08],
      (value) => usd(value, 0),
      (formatted) =>
        `A growth rate applies to the prior level: next year equals this year times one plus the growth rate. ${inline(String.raw`18{,}000{,}000 \times 1.08`)} equals ${formatted}. Using 8% of sales as the entire forecast drops the business that already exists. Adding 0.08 of a currency unit to 18 million treats a percentage as if it were cash.`,
    ),
    numQ(
      'fsa-model',
      'medium',
      `Wick & Amber currently has noncash operating working capital of ${usd(2_000_000, 0)}. Next year’s sales are ${usd(nextSales, 0)}, and the model holds noncash operating working capital at 12% of sales. The cash investment in working capital next year is closest to ${inline(String.raw`0.12 \times 19{,}440{,}000 - 2{,}000{,}000`)}.`,
      wcNeed,
      [nextSales * 0.12, 2_000_000 * 0.08],
      (value) => usd(value, 0),
      (formatted) =>
        `The cash drain is the increase in the working-capital balance, not the balance itself. Next year’s balance is 12% of next year’s sales, and the investment is that balance minus the balance already in place. ${inline(String.raw`2{,}332{,}800 - 2{,}000{,}000`)} equals ${formatted}. Quoting the entire ending balance treats existing stock and receivables as if they had to be bought again. Growing the old balance by the sales growth rate is a different algorithm and does not match the 12% policy stated here.`,
    ),
    ask(
      'fsa-model',
      'medium',
      'A steady-state forecast for Stoneferry Cement sets maintenance capital spending equal to depreciation and then adds a separate growth project. Which use of that split is most accurate?',
      'Maintenance near depreciation is a starting point for a stable asset base. Growth spending is incremental, and neither piece should be set without looking at asset age and technology.',
      'Capital spending must equal depreciation every year, including years when a new plant is built, or the model is invalid.',
      'Depreciation is a cash outflow, so maintenance spending should be set to zero to avoid double counting cash.',
      'In a mature plant, replacement spending can be near depreciation, but depreciation is an allocation of historical cost, not the cash cost of a new kiln. Growth projects sit on top of maintenance. Forcing every year to equality hides expansion. Setting maintenance to zero because depreciation was already deducted double counts nothing: depreciation is not cash, and the cash spend still has to be forecast in investing.',
    ),
    ask(
      'fsa-model',
      'hard',
      'An analyst publishes one path for Silverthistle Tea and describes it as the likely outcome. The revenue growth rate is above the industry, the margin never mean-reverts, and no downside case is shown. Which behavioral and modeling critique is most accurate?',
      'A single optimistic path understates uncertainty. Scenarios, and a margin that competitors can attack, communicate the forecast better than false precision.',
      'One path is preferred, because scenario analysis double counts the base case and is discouraged in financial statement models.',
      'Margins should be forecast to widen every year, because mean reversion applies only to revenue and not to profit.',
      'Overconfidence shows up as a narrow story told with a precise point estimate. A base, upside, and downside case makes the operating leverage and the covenant risk visible. In a competitive tea market, an abnormal margin is a claim about barriers, not a default. Mean reversion is a caution about that claim. It does not require every margin to collapse, and it does not forbid a high margin that a real advantage supports. It does require the advantage to be named.',
    ),
    ask(
      'fsa-model',
      'hard',
      'The explicit forecast for Aster Dock Services runs thirty years, with a different growth rate, margin, and capital-spending ratio in every year, and the terminal value is still most of the answer. Which modeling judgment is most accurate?',
      'A long explicit stage that never settles into a stable return pattern adds detail without reducing the importance of the terminal assumptions.',
      'Extending the explicit stage to thirty years removes the need to check whether the terminal growth rate is below the required return.',
      'Terminal value matters only when the explicit stage is shorter than five years, so a thirty-year file can ignore it.',
      'The explicit stage should be long enough for the firm to reach a steady competitive position, and then a simple terminal assumption takes over. Year-by-year invention for three decades usually exceeds what the analyst can know, and discounting does not stop the terminal value from dominating if cash flows keep growing. The terminal growth rate still has to sit below the required return. A short stage can make the terminal value large too; length by itself does not retire that check.',
    ),
  ]
}

export function buildFsa(): Draft[] {
  return unique([
    ...take('fsa-intro', 8, intro()),
    ...take('fsa-income', 18, income()),
    ...take('fsa-balance', 10, balance()),
    ...take('fsa-cf1', 12, cf1()),
    ...take('fsa-cf2', 14, cf2()),
    ...take('fsa-inventory', 14, inventory()),
    ...take('fsa-ltassets', 10, ltassets()),
    ...take('fsa-liabilities', 10, liabilities()),
    ...take('fsa-tax', 14, tax()),
    ...take('fsa-quality', 12, quality()),
    ...take('fsa-ratios', 20, ratios()),
    ...take('fsa-model', 8, model()),
  ])
}

function main(): void {
  const drafts = buildFsa()
  const questions = finalizeTopic('fsa', drafts)
  console.log(questions.length)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
