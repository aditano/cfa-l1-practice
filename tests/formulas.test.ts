import { describe, expect, it } from 'vitest'
import {
  annualize,
  approxConvexity,
  approxModifiedDuration,
  basicEps,
  betaFromCorrelation,
  bondPrice,
  capm,
  cipForward,
  convertibleDiluted,
  dupontFive,
  dupontThree,
  ear,
  forwardPrice,
  gordon,
  hedgeFundEnd,
  hpr,
  inventoryFlows,
  irr,
  jensenAlpha,
  macaulayDuration,
  marginCallPriceLong,
  mmCostOfEquity,
  modifiedDuration,
  npv,
  onePeriodBinomial,
  oneYearForwardRate,
  optimalRiskyWeight,
  percentPriceChange,
  portfolioVariance,
  putCallParityCall,
  safetyFirst,
  sharpe,
  treasuryIncrementalShares,
  treynor,
  twr,
  twoStagePrice,
  utilityMeanVariance,
  wacc,
} from '../src/lib/formulas'

describe('return and discount formulas', () => {
  it('includes income in the holding-period return', () => {
    expect(hpr(48, 52.4, 1.2)).toBeCloseTo(5.6 / 48, 8)
  })

  it('links subperiod returns geometrically', () => {
    expect(twr([0.1, -0.05, 0.08])).toBeCloseTo(1.1 * 0.95 * 1.08 - 1, 8)
  })

  it('annualizes a two-year holding period', () => {
    expect(annualize(0.21, 2)).toBeCloseTo(0.1, 8)
  })

  it('compounds a nominal rate to an effective annual rate', () => {
    expect(ear(0.12, 12)).toBeCloseTo((1.01) ** 12 - 1, 8)
  })

  it('prices a growing dividend stream', () => {
    const priced = gordon(2, 0.09, 0.04)
    expect(priced.d1).toBeCloseTo(2.08, 8)
    expect(priced.price).toBeCloseTo(41.6, 8)
  })
})

describe('fixed income formulas', () => {
  it('prices a par bond at par and computes Macaulay duration', () => {
    expect(bondPrice(100, 0.06, 0.06, 2)).toBeCloseTo(100, 6)
    expect(macaulayDuration(100, 0.06, 0.06, 2)).toBeCloseTo(1.943396, 4)
    expect(modifiedDuration(1.943396, 0.06)).toBeCloseTo(1.833393, 4)
  })

  it('matches the duration-convexity price change identity', () => {
    expect(percentPriceChange(7, 40, 0.01)).toBeCloseTo(-0.068, 8)
    const base = bondPrice(100, 0.05, 0.06, 4)
    const down = bondPrice(100, 0.05, 0.05, 4)
    const up = bondPrice(100, 0.05, 0.07, 4)
    const duration = approxModifiedDuration(down, up, base, 0.01)
    const convexity = approxConvexity(down, up, base, 0.01)
    expect(duration).toBeGreaterThan(0)
    expect(convexity).toBeGreaterThan(0)
  })

  it('implies a one-year forward from two spot rates', () => {
    expect(oneYearForwardRate(0.05, 0.06)).toBeCloseTo((1.06 ** 2) / 1.05 - 1, 8)
  })
})

describe('portfolio, corporate, and derivative formulas', () => {
  it('drops portfolio variance as correlation falls', () => {
    const high = portfolioVariance(0.6, 0.2, 0.4, 0.3, 1)
    const low = portfolioVariance(0.6, 0.2, 0.4, 0.3, 0.25)
    expect(low).toBeLessThan(high)
    expect(low).toBeCloseTo(0.036, 8)
  })

  it('prices CAPM, Sharpe, Treynor, Jensen, and utility consistently', () => {
    expect(capm(0.04, 1.2, 0.1)).toBeCloseTo(0.112, 8)
    expect(sharpe(0.15, 0.03, 0.2)).toBeCloseTo(0.6, 8)
    expect(treynor(0.14, 0.03, 1.1)).toBeCloseTo(0.1, 8)
    expect(jensenAlpha(0.14, 0.03, 1.1, 0.1)).toBeCloseTo(0.033, 8)
    expect(utilityMeanVariance(0.1, 4, 0.04)).toBeCloseTo(0.02, 8)
    expect(optimalRiskyWeight(0.12, 0.02, 4, 0.2)).toBeCloseTo(0.625, 8)
    expect(betaFromCorrelation(0.6, 0.25, 0.15)).toBeCloseTo(1, 8)
    expect(safetyFirst(0.12, 0.04, 0.16)).toBeCloseTo(0.5, 8)
  })

  it('computes NPV, IRR, WACC, and levered equity cost', () => {
    expect(npv(0.1, [-100, 60, 60])).toBeCloseTo(4.132231, 3)
    expect(irr([-100, 60, 60])).toBeCloseTo(0.130662, 3)
    expect(wacc(0.6, 0.1, 0.4, 0.05, 0.25)).toBeCloseTo(0.075, 8)
    expect(mmCostOfEquity(0.1, 0.06, 0.5)).toBeCloseTo(0.12, 8)
  })

  it('prices forwards, parity, and a one-step binomial', () => {
    expect(forwardPrice(50, 0.04, 0.5)).toBeCloseTo(50 * Math.sqrt(1.04), 6)
    expect(putCallParityCall(3, 50, 50, 0.05, 1)).toBeCloseTo(3 + 50 - 50 / 1.05, 6)
    const tree = onePeriodBinomial(80, 1.25, 0.8, 0.05, 80, 'call')
    expect(tree.riskNeutralProbability).toBeCloseTo(0.25 / 0.45, 8)
    expect(tree.price).toBeCloseTo((tree.riskNeutralProbability * 20) / 1.05, 6)
    expect(tree.hedgeRatio).toBeCloseTo(20 / 36, 6)
  })

  it('handles EPS, inventory, margin, FX, fees, and a two-stage dividend model', () => {
    expect(basicEps(1_250_000, 50_000, 400_000)).toBeCloseTo(3, 8)
    expect(treasuryIncrementalShares(20_000, 30, 40)).toBeCloseTo(5_000, 6)
    const converted = convertibleDiluted(1000, 500, 70, 200)
    expect(converted.dilutive).toBe(true)
    expect(converted.reported).toBeCloseTo(1070 / 700, 6)
    expect(inventoryFlows([{ units: 10, cost: 5 }, { units: 10, cost: 8 }], 10, 'fifo').cogs).toBe(50)
    expect(inventoryFlows([{ units: 10, cost: 5 }, { units: 10, cost: 8 }], 10, 'lifo').cogs).toBe(80)
    expect(dupontThree(0.08, 1.25, 2)).toBeCloseTo(0.2, 8)
    expect(dupontFive(0.8, 0.75, 0.2, 1.25, 2)).toBeCloseTo(0.3, 8)
    expect(marginCallPriceLong(40, 0.5, 0.25)).toBeCloseTo(26.666666, 4)
    expect(cipForward(1.1, 0.05, 0.02)).toBeCloseTo(1.1 * 1.05 / 1.02, 8)
    const fees = hedgeFundEnd({
      begin: 200,
      endBeforeFees: 230,
      managementRate: 0.02,
      managementBase: 'begin',
      incentiveRate: 0.2,
    })
    expect(fees.netEnd).toBeCloseTo(220.8, 6)
    expect(fees.netReturn).toBeCloseTo(0.104, 6)
    const staged = twoStagePrice([1, 1.2], 0.08, 0.03)
    const terminal = (1.2 * 1.03) / 0.05
    expect(staged).toBeCloseTo(1 / 1.08 + (1.2 + terminal) / 1.08 ** 2, 6)
  })
})
