/** Pure calculators shared by the question generator and unit tests. */

export function hpr(startPrice: number, endPrice: number, income = 0): number {
  return (endPrice - startPrice + income) / startPrice
}

export function twr(subperiodReturns: number[]): number {
  return subperiodReturns.reduce((acc, r) => acc * (1 + r), 1) - 1
}

export function annualize(holdingReturn: number, years: number): number {
  if (years <= 0) throw new Error('years must be positive')
  return (1 + holdingReturn) ** (1 / years) - 1
}

export function ear(nominalAnnual: number, compoundingPeriods: number): number {
  return (1 + nominalAnnual / compoundingPeriods) ** compoundingPeriods - 1
}

export function continuousFromEffective(effective: number): number {
  return Math.log(1 + effective)
}

export function effectiveFromContinuous(continuous: number): number {
  return Math.exp(continuous) - 1
}

export function pv(futureValue: number, rate: number, periods: number): number {
  return futureValue / (1 + rate) ** periods
}

export function fv(presentValue: number, rate: number, periods: number): number {
  return presentValue * (1 + rate) ** periods
}

export function annuityPv(payment: number, rate: number, periods: number): number {
  if (rate === 0) return payment * periods
  return (payment * (1 - (1 + rate) ** -periods)) / rate
}

export function gordon(d0: number, requiredReturn: number, growth: number): { d1: number; price: number } {
  if (growth >= requiredReturn) throw new Error('growth must be below the required return')
  const d1 = d0 * (1 + growth)
  return { d1, price: d1 / (requiredReturn - growth) }
}

export function justifiedLeadingPe(payout: number, requiredReturn: number, growth: number): number {
  if (growth >= requiredReturn) throw new Error('growth must be below the required return')
  return payout / (requiredReturn - growth)
}

export function justifiedTrailingPe(payout: number, requiredReturn: number, growth: number): number {
  if (growth >= requiredReturn) throw new Error('growth must be below the required return')
  return (payout * (1 + growth)) / (requiredReturn - growth)
}

export function twoStagePrice(
  dividends: number[],
  requiredReturn: number,
  stableGrowth: number,
): number {
  if (dividends.length === 0) throw new Error('need at least one dividend')
  if (stableGrowth >= requiredReturn) throw new Error('stable growth must be below the required return')
  const last = dividends[dividends.length - 1]
  const terminal = (last * (1 + stableGrowth)) / (requiredReturn - stableGrowth)
  return dividends.reduce((sum, dividend, index) => {
    const t = index + 1
    const cash = t === dividends.length ? dividend + terminal : dividend
    return sum + cash / (1 + requiredReturn) ** t
  }, 0)
}

export function bondPrice(
  face: number,
  annualCouponRate: number,
  annualYield: number,
  years: number,
  frequency = 1,
): number {
  const periods = Math.round(years * frequency)
  const coupon = (face * annualCouponRate) / frequency
  const periodRate = annualYield / frequency
  let price = 0
  for (let t = 1; t <= periods; t += 1) {
    price += coupon / (1 + periodRate) ** t
  }
  price += face / (1 + periodRate) ** periods
  return price
}

export function macaulayDuration(
  face: number,
  annualCouponRate: number,
  annualYield: number,
  years: number,
  frequency = 1,
): number {
  const periods = Math.round(years * frequency)
  const coupon = (face * annualCouponRate) / frequency
  const periodRate = annualYield / frequency
  const price = bondPrice(face, annualCouponRate, annualYield, years, frequency)
  let weighted = 0
  for (let t = 1; t <= periods; t += 1) {
    const cash = t === periods ? coupon + face : coupon
    const present = cash / (1 + periodRate) ** t
    weighted += (t / frequency) * present
  }
  return weighted / price
}

export function modifiedDuration(macaulayYears: number, annualYield: number, frequency = 1): number {
  return macaulayYears / (1 + annualYield / frequency)
}

export function approxModifiedDuration(
  priceDown: number,
  priceUp: number,
  price0: number,
  yieldShock: number,
): number {
  return (priceDown - priceUp) / (2 * price0 * yieldShock)
}

export function approxConvexity(
  priceDown: number,
  priceUp: number,
  price0: number,
  yieldShock: number,
): number {
  return (priceDown + priceUp - 2 * price0) / (price0 * yieldShock ** 2)
}

export function percentPriceChange(modifiedDur: number, annualConvexity: number, yieldChange: number): number {
  return -modifiedDur * yieldChange + 0.5 * annualConvexity * yieldChange ** 2
}

export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((sum, cash, t) => sum + cash / (1 + rate) ** t, 0)
}

export function irr(cashflows: number[]): number {
  let rate = 0.1
  for (let i = 0; i < 60; i += 1) {
    let value = 0
    let derivative = 0
    for (let t = 0; t < cashflows.length; t += 1) {
      value += cashflows[t] / (1 + rate) ** t
      if (t > 0) derivative -= (t * cashflows[t]) / (1 + rate) ** (t + 1)
    }
    if (Math.abs(derivative) < 1e-14) break
    const next = rate - value / derivative
    if (!Number.isFinite(next)) break
    if (Math.abs(next - rate) < 1e-12) return next
    rate = next
  }
  if (Math.abs(npv(rate, cashflows)) > 1e-6) throw new Error('IRR did not converge')
  return rate
}

export function wacc(
  equityWeight: number,
  costOfEquity: number,
  debtWeight: number,
  costOfDebt: number,
  taxRate: number,
): number {
  return equityWeight * costOfEquity + debtWeight * costOfDebt * (1 - taxRate)
}

export function mmCostOfEquity(unleveredCost: number, costOfDebt: number, debtToEquity: number, taxRate = 0): number {
  return unleveredCost + (unleveredCost - costOfDebt) * debtToEquity * (1 - taxRate)
}

export function portfolioVariance(
  weight1: number,
  sigma1: number,
  weight2: number,
  sigma2: number,
  correlation: number,
): number {
  return (
    weight1 ** 2 * sigma1 ** 2 +
    weight2 ** 2 * sigma2 ** 2 +
    2 * weight1 * weight2 * sigma1 * sigma2 * correlation
  )
}

export function portfolioReturn(weights: number[], returns: number[]): number {
  return weights.reduce((sum, weight, i) => sum + weight * returns[i], 0)
}

export function utilityMeanVariance(expectedReturn: number, riskAversion: number, variance: number): number {
  return expectedReturn - 0.5 * riskAversion * variance
}

export function optimalRiskyWeight(
  riskyExpectedReturn: number,
  riskFree: number,
  riskAversion: number,
  riskySigma: number,
): number {
  return (riskyExpectedReturn - riskFree) / (riskAversion * riskySigma ** 2)
}

export function capm(riskFree: number, beta: number, marketReturn: number): number {
  return riskFree + beta * (marketReturn - riskFree)
}

export function betaFromCorrelation(correlation: number, sigmaAsset: number, sigmaMarket: number): number {
  return (correlation * sigmaAsset) / sigmaMarket
}

export function sharpe(portfolioReturnValue: number, riskFree: number, sigma: number): number {
  return (portfolioReturnValue - riskFree) / sigma
}

export function treynor(portfolioReturnValue: number, riskFree: number, beta: number): number {
  return (portfolioReturnValue - riskFree) / beta
}

export function jensenAlpha(
  portfolioReturnValue: number,
  riskFree: number,
  beta: number,
  marketReturn: number,
): number {
  return portfolioReturnValue - capm(riskFree, beta, marketReturn)
}

export function mSquared(
  portfolioReturnValue: number,
  riskFree: number,
  sigmaPortfolio: number,
  sigmaMarket: number,
): number {
  return riskFree + sharpe(portfolioReturnValue, riskFree, sigmaPortfolio) * sigmaMarket
}

export function safetyFirst(expectedReturn: number, threshold: number, sigma: number): number {
  return (expectedReturn - threshold) / sigma
}

export function standardError(sampleSigma: number, n: number): number {
  return sampleSigma / Math.sqrt(n)
}

export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function sampleVariance(values: number[]): number {
  if (values.length < 2) throw new Error('sample variance needs at least two observations')
  const average = mean(values)
  const sumSquares = values.reduce((sum, value) => sum + (value - average) ** 2, 0)
  return sumSquares / (values.length - 1)
}

export function populationVariance(values: number[]): number {
  const average = mean(values)
  const sumSquares = values.reduce((sum, value) => sum + (value - average) ** 2, 0)
  return sumSquares / values.length
}

export function correlationT(correlation: number, n: number): number {
  return (correlation * Math.sqrt(n - 2)) / Math.sqrt(1 - correlation ** 2)
}

export function bayes(prior: number, likelihood: number, marginal: number): number {
  return (prior * likelihood) / marginal
}

export function forwardPrice(spot: number, rate: number, years: number, pvBenefits = 0, pvCosts = 0): number {
  return (spot - pvBenefits + pvCosts) * (1 + rate) ** years
}

export function forwardValue(spotNow: number, contractedForward: number, rate: number, yearsLeft: number): number {
  return spotNow - contractedForward / (1 + rate) ** yearsLeft
}

export function callExercise(spot: number, strike: number): number {
  return Math.max(spot - strike, 0)
}

export function putExercise(spot: number, strike: number): number {
  return Math.max(strike - spot, 0)
}

export function putCallParityCall(put: number, spot: number, strike: number, rate: number, years: number): number {
  return put + spot - strike / (1 + rate) ** years
}

export type BinomialResult = {
  price: number
  hedgeRatio: number
  riskNeutralProbability: number
  upPayoff: number
  downPayoff: number
}

export function onePeriodBinomial(
  spot: number,
  upMultiplier: number,
  downMultiplier: number,
  periodRate: number,
  strike: number,
  kind: 'call' | 'put',
): BinomialResult {
  if (upMultiplier <= downMultiplier) throw new Error('up multiplier must exceed down multiplier')
  const upSpot = spot * upMultiplier
  const downSpot = spot * downMultiplier
  const payoff = kind === 'call' ? callExercise : putExercise
  const upPayoff = payoff(upSpot, strike)
  const downPayoff = payoff(downSpot, strike)
  const riskNeutralProbability = (1 + periodRate - downMultiplier) / (upMultiplier - downMultiplier)
  const price = (riskNeutralProbability * upPayoff + (1 - riskNeutralProbability) * downPayoff) / (1 + periodRate)
  const hedgeRatio = (upPayoff - downPayoff) / (upSpot - downSpot)
  return { price, hedgeRatio, riskNeutralProbability, upPayoff, downPayoff }
}

export function basicEps(netIncome: number, preferredDividends: number, weightedShares: number): number {
  return (netIncome - preferredDividends) / weightedShares
}

export function treasuryIncrementalShares(optionShares: number, strike: number, marketPrice: number): number {
  if (strike >= marketPrice) return 0
  const repurchased = (optionShares * strike) / marketPrice
  return optionShares - repurchased
}

export function convertibleDiluted(
  netIncome: number,
  weightedShares: number,
  afterTaxInterest: number,
  newShares: number,
): { basic: number; dilutedIfConverted: number; dilutive: boolean; reported: number } {
  const basic = netIncome / weightedShares
  const dilutedIfConverted = (netIncome + afterTaxInterest) / (weightedShares + newShares)
  const dilutive = dilutedIfConverted < basic - 1e-9
  return { basic, dilutedIfConverted, dilutive, reported: dilutive ? dilutedIfConverted : basic }
}

export function dupontThree(netMargin: number, assetTurnover: number, equityMultiplier: number): number {
  return netMargin * assetTurnover * equityMultiplier
}

export function dupontFive(
  taxBurden: number,
  interestBurden: number,
  ebitMargin: number,
  assetTurnover: number,
  leverage: number,
): number {
  return taxBurden * interestBurden * ebitMargin * assetTurnover * leverage
}

export function cashConversionCycle(daysInventory: number, daysReceivable: number, daysPayable: number): number {
  return daysInventory + daysReceivable - daysPayable
}

export function dayCount(balance: number, flow: number, days = 365): number {
  return (balance / flow) * days
}

export function fcff(cfo: number, interest: number, taxRate: number, fixedCapitalInvestment: number): number {
  return cfo + interest * (1 - taxRate) - fixedCapitalInvestment
}

export function fcfe(cfo: number, fixedCapitalInvestment: number, netBorrowing: number): number {
  return cfo - fixedCapitalInvestment + netBorrowing
}

export type InventoryLayer = { units: number; cost: number }

export function inventoryFlows(
  layers: InventoryLayer[],
  unitsSold: number,
  method: 'fifo' | 'lifo' | 'average',
): { cogs: number; ending: number } {
  const totalUnits = layers.reduce((sum, layer) => sum + layer.units, 0)
  const totalCost = layers.reduce((sum, layer) => sum + layer.units * layer.cost, 0)
  if (unitsSold > totalUnits) throw new Error('units sold exceed units available')
  if (method === 'average') {
    const average = totalCost / totalUnits
    const cogs = average * unitsSold
    return { cogs, ending: totalCost - cogs }
  }
  const ordered = method === 'fifo' ? layers : [...layers].reverse()
  let remaining = unitsSold
  let cogs = 0
  for (const layer of ordered) {
    const take = Math.min(layer.units, remaining)
    cogs += take * layer.cost
    remaining -= take
  }
  return { cogs, ending: totalCost - cogs }
}

export function marginCallPriceLong(
  initialPrice: number,
  initialMargin: number,
  maintenanceMargin: number,
): number {
  return (initialPrice * (1 - initialMargin)) / (1 - maintenanceMargin)
}

export function marginCallPriceShort(
  initialPrice: number,
  initialMargin: number,
  maintenanceMargin: number,
): number {
  return (initialPrice * (1 + initialMargin)) / (1 + maintenanceMargin)
}

export function leveragedLongReturn(
  initialPrice: number,
  endPrice: number,
  initialMargin: number,
  dividendPerShare = 0,
): number {
  const equity = initialPrice * initialMargin
  const loan = initialPrice - equity
  const endEquity = endPrice - loan + dividendPerShare
  return (endEquity - equity) / equity
}

export function oneYearForwardRate(spot1: number, spot2: number): number {
  return (1 + spot2) ** 2 / (1 + spot1) - 1
}

export function parRateTwoYear(spot1: number, spot2: number): number {
  const pvFace = 100 / (1 + spot2) ** 2
  const denominator = 1 / (1 + spot1) + 1 / (1 + spot2) ** 2
  return (100 - pvFace) / denominator / 100
}

export function cipForward(spotPricePerBase: number, priceCurrencyRate: number, baseCurrencyRate: number, years = 1): number {
  return spotPricePerBase * ((1 + priceCurrencyRate) / (1 + baseCurrencyRate)) ** years
}

export function hedgeFundEnd(input: {
  begin: number
  endBeforeFees: number
  managementRate: number
  managementBase: 'begin' | 'end'
  incentiveRate: number
  hurdleRate?: number
  hurdleStyle?: 'hard' | 'soft'
  highWaterMark?: number
}): { managementFee: number; incentiveFee: number; netEnd: number; netReturn: number } {
  const managementFee =
    input.managementBase === 'begin'
      ? input.begin * input.managementRate
      : input.endBeforeFees * input.managementRate
  const profitAfterFee = input.endBeforeFees - managementFee - input.begin
  let incentiveBase = Math.max(0, profitAfterFee)
  if (input.highWaterMark !== undefined) {
    incentiveBase = Math.max(0, input.endBeforeFees - managementFee - input.highWaterMark)
  } else if (input.hurdleRate !== undefined) {
    const hurdleProfit = input.begin * input.hurdleRate
    if ((input.hurdleStyle ?? 'soft') === 'hard') {
      incentiveBase = Math.max(0, profitAfterFee - hurdleProfit)
    } else {
      incentiveBase = profitAfterFee > hurdleProfit ? Math.max(0, profitAfterFee) : 0
    }
  }
  const incentiveFee = input.incentiveRate * incentiveBase
  const netEnd = input.endBeforeFees - managementFee - incentiveFee
  return {
    managementFee,
    incentiveFee,
    netEnd,
    netReturn: (netEnd - input.begin) / input.begin,
  }
}

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}
