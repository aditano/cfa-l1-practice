import { pathToFileURL } from 'node:url'
import { exactly, finalizeTopic, numeric, q, type Draft } from '../author.ts'
import { block, inline, num, pct } from '../../src/lib/format.ts'
import * as math from '../../src/lib/formulas.ts'

type Difficulty = Draft['difficulty']

type FeeInput = {
  name: string
  begin: number
  endBeforeFees: number
  managementRate: number
  managementBase: 'begin' | 'end'
  incentiveRate: number
  hurdleRate?: number
  hurdleStyle?: 'hard' | 'soft'
  highWaterMark?: number
}

type Row = {
  d: Difficulty
  stem: string
  correct: string
  wrong: [string, string]
  why: string
}

function concept(losId: string, rows: Row[]): Draft[] {
  return rows.map((row) =>
    q(
      'alternatives',
      losId,
      row.d,
      row.stem,
      row.correct,
      row.wrong[0],
      row.wrong[1],
      `${row.why} ${row.correct}`,
    ),
  )
}

function millions(value: number): string {
  return `USD ${num(value / 1_000_000, 2)} million`
}

function feeCore(input: FeeInput): Parameters<typeof math.hedgeFundEnd>[0] {
  return {
    begin: input.begin,
    endBeforeFees: input.endBeforeFees,
    managementRate: input.managementRate,
    managementBase: input.managementBase,
    incentiveRate: input.incentiveRate,
    hurdleRate: input.hurdleRate,
    hurdleStyle: input.hurdleStyle,
    highWaterMark: input.highWaterMark,
  }
}

function feeStem(input: FeeInput, ask: string): string {
  const base = input.managementBase === 'begin' ? 'beginning value' : 'ending value before fees'
  const management = `The management fee equals ${pct(input.managementRate)} times ${base}.`
  let incentive: string
  if (input.highWaterMark !== undefined) {
    incentive = `The incentive fee rate is ${pct(input.incentiveRate)}. The incentive base is the greater of zero and ending value before fees minus the management fee minus the high-water mark of ${millions(input.highWaterMark)}. Do not apply a hurdle rate.`
  } else if (input.hurdleStyle === 'hard' && input.hurdleRate !== undefined) {
    incentive = `Profit after the management fee equals ending value before fees minus the management fee minus beginning value. The incentive fee rate is ${pct(input.incentiveRate)}. There is a hard hurdle of ${pct(input.hurdleRate)}. The incentive applies only to the portion of that profit that exceeds beginning value times the hurdle rate.`
  } else if (input.hurdleRate !== undefined) {
    incentive = `Profit after the management fee equals ending value before fees minus the management fee minus beginning value. The incentive fee rate is ${pct(input.incentiveRate)}. There is a soft hurdle of ${pct(input.hurdleRate)}. If that profit exceeds beginning value times the hurdle rate, the incentive applies to all of that profit; otherwise the incentive fee is zero.`
  } else {
    incentive = `There is no hurdle rate and no high-water mark. The incentive fee rate is ${pct(input.incentiveRate)} of profit after the management fee. That profit equals ending value before fees minus the management fee minus beginning value, and the incentive base is zero when the profit is negative.`
  }
  return `${input.name} begins the year at ${millions(input.begin)} and the ending value before fees is ${millions(input.endBeforeFees)}. ${management} ${incentive} ${ask}`
}

function feeMath(expr: string): string {
  return inline(String.raw`F_m=r_m\times\text{base},\quad F_i=r_i\times\text{incentive base},\quad ${expr}`)
}

function feeItem(
  difficulty: Difficulty,
  input: FeeInput,
  ask: string,
  field: 'managementFee' | 'incentiveFee' | 'netEnd' | 'netReturn',
  wrong: [number, number],
  because: string,
): Draft {
  const result = math.hedgeFundEnd(feeCore(input))
  const format = field === 'netReturn' ? (value: number) => pct(value) : (value: number) => millions(value)
  return numeric({
    topicId: 'alternatives',
    losId: 'ai-returns',
    difficulty,
    stem: feeStem(input, ask),
    correct: result[field],
    wrong,
    format,
    explain: (ans) =>
      `${because} The management fee is ${millions(result.managementFee)}, the incentive fee is ${millions(result.incentiveFee)}, the net ending value is ${millions(result.netEnd)}, and the net return is ${pct(result.netReturn)}. The closest value is ${ans}. ${feeMath(String.raw`R=(V_{\text{net}}-V_0)/V_0`)}`,
  })
}

function features(): Draft[] {
  return concept('ai-features', [
    {
      d: 'easy',
      stem: 'An institution wants the greatest control over each private holding, including the right to source and operate the asset itself. Which access method fits that goal?',
      correct: 'Direct investment, because the asset owner makes the sourcing and operating decisions.',
      wrong: [
        'A limited-partner stake in a commingled fund run by an outside general partner.',
        'A fund-of-funds commitment that holds interests in several other funds.',
      ],
      why: 'Control rises as the investor moves from a pooled fund to a co-investment and then to owning the asset outright. A fund investor delegates selection and management.',
    },
    {
      d: 'medium',
      stem: 'Piper Street Capital offers an existing limited partner a chance to invest more money in one buyout, beside the fund, at a reduced fee. Which description of that offer is most accurate?',
      correct: 'It is a co-investment: extra capital in a specific deal the general partner has already sourced, often at lower fees than the main fund.',
      wrong: [
        'It is a direct investment, so the limited partner must negotiate the purchase without the general partner.',
        'It is a secondary sale, so the limited partner is buying another investor’s old fund interest.',
      ],
      why: 'Co-investment sits between a blind-pool commitment and a fully direct program. The general partner still sources the deal, and the investor underwrites that one asset.',
    },
    {
      d: 'easy',
      stem: 'In a typical private-capital limited partnership, which statement about the general partner is most accurate?',
      correct: 'The general partner selects investments, calls capital, and is paid a management fee plus a performance fee.',
      wrong: [
        'The general partner is a passive supplier of capital and cannot bind the partnership.',
        'The general partner’s only role is to custody assets and issue the audit opinion.',
      ],
      why: 'The general partner is the manager. Limited partners supply capital and ordinarily do not run the portfolio companies day to day.',
    },
    {
      d: 'medium',
      stem: 'During the investment period of a private-equity fund, the management fee is often charged on committed capital rather than on invested capital. Why does that base matter to a limited partner?',
      correct: 'The fee can be charged on money that has been promised but not yet called, so fee drag starts before the capital is put to work.',
      wrong: [
        'A fee on committed capital is collected only after the fund has returned all contributions.',
        'Committed-capital fees replace the carried interest, so no performance fee can also be charged.',
      ],
      why: 'Committed capital is the contractual promise. Called, or paid-in, capital is the amount actually drawn. Early in the fund’s life those amounts differ.',
    },
    {
      d: 'hard',
      stem: 'A private-equity partnership returns contributed capital and a preferred return to limited partners, then pays the general partner most of the next profits until the agreed carry split is reached. What is that middle step?',
      correct: 'A catch-up, which accelerates the general partner’s share until the carried-interest percentage of profits is achieved.',
      wrong: [
        'A clawback, which forces limited partners to return distributions after a profitable exit.',
        'A high-water mark, which stops the management fee whenever the fund’s net asset value falls.',
      ],
      why: 'The catch-up is part of the waterfall, not a refund of fees and not a hedge-fund loss-recovery test. It changes who receives the next dollar of profit.',
    },
    {
      d: 'medium',
      stem: 'Westmill Fund uses a master portfolio with separate feeder funds for investors who face different tax rules. Which statement about that structure is most accurate?',
      correct: 'The feeders pool different investor groups into one master portfolio so the trading book is run once.',
      wrong: [
        'Each feeder must hold different securities, so the master fund never sees a single set of positions.',
        'A master-feeder structure prohibits incentive fees and requires daily dealing.',
      ],
      why: 'The master-feeder pattern is an administrative and tax structure. It does not, by itself, set the liquidity terms or cancel the performance fee.',
    },
    {
      d: 'easy',
      stem: 'Compared with a passive public-equity fund, alternative funds more often charge a management fee plus a performance fee. Which explanation is the fairest?',
      correct: 'Sourcing, active management, and illiquid holdings are typical reasons for the higher and more complex fees.',
      wrong: [
        'Regulators set a minimum performance fee for every fund that is not an index fund.',
        'The performance fee is charged because the manager guarantees a positive return.',
      ],
      why: 'Fees compensate specialized work and align the manager with profits. They are not a legal minimum and they are not a promise that the investor will make money.',
    },
    {
      d: 'easy',
      stem: 'A new limited partner in Piper Street Capital asks what loss can fall on that partner if a portfolio company fails. Which statement is most accurate?',
      correct: 'The limited partner can lose the capital committed to the fund, and does not manage the portfolio company day to day.',
      wrong: [
        'The limited partner has unlimited liability for every loan the portfolio company signs.',
        'The limited partner must approve each operating budget or the fund cannot invest.',
      ],
      why: 'Limited liability is the usual bargain in a limited partnership: capital is at risk, control of daily operations is not. Side letters and excuses can vary the details, but unlimited liability is not the standard deal.',
    },
    {
      d: 'hard',
      stem: 'One limited partner in Westmill Fund receives a side letter that lowers that partner’s management fee and adds extra reporting. Which statement is most accurate?',
      correct: 'A side letter can give one investor economics or reporting that differ from the standard partnership terms.',
      wrong: [
        'A side letter automatically converts that investor into the general partner.',
        'A side letter is illegal whenever any other limited partner pays a higher fee.',
      ],
      why: 'Side letters are negotiated exceptions. They do not change who manages the fund. Other investors may ask for similar terms, but the mere existence of a concession is a bargaining outcome, not a change of control.',
    },
    {
      d: 'easy',
      stem: 'Piper Street Capital has USD 500 million of commitments and has called USD 180 million so far. Which pairing of terms is most accurate?',
      correct: 'Committed capital is USD 500 million and called capital is USD 180 million.',
      wrong: [
        'Called capital is USD 500 million because the investors signed the subscription documents.',
        'Committed capital and residual value are the same figure until the first exit.',
      ],
      why: 'The commitment is the promise. A capital call converts part of that promise into paid-in cash. Residual value is what the remaining investments are worth, which is a different account.',
    },
    {
      d: 'medium',
      stem: 'An endowment wants to buy another investor’s existing limited-partner interest in Piper Street Capital rather than wait for a new fund. What is that transaction?',
      correct: 'A secondary purchase of an existing fund interest.',
      wrong: [
        'A primary initial public offering of a portfolio company.',
        'The general partner’s first capital call on a brand-new commitment.',
      ],
      why: 'Secondary trading moves an already issued partnership interest from one limited partner to another. It is not the portfolio company’s listing and it is not a new capital call.',
    },
    {
      d: 'hard',
      stem: 'A family office compares a separately managed alternative account with a commingled Westmill Fund vehicle. Which contrast is most accurate?',
      correct: 'The separate account can be customized and can show the underlying holdings, usually with a higher asset minimum.',
      wrong: [
        'The separate account must hold the same positions, fees, and liquidity as every other client by law.',
        'The separate account removes market risk because the securities are registered in the client’s name.',
      ],
      why: 'Registration in the client’s name changes ownership and flexibility. It does not change the economic risk of the assets that are bought.',
    },
  ])
}

function returns(): Draft[] {
  const westmillPlain: FeeInput = {
    name: 'Westmill Fund',
    begin: 100_000_000,
    endBeforeFees: 120_000_000,
    managementRate: 0.02,
    managementBase: 'begin',
    incentiveRate: 0.2,
  }
  const westmillPlainResult = math.hedgeFundEnd(feeCore(westmillPlain))
  const westmillGrossIncentive = westmillPlain.incentiveRate * (westmillPlain.endBeforeFees - westmillPlain.begin)

  const piperIncentive: FeeInput = {
    name: 'Piper Street Capital',
    begin: 200_000_000,
    endBeforeFees: 250_000_000,
    managementRate: 0.02,
    managementBase: 'begin',
    incentiveRate: 0.2,
  }
  const piperIncentiveResult = math.hedgeFundEnd(feeCore(piperIncentive))
  const piperGrossIncentive = piperIncentive.incentiveRate * (piperIncentive.endBeforeFees - piperIncentive.begin)

  const westmillReturn: FeeInput = {
    name: 'Westmill Fund',
    begin: 40_000_000,
    endBeforeFees: 50_000_000,
    managementRate: 0.02,
    managementBase: 'begin',
    incentiveRate: 0.2,
  }
  const westmillReturnResult = math.hedgeFundEnd(feeCore(westmillReturn))
  const westmillGrossIncentiveReturn =
    westmillReturn.incentiveRate * (westmillReturn.endBeforeFees - westmillReturn.begin)
  const returnIfGrossIncentive =
    (westmillReturn.endBeforeFees - westmillReturnResult.managementFee - westmillGrossIncentiveReturn - westmillReturn.begin) /
    westmillReturn.begin
  const returnIfNoIncentive =
    (westmillReturn.endBeforeFees - westmillReturnResult.managementFee - westmillReturn.begin) / westmillReturn.begin

  const piperEndBase: FeeInput = {
    name: 'Piper Street Capital',
    begin: 80_000_000,
    endBeforeFees: 100_000_000,
    managementRate: 0.02,
    managementBase: 'end',
    incentiveRate: 0.2,
  }
  const piperEndBaseResult = math.hedgeFundEnd(feeCore(piperEndBase))
  const piperBeginBase = math.hedgeFundEnd(feeCore({ ...piperEndBase, managementBase: 'begin' }))
  const endIfNoIncentive = piperEndBase.endBeforeFees - piperEndBaseResult.managementFee

  const softCleared: FeeInput = {
    name: 'Westmill Fund',
    begin: 100_000_000,
    endBeforeFees: 130_000_000,
    managementRate: 0.02,
    managementBase: 'begin',
    incentiveRate: 0.2,
    hurdleRate: 0.08,
    hurdleStyle: 'soft',
  }
  const softClearedResult = math.hedgeFundEnd(feeCore(softCleared))
  const hardVersionOfSoft = math.hedgeFundEnd(feeCore({ ...softCleared, hurdleStyle: 'hard' }))
  const softGrossIncentive = softCleared.incentiveRate * (softCleared.endBeforeFees - softCleared.begin)
  const softReturnIfGross =
    (softCleared.endBeforeFees - softClearedResult.managementFee - softGrossIncentive - softCleared.begin) / softCleared.begin

  const softMissed: FeeInput = {
    name: 'Piper Street Capital',
    begin: 100_000_000,
    endBeforeFees: 106_000_000,
    managementRate: 0.02,
    managementBase: 'begin',
    incentiveRate: 0.2,
    hurdleRate: 0.1,
    hurdleStyle: 'soft',
  }
  const softMissedResult = math.hedgeFundEnd(feeCore(softMissed))
  const softMissedIfIgnored = math.hedgeFundEnd(feeCore({ ...softMissed, hurdleRate: undefined, hurdleStyle: undefined }))

  const hardCase: FeeInput = {
    name: 'Westmill Fund',
    begin: 100_000_000,
    endBeforeFees: 140_000_000,
    managementRate: 0.02,
    managementBase: 'end',
    incentiveRate: 0.2,
    hurdleRate: 0.1,
    hurdleStyle: 'hard',
  }
  const hardCaseResult = math.hedgeFundEnd(feeCore(hardCase))
  const hardAsSoft = math.hedgeFundEnd(feeCore({ ...hardCase, hurdleStyle: 'soft' }))
  const hardOnBegin = math.hedgeFundEnd(feeCore({ ...hardCase, managementBase: 'begin' }))

  const hwmHit: FeeInput = {
    name: 'Piper Street Capital',
    begin: 100_000_000,
    endBeforeFees: 150_000_000,
    managementRate: 0.02,
    managementBase: 'begin',
    incentiveRate: 0.2,
    highWaterMark: 130_000_000,
  }
  const hwmHitResult = math.hedgeFundEnd(feeCore(hwmHit))
  const hwmIgnored = math.hedgeFundEnd(feeCore({ ...hwmHit, highWaterMark: undefined }))
  const hwmWithoutNettingFee = hwmHit.incentiveRate * (hwmHit.endBeforeFees - (hwmHit.highWaterMark ?? 0))

  const hwmMiss: FeeInput = {
    name: 'Westmill Fund',
    begin: 100_000_000,
    endBeforeFees: 115_000_000,
    managementRate: 0.02,
    managementBase: 'begin',
    incentiveRate: 0.2,
    highWaterMark: 120_000_000,
  }
  const hwmMissResult = math.hedgeFundEnd(feeCore(hwmMiss))
  const hwmMissIgnored = math.hedgeFundEnd(feeCore({ ...hwmMiss, highWaterMark: undefined }))
  const hwmMissOnEnd = math.hedgeFundEnd(feeCore({ ...hwmMiss, managementBase: 'end' }))

  const softForConcept = math.hedgeFundEnd(
    feeCore({
      name: 'illustration',
      begin: 100,
      endBeforeFees: 130,
      managementRate: 0.02,
      managementBase: 'begin',
      incentiveRate: 0.2,
      hurdleRate: 0.08,
      hurdleStyle: 'soft',
    }),
  )
  const hardForConcept = math.hedgeFundEnd(
    feeCore({
      name: 'illustration',
      begin: 100,
      endBeforeFees: 130,
      managementRate: 0.02,
      managementBase: 'begin',
      incentiveRate: 0.2,
      hurdleRate: 0.08,
      hurdleStyle: 'hard',
    }),
  )

  const numericItems: Draft[] = [
    feeItem(
      'easy',
      westmillPlain,
      'The management fee for the year is closest to:',
      'managementFee',
      [westmillPlainResult.incentiveFee, westmillPlainResult.managementFee + westmillPlainResult.incentiveFee],
      'The management fee is the rate times beginning value. It is not the incentive fee, and it is not the sum of the two fees.',
    ),
    feeItem(
      'medium',
      piperIncentive,
      'The incentive fee for the year is closest to:',
      'incentiveFee',
      [piperIncentiveResult.managementFee, piperGrossIncentive],
      'Incentive is charged on profit after the management fee has already been subtracted, not on the gross increase in value and not on the management fee itself.',
    ),
    feeItem(
      'medium',
      westmillReturn,
      'The investor’s net return for the year is closest to:',
      'netReturn',
      [returnIfGrossIncentive, returnIfNoIncentive],
      'Net return uses ending value after both fees. Charging incentive on the gross gain, or forgetting the incentive fee, both miss that order.',
    ),
    feeItem(
      'medium',
      piperEndBase,
      'The investor’s net ending value is closest to:',
      'netEnd',
      [endIfNoIncentive, piperBeginBase.netEnd],
      'Because the management fee uses ending value before fees, it is larger than a fee on beginning value. The incentive is then taken on the profit that remains after that fee.',
    ),
    feeItem(
      'hard',
      softCleared,
      'The investor’s net return for the year is closest to:',
      'netReturn',
      [hardVersionOfSoft.netReturn, softReturnIfGross],
      'The soft hurdle is cleared, so incentive applies to all profit after the management fee. A hard hurdle would have taxed only the slice above the hurdle, and a gross-profit incentive base ignores the management fee.',
    ),
    feeItem(
      'hard',
      softCleared,
      'The incentive fee for the year is closest to:',
      'incentiveFee',
      [hardVersionOfSoft.incentiveFee, softGrossIncentive],
      'With a cleared soft hurdle the whole profit after the management fee is the incentive base. The hard-hurdle fee is smaller here, and twenty percent of the gross price increase is larger.',
    ),
    feeItem(
      'medium',
      softMissed,
      'The incentive fee for the year is closest to:',
      'incentiveFee',
      [softMissedIfIgnored.incentiveFee, softMissedResult.managementFee],
      'Profit after the management fee is below beginning value times the soft hurdle, so the incentive fee is zero. The management fee is still charged. Ignoring the hurdle would have produced a positive incentive fee.',
    ),
    feeItem(
      'hard',
      hardCase,
      'The incentive fee for the year is closest to:',
      'incentiveFee',
      [hardAsSoft.incentiveFee, hardOnBegin.incentiveFee],
      'The hard hurdle removes the hurdle amount from profit after the management fee before the incentive rate is applied. A soft hurdle on the same profit would charge more, and a beginning-value management fee would change the profit base.',
    ),
    feeItem(
      'hard',
      hardCase,
      'The investor’s net return for the year is closest to:',
      'netReturn',
      [hardAsSoft.netReturn, hardOnBegin.netReturn],
      'Net return follows from the hard-hurdle incentive and from the management fee on ending value before fees. The soft-hurdle version and the beginning-value management-fee version are different contracts.',
    ),
    feeItem(
      'hard',
      hwmHit,
      'The incentive fee for the year is closest to:',
      'incentiveFee',
      [hwmIgnored.incentiveFee, hwmWithoutNettingFee],
      'The high-water mark replaces a hurdle. Only the gap between ending value after the management fee and the high-water mark is eligible. Ignoring the mark, or forgetting to subtract the management fee before comparing with the mark, overstates the fee.',
    ),
    feeItem(
      'medium',
      hwmMiss,
      'The investor’s net return for the year is closest to:',
      'netReturn',
      [hwmMissIgnored.netReturn, hwmMissOnEnd.netReturn],
      'Ending value after the management fee is still below the high-water mark, so the incentive fee is zero. Dropping the mark would charge incentive on the year’s profit. Changing the management-fee base also changes the net result.',
    ),
  ]

  const multipleItems: Draft[] = [
    multipleItem('medium', 'An early Piper Street Capital fund', 400_000_000, 220_000_000, 280_000_000, 'DPI'),
    multipleItem('medium', 'An early Piper Street Capital fund', 400_000_000, 220_000_000, 280_000_000, 'RVPI'),
    multipleItem('easy', 'An early Piper Street Capital fund', 400_000_000, 220_000_000, 280_000_000, 'TVPI'),
    multipleItem('medium', 'A later Piper Street Capital fund', 125_000_000, 180_000_000, 50_000_000, 'DPI'),
    multipleItem('hard', 'A later Piper Street Capital fund', 125_000_000, 180_000_000, 50_000_000, 'TVPI'),
  ]

  const conceptual = concept('ai-returns', [
    {
      d: 'medium',
      stem: 'An appraisal-based index of private assets shows low volatility and a low correlation with public equities. Transaction prices of similar assets move around more. Which interpretation is most accurate?',
      correct: 'Appraisal smoothing can understate both the volatility of private assets and their correlation with public markets.',
      wrong: [
        'Appraisal smoothing raises measured volatility because values are updated only when a buyer appears.',
        'Appraisal smoothing leaves volatility unchanged and only affects the level of fees.',
      ],
      why: 'Infrequent or anchored appraisals pull reported returns toward a smooth path. The economic risk and the co-movement with public markets can both be larger than the index suggests, so a Sharpe ratio built on those marks can look flattering.',
    },
    {
      d: 'medium',
      stem: 'Two Piper Street Capital funds each have a TVPI of 1.60. One returned cash in year three and the other in year nine. Which performance statement is most accurate?',
      correct: 'TVPI ignores the timing of cash flows, so the fund that pays earlier can have the higher IRR even when TVPI matches.',
      wrong: [
        'Equal TVPI figures imply equal since-inception IRRs whenever paid-in capital matches.',
        'TVPI subtracts the time value of money, so the later fund must have the higher multiple.',
      ],
      why: 'DPI and RVPI are ratios to paid-in capital. Adding them produces TVPI, still without a clock. IRR is money-weighted and falls when the same cash arrives later.',
    },
    {
      d: 'hard',
      stem: 'A fund’s profit after the management fee is above the hurdle amount. The limited partnership agreement uses either a soft hurdle or a hard hurdle at the same rate. Which comparison is most accurate?',
      correct: 'The soft hurdle produces the higher incentive fee, because it applies the rate to all profit after the management fee once the hurdle is cleared.',
      wrong: [
        'The hard hurdle produces the higher incentive fee, because it adds the hurdle amount to the incentive base.',
        'The two hurdles produce the same incentive fee whenever the hurdle rate is positive.',
      ],
      why: `Take a fund that starts at 100 and ends at 130 before fees, with a 2% management fee on beginning value, a 20% incentive rate, and an 8% hurdle. Profit after the fee clears the hurdle. The soft incentive is ${num(softForConcept.incentiveFee, 2)} and the hard incentive is ${num(hardForConcept.incentiveFee, 2)}. The hard rule keeps only the excess over the hurdle inside the incentive base.`,
    },
    {
      d: 'medium',
      stem: 'Westmill Fund is up for the year but the ending value after the management fee is still below its high-water mark. Which fee conclusion is most accurate?',
      correct: 'No incentive fee is due, because the incentive base cannot be negative and prior losses have not been recovered.',
      wrong: [
        'An incentive fee is due on the year’s gain even while the fund remains below the old peak.',
        'The high-water mark cancels the management fee whenever the incentive fee is zero.',
      ],
      why: 'The high-water mark stops the manager from collecting incentive on a recovery of earlier losses. The management fee is a separate charge and does not automatically turn off.',
    },
    {
      d: 'easy',
      stem: 'Piper Street Capital reports a since-inception internal rate of return for a buyout fund whose capital calls and distributions the general partner controls. Which description of that IRR is most accurate?',
      correct: 'It is a money-weighted return, so the timing of calls and distributions changes the result.',
      wrong: [
        'It is a time-weighted return, so adding or removing client cash cannot change it.',
        'It equals TVPI divided by the number of years the fund has been alive.',
      ],
      why: 'Fund IRR discounts the actual cash flows the partnership experienced. A time-weighted return would link subperiod growth and neutralize external cash-flow timing. TVPI still would not supply the missing clock.',
    },
    {
      d: 'hard',
      stem: 'Early deals in a Piper Street Capital fund paid deal-by-deal carried interest. Later losses mean the general partner has received more carry than the whole-fund agreement allows. Which protection addresses that gap?',
      correct: 'A clawback, which requires the general partner to return excess carried interest to the limited partners.',
      wrong: [
        'A catch-up, which pays the general partner a larger share of the next profitable deal.',
        'A gate, which limits how much hedge-fund investors may redeem on one date.',
      ],
      why: 'Clawback is the give-back that protects the agreed whole-fund split. A catch-up moves profit toward the general partner. A gate is a hedge-fund liquidity term, not a private-equity fee refund.',
    },
  ])

  return [...numericItems, ...multipleItems, ...conceptual]
}

function multipleItem(
  difficulty: Difficulty,
  name: string,
  paidIn: number,
  distributions: number,
  residual: number,
  which: 'DPI' | 'RVPI' | 'TVPI',
): Draft {
  const dpi = distributions / paidIn
  const rvpi = residual / paidIn
  const tvpi = dpi + rvpi
  const correct = which === 'DPI' ? dpi : which === 'RVPI' ? rvpi : tvpi
  const wrong: [number, number] =
    which === 'DPI' ? [tvpi, rvpi] : which === 'RVPI' ? [dpi, tvpi] : [dpi, rvpi]
  return numeric({
    topicId: 'alternatives',
    losId: 'ai-returns',
    difficulty,
    stem: `${name} has paid-in capital of ${millions(paidIn)}, distributions of ${millions(distributions)}, and residual value of ${millions(residual)}. DPI is distributions divided by paid-in capital, RVPI is residual value divided by paid-in capital, and TVPI equals DPI plus RVPI. ${which} is closest to:`,
    correct,
    wrong,
    format: (value) => num(value, 2),
    explain: (ans) =>
      `Distributions over paid-in capital give DPI of ${num(dpi, 2)}. Residual value over paid-in capital gives RVPI of ${num(rvpi, 2)}. Adding those ratios gives TVPI of ${num(tvpi, 2)}. ${which} is ${ans}. ${block(String.raw`\mathrm{TVPI}=\mathrm{DPI}+\mathrm{RVPI}=\dfrac{D+\mathrm{RV}}{\mathrm{PIC}}`)}`,
  })
}

function privateCapital(): Draft[] {
  return concept('ai-private', [
    {
      d: 'easy',
      stem: 'Piper Street Capital is buying a mature company with stable cash flow and will finance a large part of the price with debt. Which private-equity style is this?',
      correct: 'A buyout, which seeks control of an established business and uses leverage against its cash flow.',
      wrong: [
        'Seed venture capital, which funds a company that does not yet have a product.',
        'Farmland lease investing, which collects crop rent and does not take control of an operating company.',
      ],
      why: 'Buyouts are control investments in companies that can service debt. Early venture investing is a different risk: unproven products and a high chance of failure.',
    },
    {
      d: 'easy',
      stem: 'A Piper Street Capital venture fund buys minority stakes in young companies, knowing most of them may fail. Where does the fund expect the return to come from?',
      correct: 'A few large winners, because the payoff is skewed and the failures can be worth little.',
      wrong: [
        'Contractual coupons on senior secured loans to the same young companies.',
        'A contracted availability payment from a government offtaker.',
      ],
      why: 'Venture equity is not a coupon strategy. The partnership accepts many write-offs in exchange for occasional outcomes that are large relative to the cheque.',
    },
    {
      d: 'medium',
      stem: 'In its first three years a Piper Street Capital buyout fund shows a negative IRR, mostly from fees and investments that have not been sold. The sponsor still describes a J-curve. What does that label mean?',
      correct: 'Early reported results are often weak, and later exits can lift the IRR if the investments succeed. It is a path, not a promise.',
      wrong: [
        'Every private-equity fund is contractually required to become profitable after year four.',
        'The J-curve means the fund’s TVPI stays constant while the IRR rises in a straight line.',
      ],
      why: 'Fees and the delay before realizations pull early money-weighted returns down. Later distributions can bend the curve up. Nothing in the shape forces a profit.',
    },
    {
      d: 'medium',
      stem: 'Piper Street Capital provides subordinated debt that ranks behind senior loans and includes warrants on the borrower’s equity. Which private-debt description fits?',
      correct: 'Mezzanine debt, which takes more risk than senior debt and often adds an equity kicker.',
      wrong: [
        'A core real-estate mortgage, which is a senior claim on a stabilized building.',
        'Distressed debt bought only after the issuer has already emerged from bankruptcy with an all-equity balance sheet.',
      ],
      why: 'Mezzanine sits in the middle of the capital structure. The coupon compensates for subordination, and warrants add upside if the equity value grows.',
    },
    {
      d: 'medium',
      stem: 'A private-debt sleeve at Piper Street Capital makes floating-rate senior loans directly to middle-market borrowers and expects to hold them. Which feature is most accurate?',
      correct: 'Direct lending is primarily a credit exposure, often with covenants and a coupon, rather than an exit-multiple equity bet.',
      wrong: [
        'Direct lending pays the lender only if the borrower’s equity is sold in an IPO.',
        'Direct lending is risk-free because the loans are senior and privately negotiated.',
      ],
      why: 'Seniority and covenants can improve recovery and control. They do not erase credit risk, illiquidity, or the chance that the coupon fails to cover losses.',
    },
    {
      d: 'hard',
      stem: 'Piper Street Capital buys the bonds of a company that has missed payments, hoping to convert that claim into a controlling equity stake in a restructuring. Which strategy is this?',
      correct: 'Distressed debt with a loan-to-own objective.',
      wrong: [
        'Merger arbitrage, which is long the target and hedged against the announced deal spread.',
        'Core infrastructure, which buys a contracted asset with an operating history and no restructuring thesis.',
      ],
      why: 'Distressed investing can be a credit trade or a path to ownership. Loan-to-own uses the debt claim as the route into control if the equity is wiped out or diluted.',
    },
    {
      d: 'easy',
      stem: 'Piper Street Capital has raised a fund, called only part of the commitments, and still has the right to draw the rest for new deals. What is the undrawn amount commonly called?',
      correct: 'Dry powder, meaning committed capital that has not yet been called.',
      wrong: [
        'Residual value, meaning the current mark of companies already owned.',
        'DPI, meaning distributions already paid divided by paid-in capital.',
      ],
      why: 'Dry powder is future purchasing capacity under existing commitments. Residual value and DPI describe investments that have already been funded.',
    },
    {
      d: 'medium',
      stem: 'A buyout uses a large debt balance. The company’s asset return exceeds the interest rate on that debt in the sponsor’s base case. Which statement about the equity is most accurate?',
      correct: 'Leverage can raise the equity return in that base case, and it also magnifies the equity loss if the asset return falls short of the debt cost.',
      wrong: [
        'Leverage raises the equity return in every outcome because interest is a fixed number.',
        'Leverage does not affect equity returns when the debt is borrowed by the company rather than by the fund.',
      ],
      why: 'Debt is a fixed claim ahead of the equity. When the business earns more than that claim costs, the residual return rises. When it earns less, the residual absorbs the shortfall.',
    },
    {
      d: 'hard',
      stem: 'Limited partners in Piper Street Capital argue about when carried interest may be paid. Which waterfall contrast is most accurate?',
      correct: 'A whole-fund waterfall pays carry only after the fund-level capital and preferred return tests are met. A deal-by-deal waterfall can pay carry on winners earlier.',
      wrong: [
        'A whole-fund waterfall pays carry on each exit as soon as that one company is sold above cost.',
        'A deal-by-deal waterfall never uses a clawback because each deal is legally a separate fund.',
      ],
      why: 'The whole-fund, or European-style, sequence waits for the partnership results. The deal-by-deal, or American-style, sequence can distribute carry sooner, which is why clawback language matters.',
    },
    {
      d: 'medium',
      stem: 'A lender advances money to a venture-backed company that is still burning cash, and receives warrants along with a coupon. How should that loan be classified?',
      correct: 'Venture debt, a private-debt claim on a young company, often with an equity kicker and less operating history than a buyout loan.',
      wrong: [
        'A core buyout, because any loan to a company with outside shareholders is a control equity investment.',
        'An availability-payment infrastructure asset, because the coupon is contractual.',
      ],
      why: 'Venture debt is still debt: it ranks ahead of common equity and can default. The warrants are the extra compensation for lending before the company has stable cash flow.',
    },
    {
      d: 'easy',
      stem: 'Piper Street Capital finishes its work on a portfolio company and looks for a way to return capital. Which list contains only recognized exit routes?',
      correct: 'A trade sale, an initial public offering, a secondary buyout, or a dividend recapitalization.',
      wrong: [
        'A management fee holiday, a high-water mark, and a soft hurdle.',
        'An appraisal smoothing adjustment and a change in the cap-rate definition.',
      ],
      why: 'Exits convert company value into cash or a marketable security for the fund. Fee terms and valuation conventions are not exit routes.',
    },
    {
      d: 'hard',
      stem: 'A limited partner in Piper Street Capital ignores a capital call because a public-equity sale has not settled. Which consequence is most accurate?',
      correct: 'The partner faces funding risk: missing a call can trigger default remedies, including forfeiture or a forced sale of the interest.',
      wrong: [
        'Capital calls are optional once the subscription agreement is signed, so there is no penalty.',
        'The general partner must lend the limited partner the called amount at the risk-free rate.',
      ],
      why: 'Commitments are contractual. The partnership agreement typically sets penalties so the fund can close deals without one investor’s cash arriving late.',
    },
    {
      d: 'medium',
      stem: 'Piper Street Capital takes a minority stake in a growing, profitable company and does not layer on buyout-style debt. Which label fits best?',
      correct: 'Growth equity, which finances expansion and usually uses less leverage than a control buyout.',
      wrong: [
        'Distressed loan-to-own, which starts from a defaulted senior claim.',
        'Managed futures, which holds exchange-traded derivative contracts.',
      ],
      why: 'Growth equity sits between early venture and a leveraged buyout. The company is operating, the stake may not be control, and the return still depends on growth and the eventual exit rather than on a coupon.',
    },
    {
      d: 'hard',
      stem: 'Quarterly marks on a Piper Street Capital buyout fund move less than the public-equity market. A trustee concludes the fund is therefore a low-risk asset. What is the best response?',
      correct: 'Infrequent or smoothed marks can hide economic volatility, so the reported path is a weak measure of the equity risk.',
      wrong: [
        'Private-equity risk equals the standard deviation of the reported marks, with no further adjustment.',
        'Buyout equity has no cyclical risk because the companies are privately owned.',
      ],
      why: 'The absence of a daily price is not the absence of a daily change in value. Leverage, operating cyclicality, and exit-multiple risk remain even when the quarterly letter looks calm.',
    },
  ])
}

function realAssets(): Draft[] {
  const cap = 5_000_000 / 100_000_000
  const afterInterest = 4_000_000 / 100_000_000
  const onEquity = 5_000_000 / 60_000_000
  const value = 2_400_000 / 0.06
  const valueLowCap = 2_400_000 / 0.05
  const valueHighCap = 2_400_000 / 0.08
  const noi = 50_000_000 * 0.08
  const noiWrongRate = 50_000_000 * 0.06
  const noiInverted = 50_000_000 / 0.08

  return [
    numeric({
      topicId: 'alternatives',
      losId: 'ai-real',
      difficulty: 'medium',
      stem: 'An office property produces net operating income of USD 5.00 million before financing. Interest expense is USD 1.00 million. The property value is USD 100.00 million and the mortgage balance is USD 40.00 million. The cap rate equals NOI divided by property value, and NOI is measured before financing. The cap rate is closest to:',
      correct: cap,
      wrong: [afterInterest, onEquity],
      format: (value) => pct(value),
      explain: (ans) =>
        `NOI before interest is the numerator, and the whole property value is the denominator. Subtracting interest, or dividing by equity value, answers a different question. The cap rate is ${ans}. ${inline(String.raw`\text{cap rate}=\dfrac{\mathrm{NOI}}{\text{value}}=\dfrac{5}{100}`)}`,
    }),
    numeric({
      topicId: 'alternatives',
      losId: 'ai-real',
      difficulty: 'easy',
      stem: 'A warehouse has expected NOI of USD 2.40 million before financing. Investors require a 6.00% cap rate, defined as NOI divided by value. The property value implied by that cap rate is closest to:',
      correct: value,
      wrong: [valueLowCap, valueHighCap],
      format: (value) => millions(value),
      explain: (ans) =>
        `Value is NOI divided by the cap rate. Using a 5% or an 8% cap rate changes the price because a higher cap rate is a lower price for the same NOI. The value is ${ans}. ${inline(String.raw`V=\dfrac{2.40}{0.06}`)}`,
    }),
    numeric({
      topicId: 'alternatives',
      losId: 'ai-real',
      difficulty: 'easy',
      stem: 'A property is worth USD 50.00 million. The cap rate is 8.00% and is defined as NOI divided by value, with NOI measured before financing. NOI is closest to:',
      correct: noi,
      wrong: [noiWrongRate, noiInverted],
      format: (value) => millions(value),
      explain: (ans) =>
        `NOI equals the cap rate times value. A 6% rate uses the wrong yield, and dividing value by the cap rate inverts the definition. NOI is ${ans}. ${inline(String.raw`\mathrm{NOI}=0.08\times 50`)}`,
    }),
    ...concept('ai-real', [
      {
        d: 'easy',
        stem: 'An analyst subtracts mortgage interest from NOI before dividing by property value and calls the result a cap rate. What is the mistake?',
        correct: 'The cap rate uses NOI before financing, so interest belongs in the levered equity return, not in the cap-rate numerator.',
        wrong: [
          'The cap rate is defined only after interest, taxes, and the incentive fee.',
          'The cap rate equals the coupon on the mortgage, so NOI is irrelevant.',
        ],
        why: 'NOI is an unlevered property figure: rent minus operating costs, before debt service. Mixing in the loan makes the ratio depend on financing that the next buyer might not use.',
      },
      {
        d: 'medium',
        stem: 'Two buildings have the same expected NOI before financing. Building A is priced at a higher cap rate than Building B. Which comparison follows directly from the definition?',
        correct: 'Building A has the lower value, because value equals NOI divided by the cap rate.',
        wrong: [
          'Building A has the lower required yield, because a high cap rate means a high price.',
          'Building A must have more debt, because cap rates are computed from interest expense.',
        ],
        why: 'Holding NOI fixed, price and cap rate move in opposite directions. The cap rate itself does not tell you the loan balance.',
      },
      {
        d: 'medium',
        stem: 'A real-estate program labels one sleeve core and another opportunistic. Which contrast is most accurate?',
        correct: 'Core property is typically stabilized and modestly levered. Opportunistic property takes development, vacancy, or turnaround risk and often uses more leverage.',
        wrong: [
          'Core property is ground-up development with no tenants, and opportunistic property is a fully leased government bond.',
          'The two labels describe fee schedules only and say nothing about asset risk.',
        ],
        why: 'The style names are a risk ladder: core, then core-plus, value-add, and opportunistic. They are about the buildings and the leverage, not just about what the manager calls the fee.',
      },
      {
        d: 'medium',
        stem: 'A pension compares a private property portfolio with an equity REIT that owns similar buildings. Which liquidity and market statement is most accurate?',
        correct: 'The REIT trades on an exchange, so it is easier to resize, but its price can move with public equities and may not track the private appraisal.',
        wrong: [
          'The REIT cannot fall when the stock market falls, because it owns buildings rather than companies.',
          'The private portfolio can be sold at its appraisal every day, so it is as liquid as the REIT.',
        ],
        why: 'Exchange listing solves the trading problem and imports equity-market sentiment. Private marks can look calmer precisely because they are not traded every day.',
      },
      {
        d: 'easy',
        stem: 'An equity REIT and a mortgage REIT both appear in a real-estate allocation. Which distinction is most accurate?',
        correct: 'The equity REIT owns properties. The mortgage REIT owns loans or mortgage securities and is primarily a credit and interest-rate exposure.',
        wrong: [
          'Both REITs are legally required to hold only physical land and no financial claims.',
          'The mortgage REIT’s return equals the cap rate on the buildings that secure the loans, with no credit risk.',
        ],
        why: 'The word REIT does not fix the underlying risk. Equity REITs are a property business. Mortgage REITs are a financing business.',
      },
      {
        d: 'easy',
        stem: 'Halcyon Water buys a water-treatment plant that has been operating for twelve years, with a known volume history and an existing workforce. How should the asset be classified?',
        correct: 'Brownfield infrastructure, because it already has an operating history.',
        wrong: [
          'Greenfield infrastructure, because every utility project is treated as new construction.',
          'Venture capital, because the asset is not listed on an exchange.',
        ],
        why: 'Brownfield means the project is already operating, so the buyer can study traffic, throughput, or collections. Greenfield still has to be built.',
      },
      {
        d: 'medium',
        stem: 'A sponsor is financing a toll road that has not been built. Construction takes four years and traffic after opening is only a forecast. Which risk description is most accurate?',
        correct: 'This is greenfield infrastructure, so construction risk is present and there is no operating history yet.',
        wrong: [
          'This is brownfield infrastructure, because a government permit counts as an operating history.',
          'Construction risk disappears once the debt is non-recourse to the sponsor’s other assets.',
        ],
        why: 'Greenfield investors bear delay, cost overrun, and ramp-up risk before a cash-flow history exists. Non-recourse financing shifts who posts collateral; it does not finish the road.',
      },
      {
        d: 'medium',
        stem: 'Halcyon Water is paid by a municipality whenever the treatment plant meets availability and quality tests. Payment does not rise or fall with how many households choose to use extra water. Which risk has been reduced?',
        correct: 'Demand, or volume, risk is limited because the payment depends on availability rather than on usage.',
        wrong: [
          'All political and regulatory risk is eliminated by the availability test.',
          'The asset is risk-free because the payment is contractual.',
        ],
        why: 'Availability payments transfer the “will anyone show up?” risk away from the investor, within the terms of the contract. They do not remove the risk that the contract is changed, unpaid, or failed by an operational miss.',
      },
      {
        d: 'medium',
        stem: 'A different road project pays Halcyon Water only from tolls collected on vehicles that choose that route. Which infrastructure risk is most prominent?',
        correct: 'Demand, or volume, risk, because revenue moves with traffic rather than with a fixed availability payment.',
        wrong: [
          'No volume risk exists, because a road is a physical asset with an operating history.',
          'The project has venture-capital failure risk only, and traffic forecasts are irrelevant.',
        ],
        why: 'Merchant or usage-based infrastructure keeps the revenue exposure of the underlying service. A brownfield toll road can still have an operating history and retain volume risk.',
      },
      {
        d: 'hard',
        stem: 'An infrastructure concession resets part of Halcyon Water’s tariff with a published inflation index. A trustee treats the holding as protected against every loss of purchasing power. What is the best correction?',
        correct: 'The inflation link can help the real cash flow, but regulatory, political, and operating risks remain.',
        wrong: [
          'An inflation index converts the concession into a risk-free real bond.',
          'Inflation linkage raises demand risk and removes regulatory risk by law.',
        ],
        why: 'Indexation addresses one exposure, the nominal price in the formula. It does not guarantee volume, collection, or that the regulator will leave the formula in place.',
      },
      {
        d: 'medium',
        stem: 'Over a five-year hold, a building’s NOI grows and the exit cap rate is lower than the entry cap rate. Which statement about the cap rate and the holding-period return is most accurate?',
        correct: 'The entry cap rate is not the holding-period return, because NOI growth and a cap-rate change also affect the sale price.',
        wrong: [
          'The holding-period return equals the entry cap rate for any hold longer than one year.',
          'A lower exit cap rate reduces the sale price when NOI is unchanged.',
        ],
        why: 'The cap rate is a one-period income yield on current value. Total return also includes the change in price. A lower exit cap rate, holding NOI fixed, raises the sale price.',
      },
      {
        d: 'hard',
        stem: 'A private real-estate index is built from appraisals and seems to lag a sharp decline in listed property shares. Which measurement point is most accurate?',
        correct: 'Appraisal-based indexes can lag transaction prices and can understate short-run volatility and correlation.',
        wrong: [
          'Appraisal indexes lead public markets because appraisers see private bids first.',
          'Lag in an appraisal index proves that private property rose while public shares fell.',
        ],
        why: 'Stale appraisals delay bad news and good news. The lag is a measurement issue. It is not evidence that the economic values moved in opposite directions.',
      },
      {
        d: 'medium',
        stem: 'An investor buys the same building once with no debt and once with a large mortgage. NOI before financing is unchanged. What happens to the equity position?',
        correct: 'Leverage increases the volatility of the equity return relative to the unlevered property.',
        wrong: [
          'Leverage does not change equity volatility when the cap rate is computed before interest.',
          'Leverage reduces equity volatility because the lender shares each dollar of NOI equally.',
        ],
        why: 'The lender is paid first. The equity is the residual, so both gains and shortfalls in property value are concentrated on a smaller equity cheque.',
      },
    ]),
  ]
}

function naturalResources(): Draft[] {
  const contango = 0.05 - 0.03 + 0.01
  const contangoSpotOnly = 0.05
  const contangoFlipped = 0.05 + 0.03 + 0.01
  const backwardation = -0.02 + 0.04 + 0.01
  const backwardationSpot = -0.02
  const backwardationFlipped = -0.02 - 0.04 + 0.01

  return [
    numeric({
      topicId: 'alternatives',
      losId: 'ai-natural',
      difficulty: 'medium',
      stem: 'A commodity investor decomposes the year into a price return of 5.00%, a roll return of −3.00% because the futures curve is in contango, and a collateral return of 1.00%. The total return is the sum of those three parts. The total return is closest to:',
      correct: contango,
      wrong: [contangoSpotOnly, contangoFlipped],
      format: (value) => pct(value),
      explain: (ans) =>
        `Price return plus a negative roll return plus collateral return is the total. Dropping the roll and the collateral, or flipping the contango roll to a gain, misstates the position. The total return is ${ans}. ${inline(String.raw`0.05+(-0.03)+0.01=0.03`)}`,
    }),
    numeric({
      topicId: 'alternatives',
      losId: 'ai-natural',
      difficulty: 'medium',
      stem: 'A later year has a price return of −2.00%, a roll return of 4.00% because the futures curve is in backwardation, and a collateral return of 1.00%. The total return is the sum of the three parts. The total return is closest to:',
      correct: backwardation,
      wrong: [backwardationSpot, backwardationFlipped],
      format: (value) => pct(value),
      explain: (ans) =>
        `Backwardation makes the long roll return positive in the usual futures-curve case. Using only the spot move, or treating the roll as a cost, misses that sign. The total return is ${ans}. ${inline(String.raw`-0.02+0.04+0.01=0.03`)}`,
    }),
    ...concept('ai-natural', [
      {
        d: 'easy',
        stem: 'A commodity index return is explained with three pieces. Which list names those pieces?',
        correct: 'Price return, roll return, and collateral return.',
        wrong: [
          'Management fee, incentive fee, and high-water mark.',
          'DPI, RVPI, and TVPI.',
        ],
        why: 'The futures investor earns or loses the change in the commodity price, the gain or cost of rolling the futures, and the interest on posted collateral. Private-equity multiples and hedge-fund fees are different decompositions.',
      },
      {
        d: 'easy',
        stem: 'The nearby futures price sits below the further-dated futures price, so the curve slopes upward. A long-only index rolls out of the nearby contract. Which roll description is most accurate?',
        correct: 'The curve is in contango, and the long roll return is typically negative.',
        wrong: [
          'The curve is in backwardation, and the long roll return is typically negative.',
          'The curve is in contango, and the long roll return is typically positive.',
        ],
        why: 'Contango means the investor is selling the cheaper nearby contract and buying a more expensive later one, which is a cost if that shape persists. Backwardation is the opposite slope.',
      },
      {
        d: 'easy',
        stem: 'Nearby commodity futures trade above longer-dated futures. Which statement about a long index that rolls forward is most accurate?',
        correct: 'The curve is in backwardation, and the long roll return is typically positive.',
        wrong: [
          'The curve is in contango, and the long roll return is typically positive.',
          'Backwardation removes collateral return, so the total return equals the price return only.',
        ],
        why: 'In backwardation the long roll sells the expensive nearby and buys a cheaper deferred contract. Collateral return is a separate piece and does not vanish because of the curve shape.',
      },
      {
        d: 'medium',
        stem: 'A client adds the Treasury return earned on cash posted against commodity futures to the roll return and calls the sum “roll yield.” What should the analyst separate?',
        correct: 'Collateral return is the interest on the posted cash. Roll return comes from moving along the futures curve. They are different pieces.',
        wrong: [
          'Collateral return is just another name for roll return, so adding them double-counts nothing.',
          'Collateral return is the change in the spot price of the commodity.',
        ],
        why: 'The cash earns a financing rate whether the curve is in contango or backwardation. The roll depends on the curve. The spot move is the third piece.',
      },
      {
        d: 'medium',
        stem: 'Redcedar Timber owns forests that keep adding wood volume even in a year when log prices are flat. Harvest can be delayed if prices are weak. Which return feature is most accurate?',
        correct: 'Biological growth can add value when timber prices do not, and the owner has some choice about when to cut.',
        wrong: [
          'Timber return equals the collateral return on a futures index and cannot grow while prices are flat.',
          'Delaying harvest eliminates price risk because the trees are no longer exposed to the log market.',
        ],
        why: 'Standing timber is both inventory and a growing asset. Waiting can be valuable, but the land and the wood remain exposed to prices, weather, and demand when the harvest eventually happens.',
      },
      {
        d: 'medium',
        stem: 'Veldt Agriculture leases cropland to operators and also expects the land price to change. Which description of the return is most accurate?',
        correct: 'The holding can earn lease income and can gain or lose on the land price. Crop prices and weather still matter to the tenants and to rents.',
        wrong: [
          'Farmland return is only the roll return on a grain futures contract.',
          'A cash lease removes all agricultural risk because the owner does not drive the tractor.',
        ],
        why: 'Lease income is the property yield. Land appreciation is a second source. The tenant’s ability to pay, and the next rent negotiation, still depend on farming conditions.',
      },
      {
        d: 'easy',
        stem: 'An investor wants commodity exposure without storing barrels or bushels. The vehicle is a futures index that replaces expiring contracts. Which statement is most accurate?',
        correct: 'The index obtains exposure through futures and must roll them. It does not require the investor to warehouse the physical commodity.',
        wrong: [
          'A futures index holds the physical inventory, so storage costs appear as a management fee only.',
          'Rolling futures removes both price return and roll return from the index.',
        ],
        why: 'The futures position tracks the commodity and the collateral earns interest. The roll is the mechanical replacement of expiring contracts, which is why curve shape enters the return.',
      },
      {
        d: 'hard',
        stem: 'Industrial users place a high value on having a commodity in inventory today. Futures for later delivery are cheaper than the spot price. Which link is most accurate?',
        correct: 'A high convenience yield can pull the curve into backwardation, which is the case where the long roll return is typically positive.',
        wrong: [
          'A high convenience yield forces contango, so the long roll return is typically negative.',
          'Convenience yield is the interest earned on futures collateral and does not affect the curve.',
        ],
        why: 'Convenience yield is the benefit of holding the physical good. When that benefit is large relative to storage and financing, the futures curve can slope downward. Collateral interest remains a separate return piece.',
      },
      {
        d: 'hard',
        stem: 'Redcedar Timber is marked by annual appraisals. A broad commodity futures index is marked in the market every day. Which comparison of measured risk is most accurate?',
        correct: 'The timber appraisal can look smoother than the futures index even when land and log values are risky, because infrequent marks understate volatility.',
        wrong: [
          'The futures index is smoother, because rolling contracts removes price changes.',
          'Appraisal and futures volatility are directly comparable without considering how often each is priced.',
        ],
        why: 'A daily futures mark records the path. An annual appraisal can skip it. That measurement gap, not a claim that trees have no risk, explains part of the difference in reported volatility.',
      },
      {
        d: 'medium',
        stem: 'The spot price of a commodity is unchanged over the year and the futures curve stays in contango. A long-only index posts Treasury bills as collateral. Which result is most accurate?',
        correct: 'The long roll return is typically negative in contango, so the index can lose money on the roll even though the spot price did not move.',
        wrong: [
          'An unchanged spot price means the total return is zero, whatever the shape of the curve.',
          'Contango makes the long roll return positive, so the index gains the roll when the spot price is flat.',
        ],
        why: 'With a flat spot price the price return is zero, but the roll is not. Collateral return can offset only part of a negative roll. Contango is the costly shape for the long index.',
      },
    ]),
  ]
}

function hedgeFunds(): Draft[] {
  return concept('ai-hedge', [
    {
      d: 'easy',
      stem: 'Westmill Fund holds long and short equity positions. Net exposure is positive but well below the value of the longs. Which strategy family is this?',
      correct: 'Equity long/short, which combines directional net exposure with security selection on both sides.',
      wrong: [
        'Merger arbitrage, which isolates a deal spread after an announced transaction.',
        'Asset-backed availability infrastructure, which is paid if a plant is operating.',
      ],
      why: 'Long/short equity is still an equity book. The shorts reduce, but do not have to eliminate, market exposure. The manager can also be net short.',
    },
    {
      d: 'medium',
      stem: 'A Westmill Fund sleeve keeps dollar amounts of long and short equities nearly matched and targets a beta close to zero. Which description is most accurate?',
      correct: 'Equity market-neutral, where the return is meant to come from the long-short spread rather than from the market’s direction.',
      wrong: [
        'Global macro, which takes top-down directional views on rates, currencies, and commodities.',
        'A buyout fund, which uses private control equity and does not short public shares.',
      ],
      why: 'Market-neutral is the special case of equity hedge that tries to remove the market factor. Imperfect hedges mean the beta is rarely exactly zero in practice.',
    },
    {
      d: 'medium',
      stem: 'After a cash takeover is announced, Westmill Fund buys the target and shorts a related hedge. The position loses if regulators block the deal. Which family fits?',
      correct: 'Event-driven merger arbitrage, which earns a spread if the announced deal closes and loses if it breaks.',
      wrong: [
        'Relative-value fixed-income arbitrage, which hedges a yield-curve or credit-spread relationship.',
        'Managed futures, which follows price trends in listed futures without needing a corporate event.',
      ],
      why: 'The catalyst is the deal. Deal-break, financing, and timing risk are the point of the trade, not a general view on the equity market.',
    },
    {
      d: 'medium',
      stem: 'Westmill Fund also buys bonds of a company near default and sometimes presses for a restructuring. In which hedge-fund family do distressed securities and merger arbitrage both sit?',
      correct: 'Event-driven, because both strategies depend on a corporate event rather than on a matched relative-value hedge.',
      wrong: [
        'Commodity carry, because both strategies earn a roll return.',
        'Core real estate, because both strategies own stabilized buildings.',
      ],
      why: 'Event-driven books share a catalyst: a merger, a restructuring, a spin-off, or a similar corporate action. The securities and the hedges differ by event.',
    },
    {
      d: 'hard',
      stem: 'Westmill Fund buys a convertible bond and shorts the issuer’s equity, trying to isolate a cheap embedded option. Which classification is most accurate?',
      correct: 'Relative value, specifically convertible arbitrage.',
      wrong: [
        'Activist event-driven, which buys equity to force a sale of the whole company.',
        'Direct lending, which holds a private loan to maturity and does not hedge with listed equity.',
      ],
      why: 'The trade is about the pricing gap between the convertible and the equity hedge. It is not a campaign to change the company’s strategy and it is not a private-credit hold.',
    },
    {
      d: 'easy',
      stem: 'A Westmill Fund portfolio manager takes discretionary views on interest rates, currencies, and equity indexes across countries. Which strategy is this?',
      correct: 'Global macro, a top-down strategy that can be long or short entire markets.',
      wrong: [
        'Equity market-neutral, which keeps stock-specific longs and shorts with little net market exposure.',
        'Mezzanine lending, which holds subordinated private loans.',
      ],
      why: 'Macro bets are about policy, growth, and market direction. Security-level neutrality is a different equity-hedge design.',
    },
    {
      d: 'medium',
      stem: 'Another Westmill Fund program follows price trends in liquid futures across commodities, rates, and currencies, and it does not forecast a single company’s earnings. Which label fits?',
      correct: 'Managed futures, often called a CTA, commonly using systematic trend-following.',
      wrong: [
        'Private-equity venture capital, which takes concentrated stakes in young companies.',
        'Appraisal-based core property, which is marked by periodic valuations rather than by futures trends.',
      ],
      why: 'CTAs trade listed derivatives and can move long or short as trends change. Their liquidity is generally better than a private-equity drawdown fund, and the risk is the trend model plus leverage.',
    },
    {
      d: 'medium',
      stem: 'An investor reaches Westmill Fund only through a fund of funds that charges its own fee on top of the underlying managers’ fees. Which tradeoff is most accurate?',
      correct: 'The extra layer can add manager diversification and access, and it adds a second fee that lowers the investor’s net return.',
      wrong: [
        'The fund-of-funds fee replaces all underlying management and incentive fees.',
        'A fund of funds is legally a separately managed account, so the investor owns each hedge fund’s securities directly.',
      ],
      why: 'The wrapper solves some operational and minimum-size problems. It does not repeal the fees of the funds it holds, and the investor owns the fund-of-funds shares rather than every underlying position.',
    },
    {
      d: 'hard',
      stem: 'A hedge-fund index adds Westmill Fund only after three strong years, and those three years are written into the index history. Which bias is that?',
      correct: 'Backfill, or instant-history, bias, which tends to overstate past index returns.',
      wrong: [
        'A high-water mark, which reduces future incentive fees after a loss.',
        'Appraisal smoothing, which comes from infrequent private-asset valuations.',
      ],
      why: 'Managers are more willing to start reporting after good results. Putting that earlier success into the index history makes the published track record look better than a strategy that was followed in real time.',
    },
    {
      d: 'hard',
      stem: 'Several funds that shut down after losses are dropped from a hedge-fund index. The index then shows only the funds that survived. Which bias results?',
      correct: 'Survivorship bias, which tends to overstate the returns of the strategy as investors actually experienced it.',
      wrong: [
        'A soft hurdle, which changes the incentive fee on a single fund.',
        'Contango, which affects the roll return of a commodity index.',
      ],
      why: 'If the failures disappear from the average, the remaining average is too high. An investor who picked funds at the start would have owned some of the funds that later vanished from the index.',
    },
    {
      d: 'medium',
      stem: 'Westmill Fund allows redemptions once a year after a one-year lock-up, and it may cap the share of the fund that leaves on any date. Which terms are those?',
      correct: 'A lock-up restricts the first redemption, and a gate can limit how much is paid out on a dealing date.',
      wrong: [
        'A lock-up is a high-water mark, and a gate is the incentive fee.',
        'A gate requires the fund to return all capital within five business days of any request.',
      ],
      why: 'Liquidity terms exist because the positions may not be saleable on the investor’s schedule. A gate spreads redemptions. It is not a promise of immediate cash.',
    },
    {
      d: 'hard',
      stem: 'Westmill Fund moves a hard-to-sell position into a separate sleeve. Redeeming investors receive cash on the liquid book and keep a claim on the illiquid sleeve. What is that sleeve?',
      correct: 'A side pocket, used so exiting investors do not take a full cash share of assets the fund cannot sell fairly.',
      wrong: [
        'A catch-up, used to accelerate carried interest to the general partner.',
        'Dry powder, meaning committed capital that has not been called.',
      ],
      why: 'The side pocket matches the illiquid asset with the investors who were present when it was bought. It is a liquidity tool, not a fee waterfall and not unused commitments.',
    },
    {
      d: 'easy',
      stem: 'A trustee hears the name Westmill Fund and assumes the portfolio is hedged against equity-market declines. The fund’s net exposure is in fact large and positive. Which correction is most accurate?',
      correct: '“Hedge fund” describes a fee and legal wrapper, not a promise that market exposure is hedged away.',
      wrong: [
        'Every hedge fund is required to keep beta below 0.2, so the exposure figure must be wrong.',
        'A positive net exposure means the fund is classified as private equity.',
      ],
      why: 'Many hedge funds are directional. The shorts and the derivatives are tools the manager may use. The label alone does not tell you the beta.',
    },
    {
      d: 'hard',
      stem: 'Westmill Fund uses leverage and short sales. During a squeeze, losses grow and redemption requests are gated. Which risk statement is most accurate?',
      correct: 'Leverage and shorting can produce losses beyond a simple long-only decline, and the liquidity terms can prevent investors from leaving at the same moment.',
      wrong: [
        'Short sales cap the fund’s loss at the management fee, so gating is unnecessary.',
        'Leverage reduces losses in a squeeze because borrowed securities rise in value for the long holder only.',
      ],
      why: 'A short has open-ended loss potential, and borrowed funding can be withdrawn. Gates then turn an investment loss into a funding and liquidity problem for the investor who wants out.',
    },
  ])
}

function digitalAssets(): Draft[] {
  return concept('ai-digital', [
    {
      d: 'easy',
      stem: 'A consultant describes a shared record of transactions that many nodes update, and a blockchain as one way to organize that record. Which statement is most accurate?',
      correct: 'A distributed ledger is the broader idea, and a blockchain is one structure used to keep that kind of record.',
      wrong: [
        'A blockchain exists only if a commercial bank stores the only copy of the ledger.',
        'A distributed ledger and a hedge-fund side pocket are the same legal structure.',
      ],
      why: 'The ledger is distributed so that no single private database is the only record. How the chain of blocks is written is an implementation choice inside that idea.',
    },
    {
      d: 'medium',
      stem: 'An investor loses the private keys to a digital-asset wallet, and a separate client keeps coins at a trading firm that later fails. Which risk do both stories illustrate?',
      correct: 'Custody risk: control of the keys, or of the intermediary that holds them, is the control of the asset.',
      wrong: [
        'Roll-return risk, which arises only when a commodity futures curve is in contango.',
        'Appraisal smoothing, which understates the volatility of infrequently valued private assets.',
      ],
      why: 'On these networks the holder of the key can move the asset. Self-custody and exchange custody fail in different ways, and both are custody problems rather than a feature of timber or commodity rolls.',
    },
    {
      d: 'medium',
      stem: 'A smart-contract application used by a digital-asset fund is drained because of a software bug after a network upgrade. Which risk is the central one?',
      correct: 'Technology risk, including bugs, exploits, and failed or contentious upgrades.',
      wrong: [
        'A soft hurdle, because the loss is a fee calculation.',
        'Cap-rate expansion, because the bug changes NOI on a building.',
      ],
      why: 'The protocol and the applications built on it can fail even when the investment thesis about adoption was coherent. That is a technology failure, not a property-valuation identity.',
    },
    {
      d: 'medium',
      stem: 'A regulator reclassifies a token, restricts which firms may list it, and changes the tax treatment of a sale. The code that runs the network is unchanged. Which risk showed up?',
      correct: 'Regulatory risk, which can limit holding, trading, custody, or the after-tax result without a change in the software.',
      wrong: [
        'Biological growth risk, which applies to a timber stand such as Redcedar Timber.',
        'Collateral return, which is the interest posted against commodity futures.',
      ],
      why: 'Legal status is not fixed by the ledger. A token that traded freely can become expensive or impossible to hold inside a regulated account after a rule change.',
    },
    {
      d: 'hard',
      stem: 'A portfolio constructed in calm markets shows a low correlation between digital assets and equities. In a later stress period the two fall together. Which conclusion is most accurate?',
      correct: 'Correlations can rise in stress, so digital assets should not be described as always diversifying.',
      wrong: [
        'A low correlation estimated in a calm sample proves the stress correlation will stay low.',
        'Digital assets have a contractual zero beta, so a joint decline is a data error.',
      ],
      why: 'Diversification is a correlation outcome, not a label. When investors cut risk at the same time, assets that looked independent can move together. Nothing in the technology sets beta to zero.',
    },
    {
      d: 'medium',
      stem: 'A token is described as a stablecoin that targets one unit of a fiat currency. The reserve mix is opaque. Which statement is most accurate?',
      correct: 'The peg can break if reserves, the redemption mechanism, or confidence fails. The word “stable” is an objective, not a guarantee.',
      wrong: [
        'A stablecoin is legally a Treasury bill, so the peg cannot break.',
        'A stablecoin’s price risk equals the cap rate on Halcyon Water’s treatment plant.',
      ],
      why: 'Pegs are maintained by collateral, by redemption, or by an algorithm. Each of those can fail. The token is not a government bill merely because it quotes a government unit of account.',
    },
    {
      d: 'easy',
      stem: 'One network pays miners who spend computation to add blocks. Another selects validators who post stake. Which comparison is most accurate?',
      correct: 'Proof-of-work and proof-of-stake are different consensus methods. Staking is not the same thing as custody of a client’s keys by a broker.',
      wrong: [
        'Proof-of-stake means a custodian has insured the coins, so technology risk is gone.',
        'Proof-of-work is a private-equity waterfall that pays carried interest to miners.',
      ],
      why: 'Consensus decides who may write the next valid block. Custody decides who can sign for a particular balance. Mixing those ideas hides both the energy or capital used to secure the chain and the key-management problem.',
    },
    {
      d: 'hard',
      stem: 'A digital token pays no contractual coupon and has no claim on a company’s assets. An analyst discounts a promised dividend anyway. What is the best caution?',
      correct: 'Without a contractual cash flow, a dividend-discount value is not an adequate description of what the holder owns.',
      wrong: [
        'Every token is a claim on Halcyon Water’s availability payments, so the dividend model is required.',
        'The absence of a coupon means the token’s risk is zero and the discount rate is the risk-free rate.',
      ],
      why: 'Valuation still requires a story about future use, scarcity, or a claim that really exists. Inventing a dividend the code does not pay makes the model look more precise than the right is.',
    },
    {
      d: 'medium',
      stem: 'One token is marketed as a utility token that grants access to a service. Another is marketed as a security token that is a claim on an asset. Which legal point is most accurate?',
      correct: 'The marketing label does not settle the legal category. Either token can still face regulatory, custody, and technology risk.',
      wrong: [
        'Calling a token a utility token exempts it from every securities rule in every jurisdiction.',
        'A security token cannot fall in price because it is a claim, so correlation risk is gone.',
      ],
      why: 'Regulators look at economic substance. A label chosen by the issuer is not a shield, and a real claim can still be illiquid, mis-sold, or technologically unreachable.',
    },
    {
      d: 'hard',
      stem: 'A fund holds its digital assets at one large trading venue to make rebalancing easier. The ledger itself is operated by many nodes. Which risk remains concentrated?',
      correct: 'Custody and operational risk at the venue remain concentrated, even though the underlying ledger is distributed.',
      wrong: [
        'A distributed ledger means no intermediary failure can affect the fund’s ability to reach its coins.',
        'Exchange custody removes regulatory risk because the venue is the legal owner of the protocol.',
      ],
      why: 'Distribution of the ledger and distribution of the fund’s keys are different designs. Leaving the keys with one firm recreates a single point of failure, and the firm’s licenses can change.',
    },
  ])
}

export function buildAlternatives(): Draft[] {
  return [
    ...exactly('ai-features', 12, features()),
    ...exactly('ai-returns', 22, returns()),
    ...exactly('ai-private', 14, privateCapital()),
    ...exactly('ai-real', 16, realAssets()),
    ...exactly('ai-natural', 12, naturalResources()),
    ...exactly('ai-hedge', 14, hedgeFunds()),
    ...exactly('ai-digital', 10, digitalAssets()),
  ]
}

function assertDrafts(drafts: Draft[]): void {
  const questions = finalizeTopic('alternatives', drafts)
  const stems = new Set<string>()
  const difficulties = new Set<string>()
  for (const draft of drafts) {
    if (!draft.explanation.includes(draft.correct)) {
      throw new Error(`Explanation missing answer for ${draft.losId}: ${draft.correct.slice(0, 80)}`)
    }
    if (/\bclosest to\b/i.test(draft.stem) && !/\\\(|\\\[/.test(draft.explanation)) {
      throw new Error(`Missing KaTeX: ${draft.stem.slice(0, 80)}`)
    }
  }
  for (const question of questions) {
    const key = question.stem.replace(/\s+/g, ' ').trim().toLowerCase()
    if (stems.has(key)) throw new Error(`Duplicate stem on ${question.id}`)
    stems.add(key)
    difficulties.add(question.difficulty)
  }
  if (difficulties.size < 3) throw new Error('Difficulty mix is incomplete')
  console.log(questions.length)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  assertDrafts(buildAlternatives())
}
