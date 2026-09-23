import { pathToFileURL } from 'node:url'
import { exactly, finalizeTopic, numeric, q, type Draft } from '../author.ts'
import { block, inline, num, pct } from '../../src/lib/format.ts'
import * as math from '../../src/lib/formulas.ts'

type Difficulty = Draft['difficulty']

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
      'portfolio',
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

function part1(): Draft[] {
  const weights3 = [0.4, 0.35, 0.25]
  const returns3 = [0.1, 0.04, 0.12]
  const ret3 = math.portfolioReturn(weights3, returns3)
  const ret3Equal = math.portfolioReturn([1 / 3, 1 / 3, 1 / 3], returns3)
  const ret3Flipped = math.portfolioReturn([0.25, 0.35, 0.4], returns3)

  const ret2 = math.portfolioReturn([0.7, 0.3], [0.06, 0.16])
  const ret2Flipped = math.portfolioReturn([0.3, 0.7], [0.06, 0.16])
  const ret2Avg = math.portfolioReturn([0.5, 0.5], [0.06, 0.16])

  const sigHedge = Math.sqrt(math.portfolioVariance(0.5, 0.2, 0.5, 0.2, -0.5))
  const sigHedgeZero = Math.sqrt(math.portfolioVariance(0.5, 0.2, 0.5, 0.2, 0))
  const sigHedgeOne = Math.sqrt(math.portfolioVariance(0.5, 0.2, 0.5, 0.2, 1))

  const varMix = math.portfolioVariance(0.5, 0.2, 0.5, 0.3, 0.5)
  const sigMix = Math.sqrt(varMix)
  const sigMixZero = Math.sqrt(math.portfolioVariance(0.5, 0.2, 0.5, 0.3, 0))
  const sigAvg = 0.5 * 0.2 + 0.5 * 0.3
  const varZero = math.portfolioVariance(0.5, 0.2, 0.5, 0.3, 0)
  const varWeighted = 0.5 * 0.2 ** 2 + 0.5 * 0.3 ** 2

  const uCalm = math.utilityMeanVariance(0.1, 2, 0.2 ** 2)
  const uCalmNoHalf = 0.1 - 2 * 0.2 ** 2
  const uCalmSigma = math.utilityMeanVariance(0.1, 2, 0.2)

  const uSpicy = math.utilityMeanVariance(0.14, 4, 0.15 ** 2)
  const uSpicyNoHalf = 0.14 - 4 * 0.15 ** 2
  const uSpicySigma = math.utilityMeanVariance(0.14, 4, 0.15)

  const sf = math.safetyFirst(0.11, 0.04, 0.14)
  const sfNoFloor = math.safetyFirst(0.11, 0, 0.14)
  const sfVariance = (0.11 - 0.04) / 0.14 ** 2

  const numericItems: Draft[] = [
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part1',
      difficulty: 'easy',
      stem: 'A portfolio puts 40% in an asset with expected return 10%, 35% in an asset with expected return 4%, and 25% in an asset with expected return 12%. Portfolio expected return is the sum of weight times expected return. The portfolio expected return is closest to:',
      correct: ret3,
      wrong: [ret3Equal, ret3Flipped],
      format: pct,
      explain: (ans) =>
        `Each weight multiplies its own expected return: 0.40 × 10% plus 0.35 × 4% plus 0.25 × 12%. An equal-weight average and a reversal of the end weights are different portfolios. The expected return is ${ans}. ${inline(String.raw`E(R_p)=\sum_i w_i E(R_i)`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part1',
      difficulty: 'easy',
      stem: 'A two-asset portfolio places 70% in an asset with expected return 6% and 30% in an asset with expected return 16%. Expected return is the weighted average. The portfolio expected return is closest to:',
      correct: ret2,
      wrong: [ret2Flipped, ret2Avg],
      format: pct,
      explain: (ans) =>
        `The 6% asset gets the larger weight, so the result sits closer to 6% than to 16%. Swapping the weights or using a simple average both overstate the contribution of the higher-return asset. The expected return is ${ans}. ${inline(String.raw`0.70\times 0.06+0.30\times 0.16`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part1',
      difficulty: 'medium',
      stem: 'Two assets each have a standard deviation of 20% and a correlation of −0.50. The portfolio is split 50/50. Portfolio variance uses both variances and the covariance term. The portfolio standard deviation is closest to:',
      correct: sigHedge,
      wrong: [sigHedgeZero, sigHedgeOne],
      format: pct,
      explain: (ans) =>
        `The negative covariance pulls the portfolio standard deviation below both the zero-correlation case and the perfect-positive case. With equal weights and equal volatilities, correlation of +1 leaves standard deviation at 20%. The standard deviation is ${ans}. ${block(String.raw`\sigma_p=\sqrt{w_1^2\sigma_1^2+w_2^2\sigma_2^2+2w_1w_2\sigma_1\sigma_2\rho}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part1',
      difficulty: 'medium',
      stem: 'Asset 1 has standard deviation 20% and asset 2 has standard deviation 30%. The weights are 50/50 and the correlation is 0.50. Portfolio variance includes the weighted covariance. The portfolio standard deviation is closest to:',
      correct: sigMix,
      wrong: [sigMixZero, sigAvg],
      format: pct,
      explain: (ans) =>
        `Correlation of 0.50 keeps a positive covariance, so risk is higher than the zero-correlation mix and lower than the weighted average of the two standard deviations. That weighted average is the result only when correlation is +1. The standard deviation is ${ans}. ${inline(String.raw`\sigma_p=\sqrt{0.0475}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part1',
      difficulty: 'hard',
      stem: 'A 50/50 portfolio combines an asset with standard deviation 20% and an asset with standard deviation 30%. Correlation is 0.50. Report the portfolio variance, not the standard deviation. Variance is not the weighted average of the two variances. The variance is closest to:',
      correct: varMix,
      wrong: [varZero, varWeighted],
      format: (value) => num(value, 4),
      explain: (ans) =>
        `The covariance term is 2 × 0.50 × 0.50 × 0.20 × 0.30 × 0.50, which must be added to the two weighted variance terms. Dropping it, or averaging the variances by the portfolio weights alone, leaves out diversification. The variance is ${ans}. ${inline(String.raw`\sigma_p^2=w_1^2\sigma_1^2+w_2^2\sigma_2^2+2w_1w_2\mathrm{Cov}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part1',
      difficulty: 'medium',
      stem: 'An investor uses U = E(R) - 0.5 A sigma^2 with decimals. Expected return is 10%, risk aversion A is 2, and standard deviation is 20%. Utility is closest to:',
      correct: uCalm,
      wrong: [uCalmNoHalf, uCalmSigma],
      format: (value) => num(value, 4),
      explain: (ans) =>
        `Variance is 0.20 squared, which is 0.04, and the penalty is one-half times A times that variance. Dropping the one-half, or inserting standard deviation where variance belongs, changes the score. The utility is ${ans}. ${inline(String.raw`U=0.10-0.5\times 2\times 0.20^{2}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part1',
      difficulty: 'hard',
      stem: 'A second investor also uses U = E(R) - 0.5 A sigma^2 with decimals. Expected return is 14%, A is 4, and standard deviation is 15%. Utility is closest to:',
      correct: uSpicy,
      wrong: [uSpicyNoHalf, uSpicySigma],
      format: (value) => num(value, 4),
      explain: (ans) =>
        `The variance input is 0.15 squared. A larger A makes the variance penalty heavier than in a mild risk-aversion case, but the one-half and the squaring still belong in the expression. The utility is ${ans}. ${inline(String.raw`U=0.14-0.5\times 4\times 0.15^{2}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part1',
      difficulty: 'medium',
      stem: 'Roy’s safety-first ratio is (E(R) − threshold) / sigma, using decimals. A portfolio has expected return 11%, a shortfall threshold of 4%, and standard deviation 14%. The safety-first ratio is closest to:',
      correct: sf,
      wrong: [sfNoFloor, sfVariance],
      format: (value) => num(value, 2),
      explain: (ans) =>
        `The numerator is expected return minus the threshold the investor wants to stay above, not expected return alone. The denominator is standard deviation, not variance. The safety-first ratio is ${ans}. ${inline(String.raw`\dfrac{0.11-0.04}{0.14}=0.50`)}`,
    }),
  ]

  const sfLow = math.safetyFirst(0.09, 0.02, 0.12)
  const sfHigh = math.safetyFirst(0.14, 0.02, 0.22)

  const conceptual = concept('pm-part1', [
    {
      d: 'easy',
      stem: 'A candidate averages the two assets’ variances and calls that figure the portfolio variance. The correlation is 0.20 and both weights are positive. Which correction is most accurate?',
      correct: 'Portfolio expected return is a weighted average. Portfolio variance is not, unless the correlation is +1.',
      wrong: [
        'Portfolio variance is always the weighted average of the variances, for any correlation.',
        'Portfolio expected return depends on correlation in the same way variance does.',
      ],
      why: 'The cross term 2 w1 w2 Cov is the diversification piece. It drops out of a plain average of variances. Expected return has no covariance term at all.',
    },
    {
      d: 'easy',
      stem: 'A long-only two-asset portfolio keeps the same weights and the same two standard deviations. Only the correlation is revised downward. What happens to portfolio standard deviation?',
      correct: 'Portfolio standard deviation falls, because the covariance term becomes smaller.',
      wrong: [
        'Portfolio standard deviation rises, because lower correlation means each asset is riskier.',
        'Portfolio standard deviation is unchanged, because weights and standalone volatilities are unchanged.',
      ],
      why: 'For positive weights, the covariance enters portfolio variance with a positive sign in front of the correlation. A lower correlation is exactly a smaller contribution from that term.',
    },
    {
      d: 'medium',
      stem: 'Which statement best defines the efficient frontier of risky assets?',
      correct: 'It is the set of risky portfolios with the highest expected return for a given variance, which is the upper half of the minimum-variance frontier.',
      wrong: [
        'It is every portfolio that mixes the risk-free asset with a single stock.',
        'It is the set of portfolios with the lowest expected return for each level of variance.',
      ],
      why: 'The minimum-variance frontier is the full curve. Points below the global minimum-variance portfolio are dominated. Efficiency keeps the upper portion.',
    },
    {
      d: 'medium',
      stem: 'Which statement about the global minimum-variance portfolio of risky assets is most accurate?',
      correct: 'It has the lowest variance among risky portfolios. Portfolios with still lower expected return are inefficient.',
      wrong: [
        'It is defined as the portfolio that maximizes the Sharpe ratio.',
        'It always places the entire weight in the single asset with the lowest standard deviation.',
      ],
      why: 'The global minimum-variance portfolio is the leftmost point of the risky-asset frontier. The Sharpe-maximizing portfolio is the tangency portfolio, which is a different object unless the inputs happen to coincide.',
    },
    {
      d: 'medium',
      stem: 'Two investors share the same capital allocation line. One has a higher risk aversion A in U = E(R) - 0.5 A sigma^2 with decimals. Which description of the more risk-averse investor is most accurate?',
      correct: 'That investor has steeper indifference curves and picks a calmer complete portfolio, closer to the risk-free asset.',
      wrong: [
        'That investor has flatter indifference curves and borrows to hold more than 100% in the risky portfolio.',
        'Risk aversion changes the capital allocation line but not the investor’s preferred point on it.',
      ],
      why: 'A larger A increases the utility penalty on variance, so the tangency of the indifference curve with the allocation line occurs at a lower-risk mix. The line itself is built from the risk-free asset and the risky portfolio, before the investor’s tastes are applied.',
    },
    {
      d: 'easy',
      stem: 'An advisor draws a line from the risk-free asset through a portfolio of corporate bonds. The bond portfolio is not the market portfolio. What is that line?',
      correct: 'A capital allocation line, because any risky portfolio can be combined with the risk-free asset.',
      wrong: [
        'The capital market line, because every line that starts at the risk-free asset is the capital market line.',
        'The security market line, because the horizontal axis of this drawing is beta.',
      ],
      why: 'The capital allocation line is the menu of complete portfolios formed from the risk-free asset and one chosen risky portfolio. The capital market line is the special case in which that risky portfolio is the market.',
    },
    {
      d: 'easy',
      stem: 'A trustee asks when diversification inside a long-only portfolio helps most. Which answer is most accurate?',
      correct: 'The risk reduction is larger when the assets’ correlation is lower.',
      wrong: [
        'The risk reduction is larger when the correlation is closer to +1.',
        'Diversification changes expected return but cannot change portfolio standard deviation.',
      ],
      why: 'Low correlation means one asset’s bad outcome is less tied to the other’s. The portfolio variance formula records that benefit in the covariance term.',
    },
    {
      d: 'easy',
      stem: 'An analyst has the correlation between two assets and each asset’s standard deviation. Which identity produces the covariance?',
      correct: 'Covariance equals the correlation times the product of the two standard deviations.',
      wrong: [
        'Covariance equals the correlation divided by the sum of the two variances.',
        'Covariance equals the difference of the two standard deviations.',
      ],
      why: 'Correlation is covariance scaled by the two volatilities, so rearranging gives Cov = ρ σ1 σ2. That product is what enters the two-asset portfolio variance.',
    },
    {
      d: 'medium',
      stem: 'Two long-only assets have a correlation of +1. Which statement about the portfolio standard deviation is most accurate?',
      correct: 'It equals the weighted average of the two standard deviations, so the mix provides no diversification benefit.',
      wrong: [
        'It equals zero for an equal-weight portfolio.',
        'It is below the weighted average of the standard deviations by a covariance discount.',
      ],
      why: 'When ρ = 1 and weights are positive, the square root of portfolio variance simplifies to w1 σ1 + w2 σ2. The assets move together, so combining them only averages their risks.',
    },
    {
      d: 'hard',
      stem: 'Two risky assets have correlation of −1, and short sales are not required. Which risk result is available?',
      correct: 'One specific mix of the two long positions can drive portfolio variance to zero.',
      wrong: [
        'No mix can reduce variance below the lower of the two standalone variances.',
        'Variance is zero for every weight, because the correlation is negative.',
      ],
      why: 'Perfect negative correlation makes the risks offset at one pair of weights, related to the two standard deviations. Other weights leave residual risk. A correlation only slightly above −1 cannot reach that zero.',
    },
    {
      d: 'medium',
      stem: 'In the utility score U = E(R) - 0.5 A sigma^2 with decimals, an investor’s A rises and the portfolio’s expected return and variance stay the same. What happens to utility?',
      correct: 'Utility falls, because a larger A increases the penalty applied to variance.',
      wrong: [
        'Utility rises, because A multiplies expected return.',
        'Utility is unchanged, because A affects only the capital market line intercept.',
      ],
      why: 'A is the price of variance in this score. It does not add to expected return. Two investors can look at the same portfolio and assign it different utilities.',
    },
    {
      d: 'hard',
      stem: 'A spreadsheet computes U = E(R) - 0.5 A sigma^2 by entering expected return and standard deviation as percents, for example 8 and 15, rather than as decimals. Why do the instructions insist on decimals?',
      correct: 'The term 0.5 A multiplies variance. Percent inputs make variance a percent-squared number that is not on the same scale as expected return.',
      wrong: [
        'Decimals are required only so the utility score can be printed with a percent sign.',
        'The formula is undefined unless expected return is greater than 1.',
      ],
      why: 'Variance is the square of standard deviation. Squaring 15 is not the same operation, in economic scale, as squaring 0.15 and then subtracting from 0.08. Rankings across portfolios can change if the units are mixed.',
    },
    {
      d: 'medium',
      stem: 'A risky portfolio plots inside the minimum-variance frontier, with both higher variance and lower expected return than a portfolio on the frontier. Which conclusion is most accurate?',
      correct: 'The interior portfolio is dominated: an investor can find a frontier portfolio with a better risk and return tradeoff.',
      wrong: [
        'Interior portfolios are the only efficient portfolios, because they use more assets.',
        'Mean-variance investors prefer the interior portfolio because its correlation is undefined.',
      ],
      why: 'The frontier is the boundary of what the risky assets can do. A point inside it wastes either return or risk relative to a point on the boundary.',
    },
    {
      d: 'hard',
      stem: `Two portfolios are judged only by Roy’s safety-first ratio against a 2% threshold. Portfolio L has expected return 9% and standard deviation 12%, so its ratio is ${num(sfLow, 2)}. Portfolio H has expected return 14% and standard deviation 22%, so its ratio is ${num(sfHigh, 2)}. The investor wants the lower chance of falling short, under the usual normal-distribution reading of the ratio. Which choice follows?`,
      correct: 'Portfolio L, because the higher safety-first ratio is the preferred shortfall protection.',
      wrong: [
        'Portfolio H, because the higher expected return always produces the higher safety-first ratio.',
        'The two portfolios are equivalent because both thresholds equal 2%.',
      ],
      why: 'Safety-first divides the gap between expected return and the threshold by standard deviation. Portfolio H’s extra return does not fully pay for its extra volatility, so its ratio is lower.',
    },
  ])

  return [...numericItems, ...conceptual]
}

function part2(): Draft[] {
  const yBorrow = math.optimalRiskyWeight(0.08, 0.02, 4, 0.1)
  const yBorrowSigma = (0.08 - 0.02) / (4 * 0.1)
  const yBorrowNoA = (0.08 - 0.02) / 0.1 ** 2

  const ySmall = math.optimalRiskyWeight(0.07, 0.03, 5, 0.2)
  const ySmallSigma = (0.07 - 0.03) / (5 * 0.2)
  const ySmallNoA = (0.07 - 0.03) / 0.2 ** 2

  const yFull = math.optimalRiskyWeight(0.12, 0.04, 2, 0.2)
  const yFullSigma = (0.12 - 0.04) / (2 * 0.2)
  const yFullNoA = (0.12 - 0.04) / 0.2 ** 2

  const capmHigh = math.capm(0.03, 1.2, 0.08)
  const capmBetaOne = math.capm(0.03, 1, 0.08)
  const capmNoRf = 1.2 * (0.08 - 0.03)

  const capmLow = math.capm(0.02, 0.5, 0.1)
  const capmMarket = math.capm(0.02, 1, 0.1)
  const capmTimesRm = 0.5 * 0.1

  const capmZero = math.capm(0.04, 0, 0.09)
  const capmAvg = (0.04 + 0.09) / 2

  const beta = math.betaFromCorrelation(0.5, 0.24, 0.16)
  const betaNoCorr = math.betaFromCorrelation(1, 0.24, 0.16)
  const betaFlip = math.betaFromCorrelation(0.5, 0.16, 0.24)

  const betaUnit = math.betaFromCorrelation(0.8, 0.25, 0.2)
  const betaUnitNoCorr = math.betaFromCorrelation(1, 0.25, 0.2)
  const betaUnitFlip = math.betaFromCorrelation(0.8, 0.2, 0.25)

  const sharpeRatio = math.sharpe(0.13, 0.04, 0.18)
  const sharpeNoRf = math.sharpe(0.13, 0, 0.18)
  const sharpeVar = (0.13 - 0.04) / 0.18 ** 2

  const treynorRatio = math.treynor(0.12, 0.03, 0.75)
  const treynorNoRf = math.treynor(0.12, 0, 0.75)
  const treynorAsSharpe = math.sharpe(0.12, 0.03, 0.15)

  const treynorLow = math.treynor(0.09, 0.02, 1.4)
  const treynorLowNoRf = math.treynor(0.09, 0, 1.4)
  const treynorLowSharpe = math.sharpe(0.09, 0.02, 0.2)

  const alphaPos = math.jensenAlpha(0.11, 0.03, 1.25, 0.07)
  const alphaVsMarket = 0.11 - 0.07
  const alphaWrongPremium = 0.11 - (0.03 + 1.25 * 0.07)

  const alphaNeg = math.jensenAlpha(0.06, 0.02, 0.9, 0.1)
  const alphaNegVsMarket = 0.06 - 0.1
  const alphaNegFlip = -alphaNeg

  const m2High = math.mSquared(0.14, 0.04, 0.2, 0.16)
  const m2HighRaw = 0.14
  const m2HighFlip = 0.04 + ((0.14 - 0.04) / 0.16) * 0.2

  const m2Low = math.mSquared(0.09, 0.03, 0.12, 0.15)
  const m2LowRaw = 0.09
  const m2LowFlip = 0.03 + ((0.09 - 0.03) / 0.15) * 0.12

  const cmlBeta = math.betaFromCorrelation(1, 0.24, 0.16)
  const cmlReturn = math.capm(0.02, cmlBeta, 0.1)
  const cmlMarket = 0.1
  const cmlWrong = 0.02 + cmlBeta * 0.1

  const weightFormula =
    'The investor uses U = E(R) - 0.5 A sigma^2 with decimals. The complete-portfolio weight in the risky portfolio that maximizes that utility is (E(R_p) - R_f) / (A sigma_p^2).'

  const numericItems: Draft[] = [
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'hard',
      stem: `${weightFormula} The risky portfolio has expected return 8%, the risk-free rate is 2%, A is 4, and the risky standard deviation is 10%. The weight in the risky portfolio is closest to:`,
      correct: yBorrow,
      wrong: [yBorrowSigma, yBorrowNoA],
      format: pct,
      explain: (ans) =>
        `The excess return is 6 percentage points and the variance is 0.10 squared. Dividing by A times that variance gives a weight above 100%, which means borrowing at the risk-free rate. Using standard deviation in place of variance, or dropping A, misses the utility maximum. The weight is ${ans}. ${inline(String.raw`y^{*}=\dfrac{0.08-0.02}{4\times 0.10^{2}}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'medium',
      stem: `${weightFormula} The risky portfolio has expected return 7%, the risk-free rate is 3%, A is 5, and the risky standard deviation is 20%. The weight in the risky portfolio is closest to:`,
      correct: ySmall,
      wrong: [ySmallSigma, ySmallNoA],
      format: pct,
      explain: (ans) =>
        `A high risk aversion and a 20% volatility keep the optimal weight well below 100%, so the rest of the complete portfolio is lent at the risk-free rate. Replacing variance with standard deviation understates the weight, and omitting A overstates it. The weight is ${ans}. ${inline(String.raw`y^{*}=\dfrac{0.07-0.03}{5\times 0.20^{2}}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'medium',
      stem: `${weightFormula} The risky portfolio has expected return 12%, the risk-free rate is 4%, A is 2, and the risky standard deviation is 20%. The weight in the risky portfolio is closest to:`,
      correct: yFull,
      wrong: [yFullSigma, yFullNoA],
      format: pct,
      explain: (ans) =>
        `The utility-maximizing weight lands on 100% risky, so this investor neither borrows nor lends. That is a knife-edge result of these inputs, not a rule that every investor holds the risky portfolio alone. The weight is ${ans}. ${inline(String.raw`y^{*}=\dfrac{0.12-0.04}{2\times 0.20^{2}}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'easy',
      stem: 'Under the CAPM, expected return equals the risk-free rate plus beta times the market risk premium. The risk-free rate is 3%, beta is 1.20, and the market return is 8%. The required return is closest to:',
      correct: capmHigh,
      wrong: [capmBetaOne, capmNoRf],
      format: pct,
      explain: (ans) =>
        `The premium is 8% minus 3%, which is 5%, and 1.20 times that premium is added to the risk-free rate. Using a beta of 1, or reporting only the beta times the premium, drops a piece of the model. The required return is ${ans}. ${inline(String.raw`0.03+1.20\times(0.08-0.03)`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'easy',
      stem: 'The CAPM required return uses the risk-free rate plus beta times the market excess return. The risk-free rate is 2%, beta is 0.50, and the market return is 10%. The required return is closest to:',
      correct: capmLow,
      wrong: [capmMarket, capmTimesRm],
      format: pct,
      explain: (ans) =>
        `Half of the 8% market premium is 4%, and adding the 2% risk-free rate produces the requirement. The market return itself would be the answer only for a beta of 1. Multiplying beta by the market return skips the excess-return construction. The required return is ${ans}. ${inline(String.raw`0.02+0.50\times(0.10-0.02)`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'easy',
      stem: 'A security has a beta of zero. The risk-free rate is 4% and the market return is 9%. The CAPM required return is the risk-free rate plus beta times the market premium. The required return is closest to:',
      correct: capmZero,
      wrong: [0.09, capmAvg],
      format: pct,
      explain: (ans) =>
        `A zero beta multiplies the market premium by zero, so the model requires only the risk-free rate. The market return and the average of the two rates both invent compensation this security’s systematic risk does not earn. The required return is ${ans}. ${inline(String.raw`0.04+0\times(0.09-0.04)`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'medium',
      stem: 'Beta equals the correlation with the market times the asset’s standard deviation, divided by the market’s standard deviation. The correlation is 0.50, the asset’s standard deviation is 24%, and the market’s standard deviation is 16%. Beta is closest to:',
      correct: beta,
      wrong: [betaNoCorr, betaFlip],
      format: (value) => num(value, 2),
      explain: (ans) =>
        `The volatility ratio is 24/16, which is 1.50, and the correlation scales it to 0.75. Dropping the correlation treats the asset as perfectly tied to the market. Swapping the two standard deviations inverts the ratio. Beta is ${ans}. ${inline(String.raw`\beta=\dfrac{0.50\times 0.24}{0.16}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'hard',
      stem: 'An asset is more volatile than the market, but it is not perfectly correlated with the market. Correlation is 0.80, asset standard deviation is 25%, and market standard deviation is 20%. Beta equals correlation times asset volatility divided by market volatility. Beta is closest to:',
      correct: betaUnit,
      wrong: [betaUnitNoCorr, betaUnitFlip],
      format: (value) => num(value, 2),
      explain: (ans) =>
        `The asset’s extra volatility is offset by a correlation of 0.80, so beta can still be 1. Using correlation of 1 would overstate beta, and putting market volatility in the numerator understates it. Beta is ${ans}. ${inline(String.raw`\beta=\dfrac{0.80\times 0.25}{0.20}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'easy',
      stem: 'The Sharpe ratio is (portfolio return − risk-free rate) / portfolio standard deviation. A portfolio returned 13%, the risk-free rate was 4%, and the portfolio standard deviation was 18%. The Sharpe ratio is closest to:',
      correct: sharpeRatio,
      wrong: [sharpeNoRf, sharpeVar],
      format: (value) => num(value, 2),
      explain: (ans) =>
        `Excess return is 9 percentage points, divided by total risk of 18%. Leaving the risk-free rate out of the numerator, or dividing by variance, does not produce the Sharpe ratio. The Sharpe ratio is ${ans}. ${inline(String.raw`\dfrac{0.13-0.04}{0.18}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'medium',
      stem: 'The Treynor ratio is (portfolio return − risk-free rate) / beta. A portfolio returned 12% with a beta of 0.75 and a standard deviation of 15%. The risk-free rate was 3%. The Treynor ratio is closest to:',
      correct: treynorRatio,
      wrong: [treynorNoRf, treynorAsSharpe],
      format: pct,
      explain: (ans) =>
        `Excess return of 9% is divided by beta, not by the 15% standard deviation. The standard deviation would be the Sharpe denominator. Dropping the risk-free rate overstates the numerator. The Treynor ratio is ${ans}. ${inline(String.raw`\dfrac{0.12-0.03}{0.75}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'medium',
      stem: 'Another portfolio returned 9% with a beta of 1.40 and a standard deviation of 20%. The risk-free rate was 2%. The Treynor ratio divides excess return by beta. The Treynor ratio is closest to:',
      correct: treynorLow,
      wrong: [treynorLowNoRf, treynorLowSharpe],
      format: pct,
      explain: (ans) =>
        `The 7% excess return divided by 1.40 is the Treynor ratio. Dividing the raw return by beta, or dividing the excess return by the 20% standard deviation, answers a different question. The Treynor ratio is ${ans}. ${inline(String.raw`\dfrac{0.09-0.02}{1.40}`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'medium',
      stem: 'Jensen’s alpha is the portfolio return minus the CAPM required return, and the CAPM uses beta. The portfolio returned 11%, the risk-free rate was 3%, beta was 1.25, and the market return was 7%. Alpha is closest to:',
      correct: alphaPos,
      wrong: [alphaVsMarket, alphaWrongPremium],
      format: pct,
      explain: (ans) =>
        `The CAPM requirement is 3% plus 1.25 times the 4% market premium, which is 8%. Alpha is 11% minus 8%. Subtracting the market return instead, or multiplying beta by the market return rather than the premium, is not Jensen’s alpha. Alpha is ${ans}. ${inline(String.raw`0.11-\left[0.03+1.25\times(0.07-0.03)\right]`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'hard',
      stem: 'A portfolio returned 6% with a beta of 0.90. The risk-free rate was 2% and the market return was 10%. Jensen’s alpha subtracts the CAPM required return from the portfolio return. Alpha is closest to:',
      correct: alphaNeg,
      wrong: [alphaNegVsMarket, alphaNegFlip],
      format: pct,
      explain: (ans) =>
        `The CAPM line requires 2% plus 0.90 times 8%, which is 9.2%. The portfolio’s 6% result is below that line, so alpha is negative. The gap versus the raw market return is a different subtraction, and the positive mirror image flips the sign. Alpha is ${ans}. ${inline(String.raw`0.06-\left[0.02+0.90\times(0.10-0.02)\right]`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'hard',
      stem: 'M-squared equals the risk-free rate plus the portfolio Sharpe ratio times the market standard deviation. A portfolio returned 14% with standard deviation 20%. The risk-free rate was 4% and the market standard deviation was 16%. M-squared is closest to:',
      correct: m2High,
      wrong: [m2HighRaw, m2HighFlip],
      format: pct,
      explain: (ans) =>
        `The Sharpe ratio is 10% excess return divided by 20% volatility, which is 0.50. Scaling that Sharpe by the market’s 16% volatility and adding the risk-free rate puts the result in return units. Reporting the raw portfolio return, or swapping the two volatilities inside the scaling, misses the definition. M-squared is ${ans}. ${inline(String.raw`0.04+\dfrac{0.14-0.04}{0.20}\times 0.16`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'hard',
      stem: 'A quieter portfolio returned 9% with standard deviation 12%. The risk-free rate was 3% and the market standard deviation was 15%. M-squared is the risk-free rate plus the portfolio’s Sharpe ratio times the market standard deviation. M-squared is closest to:',
      correct: m2Low,
      wrong: [m2LowRaw, m2LowFlip],
      format: pct,
      explain: (ans) =>
        `Excess return of 6% over volatility of 12% is a Sharpe ratio of 0.50. Applying that ratio to the market’s volatility, then adding the risk-free rate, is M-squared. The unadjusted portfolio return and the ratio that flips the two standard deviations are not. M-squared is ${ans}. ${inline(String.raw`0.03+\dfrac{0.09-0.03}{0.12}\times 0.15`)}`,
    }),
    numeric({
      topicId: 'portfolio',
      losId: 'pm-part2',
      difficulty: 'hard',
      stem: 'A fully diversified portfolio lies on the capital market line. Its standard deviation is 24%, the market standard deviation is 16%, the risk-free rate is 2%, and the market return is 10%. Because the portfolio is fully diversified, its correlation with the market is 1 and its beta is correlation times its volatility divided by market volatility. The CAPM expected return is closest to:',
      correct: cmlReturn,
      wrong: [cmlMarket, cmlWrong],
      format: pct,
      explain: (ans) =>
        `Beta is 24/16, which is 1.50, and the required return is 2% plus 1.50 times the 8% market premium. That is the same point the capital market line assigns to a portfolio with this total risk. Using the market return unchanged, or multiplying beta by the market return instead of the premium, leaves the line. The expected return is ${ans}. ${block(String.raw`E(R)=R_f+\beta\left[E(R_m)-R_f\right]`)}`,
    }),
  ]

  const sharpeA = math.sharpe(0.14, 0.03, 0.2)
  const sharpeB = math.sharpe(0.12, 0.03, 0.12)
  const treynorA = math.treynor(0.14, 0.03, 0.8)
  const treynorB = math.treynor(0.12, 0.03, 1.1)

  const conceptual = concept('pm-part2', [
    {
      d: 'easy',
      stem: 'Which statement distinguishes the capital allocation line from the capital market line?',
      correct: 'The capital allocation line pairs the risk-free asset with any risky portfolio. The capital market line is that line when the risky portfolio is the market portfolio.',
      wrong: [
        'The capital market line pairs the risk-free asset with any risky portfolio, and the capital allocation line exists only for the market.',
        'Both lines plot expected return against beta, and they differ only by the intercept.',
      ],
      why: 'The allocation line is a general construction. It becomes the capital market line only in the CAPM case where every investor mixes the risk-free asset with the market portfolio of risky assets.',
    },
    {
      d: 'easy',
      stem: 'Under the CAPM, which risk is compensated with a higher expected return?',
      correct: 'Only systematic risk is compensated, because idiosyncratic risk can be diversified away in the market portfolio.',
      wrong: [
        'Only idiosyncratic risk is compensated, because systematic risk is removed by the risk-free asset.',
        'Total standalone variance is compensated, whether or not it is correlated with the market.',
      ],
      why: 'Investors can hold the market and shed asset-specific noise. The security market line therefore prices beta, not the part of volatility that diversification removes.',
    },
    {
      d: 'medium',
      stem: 'A security’s forecast return plots above the security market line. Which interpretation is most accurate?',
      correct: 'The security has a positive alpha and is cheap versus the CAPM: the forecast return is higher than the return the model requires for its beta.',
      wrong: [
        'The security has a negative alpha and is expensive versus the model.',
        'The security has zero beta, because only mispriced securities plot off the horizontal axis.',
      ],
      why: 'The security market line is the CAPM required return at each beta. A plot above that line means expected reward exceeds the requirement, which is a positive alpha and an undervalued price relative to the model.',
    },
    {
      d: 'medium',
      stem: 'A security’s forecast return plots below the security market line. Which interpretation is most accurate?',
      correct: 'The security has a negative alpha and is expensive versus the CAPM, because its forecast return does not pay for its beta.',
      wrong: [
        'The security has a positive alpha and should be overweighted as a bargain.',
        'The security must have a negative beta, because bargains are the only securities allowed below the line.',
      ],
      why: 'Below the line, the forecast fails the CAPM hurdle. The sign of alpha is negative. Beta can still be positive; the vertical gap is about mispricing relative to the model, not about the sign of beta.',
    },
    {
      d: 'easy',
      stem: 'An individual will place all risky wealth in one portfolio and will not hold other risky assets beside it. Which risk-adjusted measure fits that choice?',
      correct: 'The Sharpe ratio, because it uses total risk and suits a portfolio that is the investor’s entire risky wealth.',
      wrong: [
        'The Treynor ratio, because total risk does not matter when the portfolio is held alone.',
        'Jensen’s alpha, because beta already contains the portfolio’s idiosyncratic volatility.',
      ],
      why: 'If this portfolio is the whole risky allocation, undiversified volatility is a risk the investor actually bears. Sharpe charges for that total volatility. Treynor and Jensen look through beta only.',
    },
    {
      d: 'medium',
      stem: 'A pension already holds a diversified market-like portfolio and is judging a well-diversified equity sleeve that will be added beside it. Which measures match the risk that remains?',
      correct: 'The Treynor ratio and Jensen’s alpha, because both use beta rather than the sleeve’s standalone total risk.',
      wrong: [
        'The sleeve’s Sharpe ratio alone, because the sleeve’s total volatility is the pension’s total volatility.',
        'The cap rate on the sleeve, because beta is an accounting residual.',
      ],
      why: 'Inside a diversified whole, asset-specific risk is largely offset elsewhere. Beta is the piece that still moves with the market. Sharpe remains the right summary for the pension’s complete portfolio, not a substitute for that beta question about one sleeve.',
    },
    {
      d: 'easy',
      stem: 'How is Jensen’s alpha related to the CAPM?',
      correct: 'Jensen’s alpha is the portfolio return minus the CAPM required return, so the calculation uses beta.',
      wrong: [
        'Jensen’s alpha is the portfolio return minus the risk-free rate, divided by total volatility.',
        'Jensen’s alpha uses the correlation of two stocks with each other and never uses the market.',
      ],
      why: 'The CAPM required return embeds beta and the market premium. Alpha is the vertical distance from that requirement. The Sharpe ratio is the measure that divides excess return by total volatility.',
    },
    {
      d: 'hard',
      stem: 'M-squared restates a Sharpe ratio as a return by mixing the portfolio with the risk-free asset until volatility matches the market. Which comparison is most accurate?',
      correct: 'If M-squared is above the market return, the portfolio’s Sharpe ratio is above the market’s Sharpe ratio.',
      wrong: [
        'If M-squared is above the market return, the portfolio’s beta must be below zero.',
        'M-squared and the market return cannot be compared, because M-squared is a correlation.',
      ],
      why: 'M-squared equals the risk-free rate plus the portfolio Sharpe ratio times market volatility. The market return equals the risk-free rate plus the market Sharpe ratio times the same volatility. The larger Sharpe ratio produces the larger M-squared.',
    },
    {
      d: 'easy',
      stem: 'Which axes go with the capital market line and the security market line?',
      correct: 'The capital market line plots expected return against total risk. The security market line plots expected return against beta.',
      wrong: [
        'Both lines plot expected return against total risk and differ only by the risk-free rate.',
        'The capital market line plots beta against alpha, and the security market line plots fees against turnover.',
      ],
      why: 'Total risk belongs on the capital market line because the market portfolio has diversified idiosyncratic risk away, so its sigma is systematic. Individual securities still need beta on the security market line, since their own sigma includes risks the model does not price.',
    },
    {
      d: 'medium',
      stem: 'A stock’s standard deviation is high, but almost none of that standard deviation is correlated with the market. Under the CAPM, which statement is most accurate?',
      correct: 'The idiosyncratic volatility is not compensated. Only the systematic piece, through beta, raises the required return.',
      wrong: [
        'The entire standard deviation is compensated, so the required return rises one-for-one with total volatility.',
        'The stock’s required return is the market return, because high volatility implies a beta of 1.',
      ],
      why: 'Beta can be low even when standalone volatility is high, if correlation is low. The CAPM premium multiplies beta. The leftover volatility is the investor’s diversification problem, not a priced factor in this model.',
    },
    {
      d: 'medium',
      stem: 'On a capital allocation line, an investor’s optimal weight in the risky portfolio is 140%. What does that weight mean?',
      correct: 'The investor borrows at the risk-free rate and holds more than 100% of wealth in the risky portfolio, beyond the tangency point.',
      wrong: [
        'The investor lends 140% of wealth at the risk-free rate and shorts the risky portfolio.',
        'The investor holds 40% in the risky portfolio and 100% in the risk-free asset without borrowing.',
      ],
      why: 'Weights between 0 and 1 are lending combinations, sitting between the risk-free asset and the risky portfolio. A weight above 1 extends the line past the risky portfolio by borrowing.',
    },
    {
      d: 'easy',
      stem: 'An investor places 30% of wealth in the risk-free asset and 70% in the risky portfolio that defines the capital allocation line. Where does that complete portfolio sit?',
      correct: 'On the segment between the risk-free asset and the risky portfolio, which is the lending portion of the line.',
      wrong: [
        'Beyond the risky portfolio, because any holding of the risk-free asset is leverage.',
        'Inside the minimum-variance frontier of risky assets, because the risk-free asset is risky.',
      ],
      why: 'Lending means the risky weight is below 1. The complete portfolio’s risk is 70% of the risky portfolio’s risk, and its expected return is the corresponding weighted average with the risk-free rate.',
    },
    {
      d: 'medium',
      stem: 'An asset’s correlation with the market rises. Its own standard deviation and the market’s standard deviation stay the same. What happens to beta?',
      correct: 'Beta rises, because beta equals that correlation times the asset volatility divided by market volatility.',
      wrong: [
        'Beta falls, because a higher correlation means the asset needs less systematic risk.',
        'Beta is unchanged, because beta depends only on the two standard deviations.',
      ],
      why: 'Correlation is a direct multiplier in the beta identity. Nothing else in the identity moved, so beta moves with the correlation.',
    },
    {
      d: 'medium',
      stem: 'Two stocks have the same beta. One has much higher total volatility than the other. Under the CAPM, which required-return statement is most accurate?',
      correct: 'They have the same required return, because the model prices beta and not the idiosyncratic gap in total volatility.',
      wrong: [
        'The higher-volatility stock has the higher required return, even though the betas match.',
        'The higher-volatility stock has a required return equal to the risk-free rate.',
      ],
      why: 'The security market line is a line in beta. Equal betas land on the same point. The extra volatility is unsystematic if it is not in the beta, and this model does not add a premium for it.',
    },
    {
      d: 'hard',
      stem: `Portfolio A returned 14% with standard deviation 20% and beta 0.80. Portfolio B returned 12% with standard deviation 12% and beta 1.10. The risk-free rate was 3%. Sharpe ratios are ${num(sharpeA, 2)} for A and ${num(sharpeB, 2)} for B. Treynor ratios are ${pct(treynorA)} for A and ${pct(treynorB)} for B. The investor will hold only one of these portfolios as the entire risky wealth. Which conclusion fits?`,
      correct: 'Choose B. Sharpe uses total risk and is the measure for a stand-alone portfolio, and B has the higher Sharpe ratio.',
      wrong: [
        'Choose A, because the Treynor ratio is the stand-alone measure and A has the higher Treynor ratio.',
        'Choose A, because Sharpe uses total risk and A has the higher Sharpe ratio.',
      ],
      why: 'The ranking flips across measures. Treynor prefers A because A’s excess return per unit of beta is higher. For a portfolio that will not be buried inside a larger diversified mix, the investor bears total risk, and B’s Sharpe ratio is higher.',
    },
    {
      d: 'hard',
      stem: 'Under the CAPM assumptions of identical beliefs and risk-free lending and borrowing, which risky portfolio do mean-variance investors hold?',
      correct: 'They all hold the tangency portfolio that maximizes the Sharpe ratio, and that portfolio is the market, so each investor’s capital allocation line is the capital market line.',
      wrong: [
        'Each investor holds a different risky portfolio chosen to match that investor’s industry of employment.',
        'Every investor holds only the global minimum-variance portfolio and does not use the risk-free asset.',
      ],
      why: 'Two-fund separation says tastes change the mix with the risk-free asset, not the identity of the risky portfolio. Homogeneous expectations make that risky portfolio the value-weighted market.',
    },
  ])

  return [...numericItems, ...conceptual]
}

function overview(): Draft[] {
  return concept('pm-overview', [
    {
      d: 'easy',
      stem: 'A worker contributes a fixed share of salary to a plan. The retirement balance depends on investment results, and the employer does not promise a formula benefit. Who bears the investment risk?',
      correct: 'The participant bears the investment risk, because this is a defined-contribution arrangement.',
      wrong: [
        'The sponsor bears the investment risk, because every retirement plan is a defined-benefit promise.',
        'The government bears the investment risk as soon as the contribution rate is written down.',
      ],
      why: 'Defined contribution fixes the input, not the output. The account rises and falls with markets, fees, and the participant’s asset mix.',
    },
    {
      d: 'easy',
      stem: 'A pension promises a benefit based on salary and years of service. The sponsor must fund that promise. Who bears the investment risk of the plan assets?',
      correct: 'The sponsor bears the investment risk, because this is a defined-benefit plan.',
      wrong: [
        'Each employee bears the investment risk in proportion to that employee’s contribution rate.',
        'The investment risk is shared equally with the risk-free asset by law, so neither party bears it.',
      ],
      why: 'The benefit formula does not move with the market. If assets fall short, the sponsor’s funding obligation is the shock absorber, subject to the plan’s actual rules and insurance.',
    },
    {
      d: 'medium',
      stem: 'A committee judges each holding by its own standard deviation and ignores how the holdings move together. Which criticism is most accurate?',
      correct: 'The portfolio approach cares about covariances. Standalone risk is not the risk of the whole.',
      wrong: [
        'Covariance matters only for hedge funds, not for a mix of stocks and bonds.',
        'The portfolio standard deviation equals the sum of the standalone standard deviations.',
      ],
      why: 'Adding a volatile asset can still reduce portfolio risk when its correlation with the rest is low. Looking at each line in isolation misses that interaction.',
    },
    {
      d: 'medium',
      stem: 'An investor compares an open-end mutual fund with an exchange-traded fund that tracks a similar index. Which trading distinction is most accurate?',
      correct: 'The exchange-traded fund trades through the day on an exchange. The open-end mutual fund typically transacts at an end-of-day net asset value.',
      wrong: [
        'Both vehicles can be bought only at the closing auction of the stock exchange.',
        'The mutual fund’s shares are shorted like single stocks throughout the day, and the exchange-traded fund deals once a day with the sponsor.',
      ],
      why: 'The dealing mechanism is part of the wrapper. Intraday prices for an exchange-traded fund can move around net asset value. The mutual fund’s daily net asset value is the usual transaction price.',
    },
    {
      d: 'medium',
      stem: 'A family wants the individual securities registered in its own account, with a ban on one stock, and it can meet a high minimum. Which vehicle fits best?',
      correct: 'A separately managed account, which holds the securities directly for that client and can be customized.',
      wrong: [
        'An open-end mutual fund share class, which gives each holder a pro-rata slice of one commingled portfolio.',
        'A futures roll, which provides commodity exposure without owning the underlying companies.',
      ],
      why: 'Direct ownership is what makes restrictions and tax-lot management practical. A mutual fund investor owns shares of the fund, not a personal list of the fund’s securities.',
    },
    {
      d: 'easy',
      stem: 'An endowment supports a university with a spending rule and no near-term plan to spend the principal all at once. Which risk capacity follows most naturally?',
      correct: 'The long horizon and the spending rule can support illiquid holdings, provided the near-term spending slice stays liquid.',
      wrong: [
        'An endowment must hold only cash, because the beneficiary is a nonprofit.',
        'An endowment has the same one-year liquidity need as a bank’s demand deposits.',
      ],
      why: 'Perpetual institutions can wait for private assets to season. They still have to pay this year’s spending, so the liquid sleeve and the illiquid sleeve do different jobs.',
    },
    {
      d: 'medium',
      stem: 'A commercial bank’s liabilities include deposits that customers can withdraw. Which portfolio implication is most accurate?',
      correct: 'The asset portfolio needs enough liquidity and usually a shorter horizon than a young endowment, because deposit funding can leave.',
      wrong: [
        'Deposit funding lets the bank lock every asset for twenty years with no liquidity reserve.',
        'Banks do not face market risk, because deposits are an equity account.',
      ],
      why: 'The liability sets the constraint. A bank that reaches for illiquid yield can fail a withdrawal even if the loans would have paid in full years later.',
    },
    {
      d: 'medium',
      stem: 'A life insurer has written policies whose payments depend on longevity and on credited rates. Which asset-portfolio focus is most accurate?',
      correct: 'Asset-liability management, matching the timing and amount of investment assets to the insurance obligations.',
      wrong: [
        'Maximizing the Sharpe ratio of equities with no reference to the policy reserves.',
        'Holding only commodities, because insurance liabilities have a beta of zero by contract.',
      ],
      why: 'The insurer’s surplus is assets minus the value of the promises. A portfolio that looks fine in isolation can still enlarge surplus risk if it moves against the liabilities.',
    },
    {
      d: 'hard',
      stem: 'A 35-year-old client has stable labor income and little financial wealth. A 70-year-old client depends on the portfolio for spending and no longer works. Which human-capital contrast is most accurate?',
      correct: 'The younger client’s labor income is an asset that can support more financial-market risk. The retiree’s spending depends on the portfolio itself.',
      wrong: [
        'Human capital is irrelevant, so both clients should hold the same risky weight.',
        'The retiree should hold more equity because a shorter horizon raises the ability to bear drawdowns.',
      ],
      why: 'Human capital is the present value of future work. While it is stable and bond-like, the financial portfolio can take more equity risk. When work income stops, the portfolio becomes the spending engine and drawdowns hurt more.',
    },
    {
      d: 'medium',
      stem: 'Shareholders of an open-end mutual fund redeem a large amount on one day. Which operational effect is most accurate?',
      correct: 'The fund may have to sell holdings, or use cash, to meet redemptions, so other shareholders bear the trading consequences.',
      wrong: [
        'Redemptions are met by the exchange specialist, so the portfolio inside the fund never changes.',
        'The fund can refuse every redemption because open-end shares have a contractual lock-up of ten years.',
      ],
      why: 'The open-end promise is daily liquidity at net asset value, within the fund’s terms. Large outflows push trading into the portfolio. An exchange-traded fund’s in-kind creation basket is a different mechanism.',
    },
    {
      d: 'easy',
      stem: 'A brochure says the portfolio approach means buying the single stock with the highest expected return. Which correction is most accurate?',
      correct: 'The portfolio approach builds a mix whose risk depends on how the holdings move together, not on one asset in isolation.',
      wrong: [
        'The portfolio approach forbids diversification, because diversification lowers expected return to the risk-free rate.',
        'The portfolio approach applies only to defined-benefit plans and not to individuals.',
      ],
      why: 'Expected return adds across weights. Risk does not, unless correlations are perfect. That difference is the reason a portfolio is more than its boldest position.',
    },
    {
      d: 'hard',
      stem: 'An exchange-traded fund redeems a creation unit by delivering a basket of securities rather than cash. Why can that mechanism matter for remaining shareholders?',
      correct: 'In-kind redemption can reduce the need to sell securities and realize taxable gains inside the fund.',
      wrong: [
        'In-kind redemption raises the fund’s incentive fee and cancels the management fee.',
        'In-kind redemption forces every shareholder to pay capital-gains tax whether or not they sold.',
      ],
      why: 'Handing out securities lets low-basis lots leave without a cash sale inside the fund. It is a tax and trading feature of the wrapper, not a fee term and not a tax on shareholders who did nothing.',
    },
  ])
}

function ips(): Draft[] {
  return concept('pm-ips', [
    {
      d: 'medium',
      stem: 'A retired client must withdraw 6% of the portfolio each year to pay living costs and has no other income. The client asks for an aggressive equity mix. Willingness to take risk exceeds ability. What should the IPS do?',
      correct: 'Set the risk objective from ability. The spending need limits how much loss the portfolio can absorb.',
      wrong: [
        'Follow willingness, because a client’s preference always overrides the spending arithmetic.',
        'Average willingness and ability so the equity weight sits halfway between the two stories.',
      ],
      why: 'Ability is the financial capacity: horizon, liquidity, and the size of the portfolio relative to spending. When the client wants more risk than that capacity supports, the written policy follows ability.',
    },
    {
      d: 'hard',
      stem: 'A young client has a long horizon, stable wages, and a small spending need, so the ability to take risk is high. The client cannot tolerate a 10% decline and would sell after one. Which IPS response is most appropriate?',
      correct: 'Do not take more risk than willingness allows. Education can explore the gap, but the portfolio has to be one the client will hold.',
      wrong: [
        'Override willingness and invest at the full ability level, because ability is the only input that matters.',
        'Ignore both willingness and ability and use the average equity weight of other clients the same age.',
      ],
      why: 'A portfolio that is abandoned in the first drawdown fails its purpose. When willingness is the scarcer resource, the implemented risk stays inside willingness while the advisor explains the cost of that caution.',
    },
    {
      d: 'easy',
      stem: 'Which pair belongs in the objectives section of an investment policy statement, rather than in the constraints?',
      correct: 'The return objective and the risk objective.',
      wrong: [
        'Tax status and the legal list of permitted holdings.',
        'A unique concentrated-stock position and the liquidity reserve.',
      ],
      why: 'Objectives say what the portfolio is trying to achieve and how much risk it may take. Liquidity, taxes, legal limits, horizon, and special circumstances constrain how those objectives are pursued.',
    },
    {
      d: 'easy',
      stem: 'Which list contains only investment constraints, not return or risk objectives?',
      correct: 'Liquidity, time horizon, taxes, legal and regulatory limits, and unique circumstances.',
      wrong: [
        'Expected return, tracking error, liquidity, and beta.',
        'Risk aversion, the Sharpe ratio, and the capital market line.',
      ],
      why: 'The constraint list is the practical boundary around the objectives. Performance statistics and model lines are tools for analysis, not the client’s constraints.',
    },
    {
      d: 'medium',
      stem: 'A client must pay a house deposit in nine months from the portfolio. The rest of the wealth is for retirement in twenty years. How should that near-term payment affect ability to take risk?',
      correct: 'It reduces ability for the slice that funds the deposit. That slice should not sit in volatile or illiquid assets.',
      wrong: [
        'It raises ability, because a known payment is a reason to increase equity exposure.',
        'It has no effect, because time horizon is not part of risk ability.',
      ],
      why: 'Ability falls when a cash need is soon and large relative to the portfolio. The long-horizon remainder can still take risk. One IPS can recognize both stages.',
    },
    {
      d: 'medium',
      stem: 'Which combination most increases a client’s ability to take risk, holding willingness constant?',
      correct: 'A long horizon, stable outside income, and a portfolio that is large relative to near-term spending.',
      wrong: [
        'A one-year horizon, a single concentrated employer stock, and spending that exceeds portfolio income.',
        'A legal prohibition on equity and a tax lien due next quarter.',
      ],
      why: 'Ability is about surviving a loss without failing a goal. Time, human capital, and a surplus of wealth over spending all add that room. A shortfall or a forced sale takes it away.',
    },
    {
      d: 'medium',
      stem: 'A household must fund university costs in three years and retirement in twenty-five years. Which time-horizon statement belongs in the IPS?',
      correct: 'The horizon is multistage, so the asset mix can differ for the education reserve and the retirement capital.',
      wrong: [
        'Only the longer horizon counts, so the education payment can be invested like retirement wealth.',
        'A multistage horizon means the client cannot hold any risky assets in either stage.',
      ],
      why: 'The policy should name both dates. Money with a near cash date has a different risk budget from money that can compound for decades.',
    },
    {
      d: 'medium',
      stem: 'A taxable investor holds both a taxable brokerage account and a tax-deferred retirement account. Which planning point is a constraint rather than a return forecast?',
      correct: 'Asset location: placing tax-inefficient income inside the tax-deferred account can raise the after-tax result.',
      wrong: [
        'The pre-tax expected return of equities is legally fixed at the risk-free rate for taxable clients.',
        'Taxes are an objective, so the IPS should maximize the statutory tax rate.',
      ],
      why: 'The tax constraint changes which account should own which asset. It does not set a guaranteed pre-tax return, and the goal is not to maximize the tax rate itself.',
    },
    {
      d: 'easy',
      stem: 'A trust document allows only investment-grade bonds and forbids the trustee from borrowing. Where do those rules sit in the IPS?',
      correct: 'They are legal constraints, and the portfolio must follow the trust document.',
      wrong: [
        'They are willingness measures, so the trustee may ignore them if the beneficiary prefers equities.',
        'They are a tactical asset allocation, reviewed each week against the capital market line.',
      ],
      why: 'The trust is the client’s governing law for this money. A higher expected return outside the permitted list is not available to the trustee.',
    },
    {
      d: 'medium',
      stem: 'Most of a client’s wealth is one publicly traded stock received as compensation from the employer, and the client still works there. Which IPS label fits that fact?',
      correct: 'A unique circumstance: a concentrated position tied to the client’s labor income.',
      wrong: [
        'A market-capitalization weight the portfolio is required to hold under the CAPM.',
        'Proof that the client’s ability to take risk is unlimited.',
      ],
      why: 'The stock and the job can fall together. The policy should recognize the concentration, the trading restrictions, and the tax cost of selling, instead of pretending the wealth is a diversified index.',
    },
    {
      d: 'easy',
      stem: 'Which statement best describes strategic asset allocation?',
      correct: 'It is the long-run policy mix of asset classes chosen to meet the objectives and constraints.',
      wrong: [
        'It is a one-week bet that changes the mix whenever a headline appears.',
        'It is the list of individual stocks a trader bought yesterday.',
      ],
      why: 'The strategic mix is the portfolio the IPS expects to own through ordinary markets. Security selection happens inside those class weights.',
    },
    {
      d: 'easy',
      stem: 'A committee temporarily overweights equities by 3 percentage points because it expects a recovery within a year, then plans to return to policy. What is that overweight?',
      correct: 'Tactical asset allocation, a short-horizon deviation from the strategic mix.',
      wrong: [
        'A change in the client’s legal constraints.',
        'A revision of the risk-free rate in the CAPM.',
      ],
      why: 'Tactical moves are opinions about the near future, sized so they do not silently replace the policy. If the view is wrong, the plan is to go back.',
    },
    {
      d: 'medium',
      stem: 'After a rally, equities are 8 percentage points above the policy weight and bonds are underweight. The IPS calls for rebalancing back toward the strategic weights. What is that action doing?',
      correct: 'It restores the risk exposures the policy chose, instead of letting market drift set the allocation.',
      wrong: [
        'It maximizes the weight of the asset that just rose, because momentum is a constraint.',
        'It replaces the return objective with the previous quarter’s winners.',
      ],
      why: 'Drift changes risk even when nobody made a new decision. Rebalancing is how the written mix survives a bull market. The bands and the tax cost belong in the implementation, not as a reason to forget the policy.',
    },
    {
      d: 'medium',
      stem: 'One client’s risk objective says “do not lose more than 15% in a year.” Another says “stay within 4% tracking error of a benchmark.” Which distinction is most accurate?',
      correct: 'The first is an absolute risk objective. The second is a relative risk objective.',
      wrong: [
        'Both are legal constraints, and neither is a risk objective.',
        'The tracking-error target is a liquidity constraint.',
      ],
      why: 'Absolute risk is about the client’s own loss or volatility. Relative risk is about missing a benchmark. A manager can satisfy one and fail the other.',
    },
    {
      d: 'hard',
      stem: 'The spending goal implies a required return that can be reached only with a loss tolerance the client’s ability cannot support. Which IPS conclusion is most accurate?',
      correct: 'The objectives conflict. The return goal, the spending, or the contribution rate needs to change so the pair is feasible.',
      wrong: [
        'The portfolio should use the required return and ignore ability, because goals outrank risk.',
        'A conflicting pair is acceptable if the tactical allocation is reviewed daily.',
      ],
      why: 'An IPS that demands a return the risk budget cannot honestly seek will be broken either by losses or by missed spending. The document should surface that tension before the assets are invested.',
    },
    {
      d: 'medium',
      stem: 'The strategic mix is 50% global equity, 30% bonds, and 20% listed property. Which benchmark construction matches that policy?',
      correct: 'A blended benchmark with those weights, so results are judged against the mix the IPS actually chose.',
      wrong: [
        'A cash index, because every diversified policy is judged against Treasury bills alone.',
        'The single stock with the largest weight inside the equity sleeve.',
      ],
      why: 'The benchmark should describe the opportunity set the manager was told to run. A cash index would make any risky policy look like outperformance in a rising market, without testing whether the policy itself was followed.',
    },
    {
      d: 'medium',
      stem: 'A client loses a job, receives a large inheritance, and shortens the planned retirement date. When should the IPS be reviewed?',
      correct: 'When circumstances change, not only on a fixed calendar and not only after a strong market.',
      wrong: [
        'Only after a calendar decade, because employment and wealth are not IPS inputs.',
        'Only when the portfolio outperforms, because underperformance means the old IPS is still right.',
      ],
      why: 'Ability, horizon, taxes, and unique circumstances moved. The old risk and return objectives may no longer fit the person who now holds the money.',
    },
    {
      d: 'hard',
      stem: 'Next year’s grant must be paid from the portfolio, and a private fund charges a multi-year lock-up. Which constraint does the grant create?',
      correct: 'A liquidity constraint: the grant should be funded with assets that can be sold without relying on the locked-up fund.',
      wrong: [
        'A higher risk objective, because locked-up funds are always the right source for near-term grants.',
        'A requirement to classify the grant as a cognitive error.',
      ],
      why: 'Liquidity is about the timing of cash leaving the portfolio. A strong long-run expected return does not help a payment that is due before the lock-up ends.',
    },
    {
      d: 'easy',
      stem: 'Which statement separates willingness to take risk from ability to take risk?',
      correct: 'Willingness is the client’s attitude toward losses. Ability is the financial capacity to experience those losses and still meet the goals.',
      wrong: [
        'Willingness and ability are two names for the client’s age, so they cannot differ.',
        'Ability is the client’s favorite asset class, and willingness is the fee schedule.',
      ],
      why: 'A wealthy client can be frightened of volatility, and a confident client can be one paycheck from a forced sale. The IPS records both facts because they do not automatically match.',
    },
    {
      d: 'medium',
      stem: 'Why is the investment policy written down instead of left as the current advisor’s memory?',
      correct: 'A written IPS survives a change of advisor and a bad quarter, and it states the objectives, constraints, and the mix that will be maintained.',
      wrong: [
        'A written IPS is optional once the Sharpe ratio has been calculated.',
        'A written IPS replaces the need to measure performance.',
      ],
      why: 'Memory drifts after losses. The document is the authority for what the portfolio was built to do, which benchmarks apply, and when the plan should be revisited.',
    },
  ])
}

function behavior(): Draft[] {
  return concept('pm-behavior', [
    {
      d: 'easy',
      stem: 'A client who already owns a stock reads only the research that praises it and skips the notes that criticize it. Which bias is this?',
      correct: 'Confirmation, a cognitive error of seeking information that supports an existing view.',
      wrong: [
        'Endowment, an emotional bias of demanding more to sell an asset than one would pay to buy it.',
        'Regret aversion, an emotional bias of avoiding any decision that could later look wrong.',
      ],
      why: 'The client is filtering evidence, which is faulty reasoning rather than a feeling about ownership. That places confirmation with the cognitive errors.',
    },
    {
      d: 'easy',
      stem: 'A client refuses to sell a stock trading at 40 because “it is not a loss until it gets back to the 70 I paid.” Which bias fits?',
      correct: 'Anchoring, a cognitive error that sticks to the purchase price as the reference point.',
      wrong: [
        'Availability, a cognitive error that overweights a vivid news story unrelated to the purchase price.',
        'Status quo, an emotional bias that is only about leaving an asset allocation untouched.',
      ],
      why: 'The purchase price is a past number with no claim on the stock’s future. Treating that old price as the line between a loss and a fair value is anchoring, a cognitive error.',
    },
    {
      d: 'medium',
      stem: 'After three strong years, a client calls a manager skilled and does not ask how often luck produces a similar streak. Which bias is this?',
      correct: 'Representativeness, a cognitive error that treats a small sample as if it were the base rate.',
      wrong: [
        'Hindsight, a cognitive error that appears only after an outcome and claims it was predictable.',
        'Loss aversion, an emotional bias that applies only to positions that are already down.',
      ],
      why: 'The stereotype of a “good manager” is being matched to a short record. Representativeness skips the frequency of similar records among unskilled managers.',
    },
    {
      d: 'medium',
      stem: 'After a widely reported fraud at one fund, a client concludes that fraud is now likely at every fund and sells the entire list. Which bias is this?',
      correct: 'Availability, a cognitive error that overweights an event because it is easy to recall.',
      wrong: [
        'Conserving the strategic weights, which is a rebalancing rule rather than a bias.',
        'A hard hurdle, which is a fee term rather than a judgment about probability.',
      ],
      why: 'Vivid stories feel more frequent than they are. Availability distorts the probability the client assigns. It does not, by itself, measure the base rate of fraud across funds.',
    },
    {
      d: 'medium',
      stem: 'After a market drop, a client says the decline was obvious and fires a manager for not having forecast it. Before the drop the client had expected a rally. Which bias is this?',
      correct: 'Hindsight, a cognitive error of believing, after the fact, that the outcome was predictable.',
      wrong: [
        'Overconfidence before any outcome is known, which is the same event as hindsight.',
        'An endowment effect applied to a benchmark the client does not own.',
      ],
      why: 'Hindsight rewrites the earlier uncertainty. It is a reasoning error about the past, and it leads to unfair manager reviews and to the belief that the next shock will also be obvious.',
    },
    {
      d: 'easy',
      stem: 'A client sells winners quickly and holds losers, because losses feel larger than gains of the same size. Which bias and classification fit?',
      correct: 'Loss aversion, an emotional bias. The portfolio damage is the disposition effect: winners are cut and losers remain.',
      wrong: [
        'Confirmation, a cognitive error that is cured by reading one more bullish report.',
        'Representativeness, a cognitive error about sample size rather than about the pain of losses.',
      ],
      why: 'The asymmetry of feeling is emotional. The trading pattern that follows can lower pre-tax returns and, in a taxable account, can also realize gains sooner than losses.',
    },
    {
      d: 'medium',
      stem: 'A client will not rebalance into an asset that has fallen, because a further decline would feel like a personal mistake. The client is not focused on the original purchase price. Which bias is this?',
      correct: 'Regret aversion, an emotional bias that avoids actions that might later be blamed.',
      wrong: [
        'Anchoring, which requires a numerical reference such as a target price.',
        'Availability, which is an overweighting of recent headlines rather than a fear of self-blame.',
      ],
      why: 'Regret aversion looks forward to how a decision will feel if it fails. It can produce herding and a refusal to rebalance. Anchoring would show up as loyalty to a specific past number.',
    },
    {
      d: 'easy',
      stem: 'A client inherited a 60/40 mix years ago, has no new view, and declines every suggestion to update it. Which bias is this?',
      correct: 'Status quo, an emotional bias toward leaving the current allocation unchanged.',
      wrong: [
        'Hindsight, which claims a past outcome was obvious.',
        'Representativeness, which judges a manager by a short winning streak.',
      ],
      why: 'The inherited mix has become the default. Status quo is the discomfort with change itself. It can leave the portfolio inconsistent with a new horizon or a new spending need.',
    },
    {
      d: 'medium',
      stem: 'A client will sell a bond only at a price higher than the price at which the same client would buy that bond today. Which bias is this?',
      correct: 'Endowment, an emotional bias that raises the value of an asset merely because it is already owned.',
      wrong: [
        'Confirmation, a cognitive error about which research the client reads.',
        'A liquidity constraint written into the IPS, which is not a feeling about ownership.',
      ],
      why: 'The bond did not change. Ownership did. Endowment bias makes clients demand a premium to give up what they hold, which can block diversification out of a concentrated position.',
    },
    {
      d: 'medium',
      stem: 'A client trades frequently, holds a few familiar stocks, and describes personal stock-picking skill as well above other investors. Which bias and classification fit the curriculum list used here?',
      correct: 'Overconfidence, an emotional bias that can produce excessive trading and under-diversification.',
      wrong: [
        'Overconfidence, a cognitive error that is fixed by showing the client a covariance matrix once.',
        'A high Sharpe ratio, which is a performance statistic rather than a bias.',
      ],
      why: 'The feeling of being more skilled than the evidence supports is treated here as emotional. The portfolio damage is turnover and a concentrated list, not a misreading of one probability puzzle.',
    },
    {
      d: 'easy',
      stem: 'Which group contains only cognitive errors?',
      correct: 'Confirmation, anchoring, and hindsight.',
      wrong: [
        'Loss aversion, regret aversion, and anchoring.',
        'Overconfidence, status quo, and endowment.',
      ],
      why: 'Confirmation, anchoring, representativeness, availability, and hindsight are cognitive errors. Loss aversion, regret aversion, status quo, endowment, and overconfidence are emotional biases. A mixed list is not “only cognitive.”',
    },
    {
      d: 'medium',
      stem: 'An advisor is choosing how to respond to a client’s bias. The bias is confirmation, and the client will engage with new evidence. Which approach fits a cognitive error?',
      correct: 'Correct it with a better process: seek disconfirming research and write the decision rule before the outcome is known.',
      wrong: [
        'Always adapt and leave the portfolio unchanged, because cognitive errors cannot be moderated.',
        'Treat confirmation as an emotional bias that no new information can touch.',
      ],
      why: 'Cognitive errors are faulty reasoning. New information and a checklist can change the decision. Emotional biases are feelings, and pushing through them can sometimes drive the client out of the plan.',
    },
    {
      d: 'hard',
      stem: 'A client’s loss aversion is strong. Forcing a fully “rational” sale of a long-held loser would make the client abandon the advisor and the IPS. The deviation from the ideal mix is modest. Which response is most appropriate?',
      correct: 'Adapt to the emotional bias enough to keep the client invested, while limiting the damage of the concentrated loser.',
      wrong: [
        'Ignore the relationship and liquidate every loser today, because emotional biases must always be confronted in full.',
        'Reclassify loss aversion as a cognitive error so that a single spreadsheet removes it.',
      ],
      why: 'When an emotional bias is strong and the cost of a partial accommodation is smaller than the cost of the client leaving, adaptation is the practical path. Moderation is still preferred when the bias is mild and the wealth at stake is large.',
    },
    {
      d: 'medium',
      stem: 'A crash has been on every front page. The client now assigns a very high chance to another crash next month and wants to move the entire retirement portfolio to cash. The base rate of monthly crashes is much lower. Which bias is driving the probability?',
      correct: 'Availability, because the recent and vivid crash is easy to recall and is being treated as the typical case.',
      wrong: [
        'Endowment, because the client owns cash and therefore prices the crash in the bond market.',
        'A change in ability to take risk caused by a new legal constraint.',
      ],
      why: 'Nothing in the client’s horizon or liabilities necessarily changed. The probability weight changed because the story is salient. That is an availability error, and the IPS risk ability should not be rewritten from one headline.',
    },
    {
      d: 'hard',
      stem: 'Which portfolio damage lines up with the bias named beside it?',
      correct: 'Representativeness: a three-year hot streak is treated as skill, so the client concentrates in that manager and ignores the base rate of luck.',
      wrong: [
        'Status quo: the client demands a higher selling price than buying price for a stock that was just inherited.',
        'Hindsight: the client refuses to read any report that disagrees with a stock already owned.',
      ],
      why: 'The hot-streak story is representativeness. Demanding more to sell than to buy is endowment, not status quo. Reading only friendly research is confirmation, not hindsight. Matching the mechanism to the bias is what keeps the remedy pointed at the right mistake.',
    },
  ])
}

function risk(): Draft[] {
  return concept('pm-risk', [
    {
      d: 'easy',
      stem: 'A board member says the goal of risk management is to eliminate every risk the organization can find. Which correction is most accurate?',
      correct: 'Risk management is choosing which risks to take. It is not the same project as minimizing all risk.',
      wrong: [
        'Risk management is successful only when measured risk has been reduced to zero.',
        'Risk management applies only to operational errors and not to risks the firm is paid to bear.',
      ],
      why: 'Firms and investors exist to bear some risks that are expected to pay. The management task is to take those on purpose, in a size the organization can survive, and to shed the ones that do not pay.',
    },
    {
      d: 'medium',
      stem: 'A report says the one-month 5% value at risk is USD 2 million. Which reading is most accurate?',
      correct: 'VaR is a threshold and a probability: the model assigns a 5% chance to losses worse than USD 2 million. It does not describe how large those worse losses are.',
      wrong: [
        'The portfolio cannot lose more than USD 2 million in any month.',
        'The average loss in a bad month is USD 2 million, so the figure already includes the tail beyond the threshold.',
      ],
      why: 'Value at risk names a loss level and the probability of exceeding it. The severity past that level is a different question, answered by stress tests or by expected shortfall, not by the VaR number alone.',
    },
    {
      d: 'hard',
      stem: 'A risk team wants a statistic that averages the losses in the outcomes worse than the value-at-risk threshold. Which description fits?',
      correct: 'Expected shortfall, also called conditional VaR, looks beyond the threshold. VaR itself stops at the threshold.',
      wrong: [
        'The Sharpe ratio, which averages losses beyond VaR by dividing excess return by beta.',
        'A higher VaR confidence level, which by definition reports the average tail loss.',
      ],
      why: 'Changing the VaR probability moves the threshold. It still does not say what happens past it. Expected shortfall takes the average of the losses that sit beyond the chosen threshold.',
    },
    {
      d: 'easy',
      stem: 'Who should set the organization’s risk tolerance, and who should implement it?',
      correct: 'The board or other top governing body sets tolerance. Management builds the limits, systems, and reports that keep exposures inside it.',
      wrong: [
        'Each trading desk sets its own tolerance, and the board receives the result only after a loss.',
        'The external auditor sets the risk tolerance as part of the opinion on the financial statements.',
      ],
      why: 'Governance puts the appetite decision where the whole organization’s survival is the mandate. Desks can propose risk, but they should not define the institution’s tolerance for themselves.',
    },
    {
      d: 'medium',
      stem: 'A pension allocates how much active risk each outside manager may take, and the sum of those allowances respects the fund’s total risk limit. What is that allocation?',
      correct: 'A risk budget, which spends the tolerated risk across teams instead of budgeting only the dollars of capital.',
      wrong: [
        'A high-water mark, which stops an incentive fee after a drawdown.',
        'Appraisal smoothing, which reduces the reported volatility of private assets.',
      ],
      why: 'Two mandates can use the same capital and very different risk. A risk budget makes that difference explicit so one team cannot silently consume the tolerance the board granted to the whole fund.',
    },
    {
      d: 'easy',
      stem: 'Which list contains only financial risks?',
      correct: 'Market risk, credit risk, and liquidity risk.',
      wrong: [
        'Model risk, legal risk, and a failure of the settlement process.',
        'Confirmation bias, loss aversion, and status quo bias.',
      ],
      why: 'Market, credit, and liquidity risks are the financial set: prices, counterparties, and the ability to transact or fund. Model, legal, and settlement failures are non-financial. Behavioral biases are a different reading entirely.',
    },
    {
      d: 'easy',
      stem: 'A pricing model is coded incorrectly, a contract is unenforceable, and a trade fails to settle. How should these be grouped?',
      correct: 'They are non-financial risks: model, legal, and settlement risk.',
      wrong: [
        'They are all market risk, because each one can change a price.',
        'They are cognitive errors inside the CAPM.',
      ],
      why: 'A bad price can be the symptom. The source here is not a move in the market factor. It is a model that does not match the contract, a contract that does not work, or an operational failure to exchange cash and securities.',
    },
    {
      d: 'medium',
      stem: 'A family office does not want the risk that a house fire destroys its only residence. It buys an insurance policy. Which risk response is that?',
      correct: 'Transfer, by paying a premium so the insurer bears the specified loss.',
      wrong: [
        'Acceptance, because buying insurance means the office keeps the full loss.',
        'A change to the strategic equity weight in the investment portfolio.',
      ],
      why: 'The standard responses are to avoid, transfer or hedge, or accept. Insurance is a transfer with a premium. It is not the same decision as the portfolio’s equity weight, though both belong in a household risk picture.',
    },
    {
      d: 'medium',
      stem: 'An airline hedges future fuel purchases with futures. Which description of that hedge is most accurate?',
      correct: 'The hedge transfers price risk and typically gives up some upside if fuel becomes cheaper than the hedged level.',
      wrong: [
        'The hedge removes operational risk, credit risk, and volume risk as well as price risk.',
        'A hedge increases the expected fuel cost by the full amount of the airline’s profit margin.',
      ],
      why: 'A hedge is a trade-off, not a deletion of every risk. Basis risk, counterparty risk, and the chance that the airline uses less fuel than it hedged can remain. The gained certainty on price is the point.',
    },
    {
      d: 'hard',
      stem: 'Value at risk for a credit portfolio looks acceptable. A scenario in which defaults cluster and recovery rates collapse produces a loss several times the VaR figure. What is the lesson?',
      correct: 'Stress tests and scenarios are needed because VaR does not describe losses beyond its threshold.',
      wrong: [
        'A passed VaR test means tail losses cannot exceed the threshold, so the scenario is impossible.',
        'Scenario analysis replaces the need for a risk tolerance set by the board.',
      ],
      why: 'VaR is silent on the shape of the tail. Clustered defaults are exactly the kind of dependence a single normal-looking VaR can understate. The scenario does not, by itself, set how much of that tail the board is willing to own.',
    },
    {
      d: 'medium',
      stem: 'Positions that look hedged inside a model lose money together when the model’s correlation assumption is wrong. Which risk is that?',
      correct: 'Model risk: the loss comes from a wrong or misused model, not only from the market move the hedge was meant to cancel.',
      wrong: [
        'A pure risk-free arbitrage, because any model hedge has zero residual risk.',
        'Human-capital risk of the defined-contribution participant.',
      ],
      why: 'If the hedge ratio was an output of a bad correlation, the residual is model risk as well as market risk. Treating the model output as a fact is how a “hedged” book keeps a hidden exposure.',
    },
    {
      d: 'medium',
      stem: 'A fund can sell its bonds only at a large discount today, and it also has a margin call due tomorrow that it may not be able to fund. Which statement names both problems?',
      correct: 'The first is asset liquidity risk. The second is funding liquidity risk. Both are liquidity risk.',
      wrong: [
        'Both are cognitive errors, because liquidity is a behavioral bias.',
        'Both are eliminated by reporting a longer VaR horizon, because a longer horizon removes cash needs.',
      ],
      why: 'Asset liquidity is about the market for the position. Funding liquidity is about cash to meet obligations. A fund can fail the second even when the first would be fine over a longer horizon, which is why the horizon of the risk report has to match the cash clock.',
    },
    {
      d: 'hard',
      stem: 'A bank’s business is making loans, and the spread is expected to pay for the credit losses inside the bank’s tolerance. A director proposes selling every loan so that credit risk is zero. Which response fits risk management?',
      correct: 'Accept the credit risk that the bank is paid to take, measure it, and keep it inside the risk budget. Do not treat zero credit risk as the goal.',
      wrong: [
        'Eliminate the lending book, because risk management means minimizing all risk.',
        'Stop measuring credit losses, because accepted risks do not need limits.',
      ],
      why: 'Choosing risks includes keeping the ones that are the franchise, at a size the capital and the funding can bear. Minimizing this risk to zero would remove the business. Acceptance without a limit would be the opposite mistake.',
    },
    {
      d: 'medium',
      stem: 'A desk breaches a loss limit that was set to enforce the risk budget. What is the governance meaning of that breach?',
      correct: 'It is a limit event that should be escalated under the policy. It is not, by itself, an instruction to eliminate every risky position in the firm.',
      wrong: [
        'A breach cancels the board’s risk tolerance and transfers it to the desk.',
        'A breach proves that value at risk already described the losses beyond the threshold.',
      ],
      why: 'Limits are how a risk budget is policed day to day. Crossing one calls for the response the policy already wrote down: reduce, explain, or accept a temporary exception. It does not rewrite the idea that the firm is in the business of taking some risks.',
    },
  ])
}

export function buildPortfolio(): Draft[] {
  return [
    ...exactly('pm-part1', 22, part1()),
    ...exactly('pm-part2', 32, part2()),
    ...exactly('pm-overview', 12, overview()),
    ...exactly('pm-ips', 20, ips()),
    ...exactly('pm-behavior', 15, behavior()),
    ...exactly('pm-risk', 14, risk()),
  ]
}

function assertDrafts(drafts: Draft[]): void {
  const questions = finalizeTopic('portfolio', drafts)
  const stems = new Set<string>()
  const difficulties = new Set<string>()
  for (const draft of drafts) {
    if (!draft.explanation.includes(draft.correct)) {
      throw new Error(`Explanation missing answer for ${draft.losId}: ${draft.correct.slice(0, 80)}`)
    }
    if (/\bclosest to\b/i.test(draft.stem) && !/\\\(|\\\[/.test(draft.explanation)) {
      throw new Error(`Missing KaTeX: ${draft.stem.slice(0, 90)}`)
    }
    if (draft.losId === 'pm-part1' && draft.stem.includes('U = E(R)') && !draft.stem.includes('decimal')) {
      throw new Error(`Utility stem missing decimals: ${draft.stem.slice(0, 80)}`)
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
  assertDrafts(buildPortfolio())
}
