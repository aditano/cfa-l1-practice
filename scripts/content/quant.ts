import { pathToFileURL } from 'node:url'
import { exactly, finalizeTopic, numeric, q, type Draft } from '../author.ts'
import { block, inline, num, pct, usd } from '../../src/lib/format.ts'
import * as math from '../../src/lib/formulas.ts'

type Diff = 'easy' | 'medium' | 'hard'

function calc(
  losId: string,
  difficulty: Diff,
  stem: string,
  correct: number,
  wrong: [number, number],
  format: (value: number) => string,
  explain: (formattedCorrect: string) => string,
): Draft {
  return numeric({ topicId: 'quant', losId, difficulty, stem, correct, wrong, format, explain })
}

function idea(
  losId: string,
  difficulty: Diff,
  stem: string,
  correct: string,
  wrong1: string,
  wrong2: string,
  explanation: string,
): Draft {
  return q('quant', losId, difficulty, stem, correct, wrong1, wrong2, explanation)
}

function rates(): Draft[] {
  const required = 0.011 + 0.023 + 0.007 + 0.004 + 0.015
  const holding = math.hpr(64, 70, 2.56)
  const linkedTwo = math.twr([0.12, -0.05])
  const annualized = math.annualize(0.28, 3)
  const quarterlyEar = math.ear(0.08, 4)
  const continuous = math.continuousFromEffective(0.065)
  const fromContinuous = math.effectiveFromContinuous(0.048)
  const moneyWeighted = math.irr([-80000, -16000, 118000])
  const twoYearHolding = math.hpr(25, 31.36)
  const linkedThree = math.twr([0.04, 0.03, -0.02])
  const monthlyEar = math.ear(0.09, 12)
  const geometric = math.annualize(math.twr([0.1, -0.1, 0.1]), 3)
  const lowerBecauseLoss =
    'Lower, because the larger sum of money was invested during the losing year.'

  return exactly('qm-rates', 14, [
    calc(
      'qm-rates',
      'easy',
      `Harbor Glass prices a five-year unsecured note. Analysts use a 1.10% real risk-free rate, 2.30% expected inflation, a 0.70% maturity premium, a 0.40% liquidity premium, and a 1.50% credit premium. Using ${inline(String.raw`r = r_{real}+\pi^e+MP+LP+CP`)}, the nominal required return is closest to:`,
      required,
      [required - 0.015, required - 0.007],
      pct,
      (ans) =>
        `Add the five building blocks once: ${block(String.raw`0.011+0.023+0.007+0.004+0.015=0.060`)}. The nominal required return is ${ans}. Dropping the credit premium, or dropping the maturity premium, leaves a rate that does not match the risks named in the quote.`,
    ),
    calc(
      'qm-rates',
      'easy',
      `Kelso Metals shares were purchased at USD 64 and sold one year later at USD 70. The holder also received a cash dividend of USD 2.56. Using ${inline(String.raw`HPR=(P_1-P_0+D)/P_0`)}, the holding-period return is closest to:`,
      holding,
      [math.hpr(64, 70, 0), (70 - 64 + 2.56) / 70],
      pct,
      (ans) =>
        `The holding-period return puts the price change and the dividend over the purchase price: ${block(String.raw`HPR=\frac{70-64+2.56}{64}`)}. That ratio is ${ans}. Leaving out the dividend understates the result, and dividing by the sale price uses the wrong base.`,
    ),
    calc(
      'qm-rates',
      'medium',
      `Northline Foods returned 12% in the first year and −5% in the second year. No cash was added or removed between the years. Using ${inline(String.raw`TWR=(1+r_1)(1+r_2)-1`)}, the two-year time-weighted return is closest to:`,
      linkedTwo,
      [(0.12 - 0.05) / 2, 1.12 * 1.05 - 1],
      pct,
      (ans) =>
        `Time-weighted return chains the growth factors and does not average the percentages: ${block(String.raw`(1.12)(0.95)-1=0.064`)}. The linked return is ${ans}. An arithmetic average ignores compounding, and flipping the sign of the second year invents a gain that did not occur.`,
    ),
    calc(
      'qm-rates',
      'medium',
      `A Lumen Rail holding produced a 28% return over a full three-year span. Using ${inline(String.raw`r=(1+HPR)^{1/T}-1`)}, the annualized return is closest to:`,
      annualized,
      [0.28 / 3, 0.28],
      pct,
      (ans) =>
        `Annualizing converts the three-year growth factor into a one-year rate: ${block(String.raw`(1.28)^{1/3}-1`)}. The annualized return is ${ans}. Dividing 28% by three ignores compounding, and reporting 28% leaves the result in holding-period form.`,
    ),
    calc(
      'qm-rates',
      'easy',
      `Bramble Utilities issued a note with a stated annual rate of 8% compounded quarterly. Using ${inline(String.raw`EAR=(1+r_s/m)^{m}-1`)}, the effective annual rate is closest to:`,
      quarterlyEar,
      [0.08, math.ear(0.08, 12)],
      pct,
      (ans) =>
        `Quarterly compounding uses a 2% periodic rate four times: ${block(String.raw`(1+0.08/4)^{4}-1`)}. The effective annual rate is ${ans}. The stated 8% ignores compounding within the year, and monthly compounding is a different frequency from the one in the note.`,
    ),
    calc(
      'qm-rates',
      'medium',
      `Quill Software’s cash account pays an effective annual rate of 6.50%. Using ${inline(String.raw`r_c=\ln(1+EAR)`)}, the equivalent continuously compounded rate is closest to:`,
      continuous,
      [0.065, math.effectiveFromContinuous(0.065)],
      pct,
      (ans) =>
        `The continuous rate is the natural log of one plus the effective annual rate: ${block(String.raw`\ln(1.065)`)}. That rate is ${ans}. Leaving the quote at 6.50% skips the conversion, and exponentiating 6.50% runs the formula in the wrong direction.`,
    ),
    calc(
      'qm-rates',
      'medium',
      `Piper Street Capital quotes a continuously compounded funding rate of 4.80%. Using ${inline(String.raw`EAR=e^{r_c}-1`)}, the equivalent effective annual rate is closest to:`,
      fromContinuous,
      [0.048, math.continuousFromEffective(0.048)],
      pct,
      (ans) =>
        `Exponentiate the continuous rate and subtract one: ${block(String.raw`e^{0.048}-1`)}. The effective annual rate is ${ans}. The 4.80% quote is the continuous input, not the effective output, and a logarithm would undo a conversion the question does not ask for.`,
    ),
    calc(
      'qm-rates',
      'hard',
      `An investor contributes USD 80,000 at inception to a Piper Street account, has a net cash outflow of USD 16,000 at the end of year 1 (a USD 20,000 added contribution minus a USD 4,000 distribution taken in cash), and withdraws USD 118,000 when the account closes at the end of year 2. Using the internal rate of return on those investor cash flows, ${inline(String.raw`NPV(r)=0`)}, the money-weighted return is closest to:`,
      moneyWeighted,
      [22000 / 80000, 118000 / 96000 - 1],
      pct,
      (ans) =>
        `Money-weighted return is the IRR of the investor’s cash flows, with contributions negative and the final withdrawal positive: ${block(String.raw`-80000,\ -16000,\ +118000`)}. The IRR is ${ans}. Profit over the first deposit, or profit over the sum of deposits without a time weight, ignores when the cash moved.`,
    ),
    idea(
      'qm-rates',
      'hard',
      'An account starts at USD 100, earns 50% in year 1, and then receives a USD 150 deposit. In year 2 the account loses 20% and finishes at USD 240, which is withdrawn. Relative to the two-year time-weighted return, the money-weighted return is:',
      lowerBecauseLoss,
      'Higher, because the extra deposit lifted the ending balance above the opening deposit.',
      'The same, because both measures simply chain the 50% gain and the 20% loss.',
      `Time-weighted return chains subperiod growth and ignores the deposit size: ${block(String.raw`(1.50)(0.80)-1=0.20`)}. Money-weighted return is the IRR of −100, −150, and +240, which is negative. ${lowerBecauseLoss}`,
    ),
    calc(
      'qm-rates',
      'medium',
      `Orchard Paper was bought at USD 25 and sold two years later at USD 31.36. It paid no dividend. Using ${inline(String.raw`HPR=(P_T-P_0)/P_0`)}, the two-year holding-period return, not the annualized rate, is closest to:`,
      twoYearHolding,
      [math.annualize(math.hpr(25, 31.36), 2), (31.36 - 25) / 31.36],
      pct,
      (ans) =>
        `A holding-period return over the whole horizon is the total price change over the starting price: ${block(String.raw`\frac{31.36-25}{25}`)}. That two-year return is ${ans}. Annualizing it, or dividing by the ending price, answers a different question.`,
    ),
    calc(
      'qm-rates',
      'easy',
      `Sable Logistics recorded successive annual returns of 4%, 3%, and −2%. Using ${inline(String.raw`(1+r_1)(1+r_2)(1+r_3)-1`)}, the linked three-year return is closest to:`,
      linkedThree,
      [0.04 + 0.03 - 0.02, 1.04 * 1.03 - 1],
      pct,
      (ans) =>
        `Link the three growth factors: ${block(String.raw`(1.04)(1.03)(0.98)-1`)}. The three-year return is ${ans}. Adding the percentages skips compounding, and stopping after two years drops the loss.`,
    ),
    idea(
      'qm-rates',
      'medium',
      'A one-year government bill yield contains a real risk-free rate and expected inflation. A longer government bond from the same issuer yields more. The market treats both instruments as free of credit risk and equally liquid. The extra yield on the longer bond is best described as:',
      'A maturity premium for interest-rate risk over the longer horizon.',
      'A credit premium for the chance the issuer misses a contractual payment.',
      'A liquidity premium that belongs on the bill rather than on the bond.',
      `The additive build-up is ${inline(String.raw`r=r_{real}+\pi^e+MP+LP+CP`)}. With credit and liquidity the same on both instruments, the gap that remains is the maturity premium. A maturity premium for interest-rate risk over the longer horizon.`,
    ),
    calc(
      'qm-rates',
      'medium',
      `Marlowe Cement borrows at a stated annual rate of 9% with monthly compounding. Using ${inline(String.raw`EAR=(1+0.09/12)^{12}-1`)}, the effective annual rate is closest to:`,
      monthlyEar,
      [0.09, 0.09 + 0.09 / 12],
      pct,
      (ans) =>
        `Twelve monthly factors of 0.75% compound to the effective annual rate: ${block(String.raw`(1+0.09/12)^{12}-1`)}. The result is ${ans}. The stated 9% is not the effective rate, and adding one monthly slice to 9% double-counts the quote.`,
    ),
    calc(
      'qm-rates',
      'hard',
      `Rowan Dairy’s annual returns were 10%, −10%, and 10%. Using ${inline(String.raw`G=(1+r_1)(1+r_2)(1+r_3)^{1/3}-1`)}, the geometric mean annual return is closest to:`,
      geometric,
      [(0.1 - 0.1 + 0.1) / 3, math.twr([0.1, -0.1, 0.1])],
      pct,
      (ans) =>
        `The geometric mean annualizes the linked growth: ${block(String.raw`[(1.10)(0.90)(1.10)]^{1/3}-1`)}. It equals ${ans}. The arithmetic mean is larger here, and the three-year linked return has not been reduced to a one-year rate.`,
    ),
  ])
}

function tvm(): Draft[] {
  const depositPv = math.pv(10000, 0.07, 4)
  const savingsFv = math.fv(5000, 0.05, 6)
  const leasePv = math.annuityPv(8000, 0.06, 5)
  const gordonPrice = math.gordon(2.4, 0.09, 0.04).price
  const preferred = math.gordon(6, 0.08, 0).price
  const staged = math.twoStagePrice([1.2, 1.5], 0.09, 0.03)
  const terminal = (1.5 * 1.03) / (0.09 - 0.03)
  const stagedUndiscounted = 1.2 + 1.5 + terminal
  const stagedExtra = 1.2 / 1.09 + 1.5 / 1.09 ** 2 + terminal / 1.09 ** 3
  const bond = math.bondPrice(1000, 0.05, 0.06, 3, 1)
  const forward = math.oneYearForwardRate(0.03, 0.045)
  const par = math.parRateTwoYear(0.03, 0.045)
  const uneven = math.npv(0.08, [0, 200, 300, 500])
  const ordinary = math.annuityPv(1200, 0.05, 8)
  const due = ordinary * 1.05
  const annuityFuture = (1200 * ((1.05) ** 8 - 1)) / 0.05
  const nextDividend = math.gordon(1.8, 0.11, 0.04).d1
  const goal = math.pv(20000, 0.06, 10)

  return exactly('qm-tvm', 14, [
    calc(
      'qm-tvm',
      'easy',
      `Finch Analytics will receive a single contract payment of USD 10,000 in four years. The discount rate is 7% a year. Using ${inline(String.raw`PV=FV/(1+r)^n`)}, the present value is closest to:`,
      depositPv,
      [math.fv(10000, 0.07, 4), math.pv(10000, 0.07, 3)],
      usd,
      (ans) =>
        `Discount the payment across four annual periods: ${block(String.raw`PV=\frac{10000}{(1.07)^4}`)}. The present value is ${ans}. Compounding the payment forward, or stopping the discount one year early, does not price the cash flow on the stated date.`,
    ),
    calc(
      'qm-tvm',
      'easy',
      `Hearth Hotels places USD 5,000 on deposit today for six years at 5% compounded annually. Using ${inline(String.raw`FV=PV(1+r)^n`)}, the future value is closest to:`,
      savingsFv,
      [5000 * (1 + 0.05 * 6), math.pv(5000, 0.05, 6)],
      usd,
      (ans) =>
        `Compound the deposit for six years: ${block(String.raw`FV=5000(1.05)^6`)}. The future value is ${ans}. Simple interest of 5% times six years skips compounding, and discounting the deposit answers the reverse question.`,
    ),
    calc(
      'qm-tvm',
      'medium',
      `Ibis Apparel must make five year-end lease payments of USD 8,000. The discount rate is 6%. Using the ordinary-annuity factor ${inline(String.raw`PV=C\frac{1-(1+r)^{-n}}{r}`)}, the present value is closest to:`,
      leasePv,
      [8000 * 5, leasePv * 1.06],
      usd,
      (ans) =>
        `An ordinary annuity discounts each year-end payment: ${block(String.raw`8000\cdot\frac{1-(1.06)^{-5}}{0.06}`)}. The present value is ${ans}. Multiplying 8,000 by five ignores discounting, and grossing up by one extra period prices an annuity due.`,
    ),
    calc(
      'qm-tvm',
      'medium',
      `Vesper Clinics just paid a dividend of USD 2.40. Dividends are expected to grow at 4% forever, and shareholders require 9%. Using ${inline(String.raw`P_0=D_1/(r-g)`)}, the justified price is closest to:`,
      gordonPrice,
      [2.4 / (0.09 - 0.04), math.gordon(2.4, 0.09, 0.04).d1 / 0.09],
      usd,
      (ans) =>
        `Next year’s dividend is ${inline(String.raw`2.40\times 1.04=2.496`)}, and the growing perpetuity is ${block(String.raw`P_0=\frac{2.496}{0.09-0.04}`)}. The price is ${ans}. Dividing the dividend just paid by the spread skips a year of growth, and dividing by 9% alone drops the growth adjustment.`,
    ),
    calc(
      'qm-tvm',
      'easy',
      `Redkite Mining preferred stock pays a level dividend of USD 6.00, with the next dividend due in one year. Investors require 8%. Using ${inline(String.raw`P_0=C/r`)}, the price is closest to:`,
      preferred,
      [6 / 0.05, (6 * 1.08) / 0.08],
      usd,
      (ans) =>
        `A level perpetuity is the cash flow divided by the discount rate: ${block(String.raw`P_0=\frac{6}{0.08}`)}. The price is ${ans}. Using a 5% denominator, or grossing the dividend up as if it grew, changes the security that was priced.`,
    ),
    calc(
      'qm-tvm',
      'hard',
      `Nimbus Components is expected to pay USD 1.20 in one year and USD 1.50 in two years. After year 2, dividends grow at 3% forever. The required return is 9%. Using ${inline(String.raw`P_0=\sum D_t/(1+r)^t`)}, with the terminal value inside the year-2 cash flow, the present value is closest to:`,
      staged,
      [stagedUndiscounted, stagedExtra],
      usd,
      (ans) =>
        `The terminal price at t = 2 is ${inline(String.raw`1.50(1.03)/(0.09-0.03)`)}, and today’s value discounts the first dividend plus that terminal package: ${block(String.raw`P_0=\frac{1.20}{1.09}+\frac{1.50+P_2}{(1.09)^2}`)}. The price is ${ans}. Adding the undiscounted cash flows, or pushing the terminal price one year too far, misstates the timing.`,
    ),
    calc(
      'qm-tvm',
      'medium',
      `A Plover Bank bond has a face value of USD 1,000, a 5% annual coupon, and three years to maturity. The yield is 6% with annual payments. Using ${inline(String.raw`P=\sum C/(1+y)^t+Face/(1+y)^n`)}, the price is closest to:`,
      bond,
      [1000, math.bondPrice(1000, 0.06, 0.05, 3, 1)],
      usd,
      (ans) =>
        `Each coupon and the principal are discounted at 6%: ${block(String.raw`P=\sum_{t=1}^{3}\frac{50}{(1.06)^t}+\frac{1000}{(1.06)^3}`)}. The price is ${ans}. Par would require the coupon to equal the yield, and swapping the 5% coupon with the 6% yield prices a premium bond instead.`,
    ),
    calc(
      'qm-tvm',
      'medium',
      `The one-year spot rate is 3.00% and the two-year spot rate is 4.50%, both effective annual rates. Using ${inline(String.raw`(1+z_2)^2=(1+z_1)(1+f)`)}, the one-year forward rate one year from now is closest to:`,
      forward,
      [0.045, (0.03 + 0.045) / 2],
      pct,
      (ans) =>
        `The forward is the break-even rate that equates the two-year spot investment with a one-year rollover: ${block(String.raw`(1.045)^2/(1.03)-1`)}. It is ${ans}. The two-year spot itself, and a simple average of the two spots, are not that break-even rate.`,
    ),
    calc(
      'qm-tvm',
      'hard',
      `The one-year spot is 3.00% and the two-year spot is 4.50%, both effective annual rates. The two-year par rate is the coupon rate that sets ${inline(String.raw`P=100`)}. That par rate is closest to:`,
      par,
      [0.045, forward],
      pct,
      (ans) =>
        `A par bond’s coupon solves ${block(String.raw`100=\frac{c}{1.03}+\frac{100+c}{(1.045)^2}`)}. The annual par rate is ${ans}. It sits near the spots, but it is neither the two-year spot nor the one-year forward embedded in the curve.`,
    ),
    calc(
      'qm-tvm',
      'hard',
      `A Harbor Glass contract pays USD 200 in one year, USD 300 in two years, and USD 500 in three years. The discount rate is 8%. Using ${inline(String.raw`PV=\sum CF_t/(1+r)^t`)}, the value today is closest to:`,
      uneven,
      [200 + 300 + 500, math.npv(0.08, [200, 300, 500])],
      usd,
      (ans) =>
        `Discount each cash flow by its own exponent: ${block(String.raw`\frac{200}{1.08}+\frac{300}{(1.08)^2}+\frac{500}{(1.08)^3}`)}. The present value is ${ans}. The undiscounted sum ignores time, and treating the first USD 200 as cash today shifts every exponent.`,
    ),
    calc(
      'qm-tvm',
      'hard',
      `Willow Clinics will make eight lease payments of USD 1,200, with the first payment due immediately. The discount rate is 5%. Using an annuity due, ${inline(String.raw`PV_{due}=PV_{ordinary}(1+r)`)}, the present value is closest to:`,
      due,
      [ordinary, 1200 * 8],
      usd,
      (ans) =>
        `The ordinary-annuity value of eight payments is grossed up by one period because the first payment is immediate: ${block(String.raw`PV_{due}=1200\cdot\frac{1-(1.05)^{-8}}{0.05}\cdot 1.05`)}. The present value is ${ans}. The ordinary annuity assumes a one-year delay, and 1,200 times eight is an undiscounted total.`,
    ),
    calc(
      'qm-tvm',
      'medium',
      `Rowan Dairy sets aside USD 1,200 at the end of each year for eight years. The account earns 5% a year. Using ${inline(String.raw`FV=C\frac{(1+r)^n-1}{r}`)}, the future value on the date of the last payment is closest to:`,
      annuityFuture,
      [1200 * 8, ordinary],
      usd,
      (ans) =>
        `Compound each end-of-year deposit to the horizon: ${block(String.raw`FV=1200\cdot\frac{(1.05)^8-1}{0.05}`)}. The future value is ${ans}. Eight times 1,200 ignores interest, and the ordinary-annuity present value is the reverse of this accumulation.`,
    ),
    calc(
      'qm-tvm',
      'easy',
      `Quill Software just paid a dividend of USD 1.80. The dividend is expected to grow at 4% a year, and the required return is 11%. Using ${inline(String.raw`D_1=D_0(1+g)`)}, next year’s dividend is closest to:`,
      nextDividend,
      [1.8, math.gordon(1.8, 0.11, 0.04).price],
      usd,
      (ans) =>
        `One year of growth applied to the dividend just paid is ${block(String.raw`D_1=1.80\times 1.04`)}. Next year’s dividend is ${ans}. The dividend just paid is ${inline(String.raw`D_0`)}, and dividing ${inline(String.raw`D_1`)} by ${inline(String.raw`r-g`)} produces a price rather than the dividend.`,
    ),
    calc(
      'qm-tvm',
      'medium',
      `A family wants USD 20,000 available in ten years for a Hearth Hotels training program. The discount rate is 6% compounded annually. Using ${inline(String.raw`PV=FV/(1+r)^n`)}, the single deposit required today is closest to:`,
      goal,
      [20000 / (1 + 0.06 * 10), math.fv(20000, 0.06, 10)],
      usd,
      (ans) =>
        `The deposit is the present value of the savings target: ${block(String.raw`PV=\frac{20000}{(1.06)^{10}}`)}. It is ${ans}. Dividing by one plus 6% times ten uses simple interest, and compounding 20,000 forward tells you what a deposit of that size would become.`,
    ),
  ])
}

function stats(): Draft[] {
  const sample = [0.08, 0.02, 0.11, -0.04, 0.05]
  const average = math.mean(sample)
  const variance = math.sampleVariance(sample)
  const deviation = Math.sqrt(variance)
  const cv = deviation / average
  const shocked = [0.08, 0.02, 0.11, -0.4, 0.05]
  const shockedMean = math.mean(shocked)
  const sigmaA = 0.12
  const sigmaB = 0.06
  const meanA = 0.08
  const meanB = 0.05
  const leftSkew = 'The sample is left-skewed, because the mean sits below the median.'
  const fatTail = 'Fat-tailed, with more chance of extreme outcomes than a normal curve.'
  const strongNegative = 'Strong and negative: the two return series tend to move in opposite directions.'
  const sampleDenom = 'Divide the sum of squared deviations from the sample mean by n − 1.'
  const higherCv = 'Harbor Glass, because its standard deviation is larger relative to its mean return.'

  return exactly('qm-stats', 12, [
    calc(
      'qm-stats',
      'easy',
      `Five annual returns for Marlowe Cement were 8%, 2%, 11%, −4%, and 5%. Using ${inline(String.raw`\bar{x}=\sum x_i/n`)}, the arithmetic mean return is closest to:`,
      average,
      [0.05, (0.08 + 0.11 + 0.05) / 3],
      pct,
      (ans) =>
        `Add the five returns and divide by five: ${block(String.raw`(0.08+0.02+0.11-0.04+0.05)/5`)}. The mean is ${ans}. The middle sorted value is the median, and dropping the negative and the small positive observation changes the sample.`,
    ),
    calc(
      'qm-stats',
      'medium',
      `For those same five Marlowe Cement returns (8%, 2%, 11%, −4%, and 5%), the sample variance uses the ${inline(String.raw`n-1`)} divisor. The sample variance is closest to:`,
      variance,
      [math.populationVariance(sample), variance * 4],
      (value) => num(value, 5),
      (ans) =>
        `Sample variance averages the squared gaps from the mean with the sample divisor: ${block(String.raw`s^2=\frac{\sum (x_i-\bar{x})^2}{n-1}`)}. The value is ${ans}. Dividing by n instead of n − 1 is the population variance of these five numbers, and the undivided sum of squares is larger than the variance.`,
    ),
    calc(
      'qm-stats',
      'medium',
      `Using the sample variance of the five Marlowe Cement returns, the sample standard deviation is ${inline(String.raw`s=\sqrt{s^2}`)}. That standard deviation is closest to:`,
      deviation,
      [variance, math.populationVariance(sample) ** 0.5],
      pct,
      (ans) =>
        `The standard deviation is the square root of the sample variance ${inline(String.raw`0.00333`)}: ${block(String.raw`s=\sqrt{\frac{\sum (x_i-\bar{x})^2}{4}}`)}. It equals ${ans}. Reporting the variance itself, or the square root of the population variance, is a different scale.`,
    ),
    calc(
      'qm-stats',
      'hard',
      `The Marlowe Cement sample has a mean return of 4.40% and a sample standard deviation of about 5.77%. Using ${inline(String.raw`CV=s/\bar{x}`)}, the coefficient of variation is closest to:`,
      cv,
      [average / deviation, variance / average],
      (value) => num(value, 2),
      (ans) =>
        `Coefficient of variation is spread per unit of mean: ${block(String.raw`CV=\frac{0.0577}{0.044}`)}. For the Marlowe sample it is ${ans}. Inverting the ratio, or dividing the variance by the mean, does not express standard deviation per unit of return.`,
    ),
    idea(
      'qm-stats',
      'easy',
      'Sorted, the five Marlowe Cement returns are −4%, 2%, 5%, 8%, and 11%. Their arithmetic mean is 4.40% and their median is 5%. The shape of this sample is best described as:',
      leftSkew,
      'Right-skewed, because the largest observation is farther above zero than the smallest is below zero.',
      'Symmetric, because a sample with five observations cannot have skewness.',
      `Skewness compares the mean with the median. Here ${inline(String.raw`\bar{x}<\text{median}`)}, which is the left-skew pattern: a low observation pulls the mean down. ${leftSkew}`,
    ),
    idea(
      'qm-stats',
      'medium',
      'A long sample of Finch Analytics daily returns has excess kurtosis of 4.2 and a skewness close to zero. Relative to a normal distribution, this sample is best described as:',
      fatTail,
      'Right-skewed, because excess kurtosis and skewness measure the same feature.',
      'Thinner-tailed than a normal curve, because a positive excess kurtosis subtracts from variance.',
      `Excess kurtosis is ${inline(String.raw`K-3`)} when raw kurtosis is measured against the normal value of 3. A positive excess means heavier tails. ${fatTail}`,
    ),
    idea(
      'qm-stats',
      'easy',
      'The correlation between weekly returns on Harbor Glass and Kelso Metals is −0.82. The linear association between the two series is best described as:',
      strongNegative,
      'Weak, because a negative sign means the association is close to zero.',
      'Positive, because only the absolute value of a correlation is interpreted.',
      `Correlation is bounded by ${inline(String.raw`-1`)} and ${inline(String.raw`1`)}. A value of −0.82 is far from zero and negative, so the series tend to move apart. ${strongNegative}`,
    ),
    calc(
      'qm-stats',
      'medium',
      `Northline Foods has a return standard deviation of 20%, and Bramble Utilities has a return standard deviation of 12%. Their return correlation is 0.30. Using ${inline(String.raw`Cov=\rho\,\sigma_1\sigma_2`)}, the covariance is closest to:`,
      0.3 * 0.2 * 0.12,
      [0.3, 0.2 * 0.12],
      (value) => num(value, 4),
      (ans) =>
        `Covariance scales the correlation by both standard deviations: ${block(String.raw`Cov=0.30\times 0.20\times 0.12`)}. The covariance is ${ans}. The correlation is already a unit-free number, and the product of the two standard deviations omits that correlation.`,
    ),
    calc(
      'qm-stats',
      'hard',
      `The Marlowe Cement sample is edited so the −4% return becomes −40%, while 8%, 2%, 11%, and 5% stay in the sample. Using ${inline(String.raw`\bar{x}=\sum x_i/n`)}, the new arithmetic mean is closest to:`,
      shockedMean,
      [0.05, average],
      pct,
      (ans) =>
        `The edited sum is ${inline(String.raw`0.08+0.02+0.11-0.40+0.05=-0.14`)}, so ${block(String.raw`\bar{x}=-0.14/5`)}. The new mean is ${ans}. The median of the edited sample is still 5%, and the original mean no longer describes the edited data. The mean moves with the outlier; the median does not.`,
    ),
    idea(
      'qm-stats',
      'medium',
      'An analyst has a sample of return observations and wants the sample variance, not the population variance of those same numbers. The correct divisor on the sum of squared deviations is:',
      sampleDenom,
      'Divide the sum of squared deviations from the sample mean by n.',
      'Divide the sum of squared deviations from the sample mean by n + 1.',
      `Sample variance is ${inline(String.raw`s^2=\sum (x_i-\bar{x})^2/(n-1)`)}. The n − 1 divisor is the sample convention used for a standard deviation that will later form a standard error. ${sampleDenom}`,
    ),
    calc(
      'qm-stats',
      'easy',
      `In the original five-return Marlowe Cement sample, the highest return is 11% and the lowest is −4%. Using ${inline(String.raw`Range=x_{max}-x_{min}`)}, the range is closest to:`,
      0.11 - -0.04,
      [0.11, average],
      pct,
      (ans) =>
        `The range uses only the two endpoints: ${block(String.raw`0.11-(-0.04)=0.15`)}. It is ${ans}. The highest return alone, and the arithmetic mean, do not measure the distance from the worst observation to the best.`,
    ),
    idea(
      'qm-stats',
      'hard',
      `Harbor Glass has a mean return of ${(meanA * 100).toFixed(0)}% and a standard deviation of ${(sigmaA * 100).toFixed(0)}%. Bramble Utilities has a mean return of ${(meanB * 100).toFixed(0)}% and a standard deviation of ${(sigmaB * 100).toFixed(0)}%. Stand-alone dispersion per unit of mean return is the coefficient of variation. The firm with the higher coefficient of variation is:`,
      higherCv,
      'Bramble Utilities, because its standard deviation of 6% is the smaller of the two figures.',
      'Neither firm, because coefficients of variation are equal whenever both means are positive.',
      `Coefficient of variation is ${inline(String.raw`CV=\sigma/\bar{x}`)}. Harbor Glass has ${inline(String.raw`0.12/0.08=1.50`)} and Bramble Utilities has ${inline(String.raw`0.06/0.05=1.20`)}. ${higherCv}`,
    ),
  ])
}

function probability(): Draft[] {
  const pUp = 0.25
  const pMid = 0.5
  const pDown = 0.25
  const rUp = 0.12
  const rMid = 0.04
  const rDown = -0.06
  const expected = pUp * rUp + pMid * rMid + pDown * rDown
  const discreteVariance =
    pUp * (rUp - expected) ** 2 + pMid * (rMid - expected) ** 2 + pDown * (rDown - expected) ** 2
  const jointBeat = 0.6 * 0.7
  const conditionalLate = 28 / 40
  const marginalFlag = 0.02 * 0.8 + 0.98 * 0.05
  const posterior = math.bayes(0.02, 0.8, marginalFlag)
  const lossProb = 0.3 * 0.4 + 0.7 * 0.1
  const bothUp = 0.9 * 0.8
  const eitherRating = 0.25 + 0.15
  const projectValue = 0.55 * 8_000_000 + 0.45 * 1_000_000
  const atLeastOne = 1 - 0.8 * 0.8

  return exactly('qm-probability', 10, [
    calc(
      'qm-probability',
      'easy',
      `A one-year scenario set for Lumen Rail assigns a 25% chance to a 12% return, a 50% chance to a 4% return, and a 25% chance to a −6% return. Using ${inline(String.raw`E(R)=\sum p_i R_i`)}, the expected return is closest to:`,
      expected,
      [(rUp + rMid + rDown) / 3, rMid],
      pct,
      (ans) =>
        `Weight each return by its probability: ${block(String.raw`0.25(0.12)+0.50(0.04)+0.25(-0.06)`)}. The expected return is ${ans}. An equal-weighted average ignores the stated probabilities, and the middle return is only one scenario.`,
    ),
    calc(
      'qm-probability',
      'medium',
      `Using that same Lumen Rail scenario set (25% at 12%, 50% at 4%, 25% at −6%), the standard deviation is ${inline(String.raw`\sigma=\sqrt{\sum p_i(R_i-E(R))^2}`)}. It is closest to:`,
      Math.sqrt(discreteVariance),
      [discreteVariance, expected],
      pct,
      (ans) =>
        `The expected return is 3.50%. Variance is ${block(String.raw`\sum p_i(R_i-0.035)^2=0.004075`)}, and the standard deviation is its square root. That standard deviation is ${ans}. Reporting the variance, or reporting the expected return, uses a different unit.`,
    ),
    calc(
      'qm-probability',
      'medium',
      `Piper Street Capital’s tree says the chance of an expansion is 60%, and the chance a portfolio beats its benchmark given an expansion is 70%. Using ${inline(String.raw`P(E\cap B)=P(E)P(B\mid E)`)}, the joint probability of expansion and a beat is closest to:`,
      jointBeat,
      [0.7, 0.6 * 0.3],
      pct,
      (ans) =>
        `Multiply along the branch: ${block(String.raw`0.60\times 0.70=0.42`)}. The joint probability is ${ans}. The 70% figure is conditional on expansion, and 60% times 30% is the joint probability of expansion and a miss.`,
    ),
    calc(
      'qm-probability',
      'medium',
      `Sable Logistics logged 200 shipping weeks. Storms occurred in 40 of them, and 28 of those storm weeks had a late delivery. The other 160 calm weeks included 16 late deliveries. Using ${inline(String.raw`P(L\mid S)=n(L\cap S)/n(S)`)}, the probability of a late delivery given a storm is closest to:`,
      conditionalLate,
      [28 / 200, (28 + 16) / 200],
      pct,
      (ans) =>
        `Condition on the storm weeks only: ${block(String.raw`P(L\mid S)=28/40`)}. The conditional probability is ${ans}. Dividing 28 by all 200 weeks is a joint share of the sample, and pooling every late week estimates the unconditional late rate.`,
    ),
    calc(
      'qm-probability',
      'hard',
      `For a Kelso Metals loan, the prior probability of default is 2%. A covenant flag appears in 80% of default cases and in 5% of non-default cases. Using ${inline(String.raw`P(D\mid F)=P(D)P(F\mid D)/P(F)`)}, the probability of default given a flag is closest to:`,
      posterior,
      [0.02, 0.02 * 0.8],
      pct,
      (ans) =>
        `The marginal probability of a flag is ${inline(String.raw`0.02(0.80)+0.98(0.05)=0.065`)}. Bayes is ${block(String.raw`P(D\mid F)=\frac{0.02\times 0.80}{0.065}`)}. The posterior is ${ans}. The prior alone ignores the flag, and the joint probability 1.60% has not been scaled by how often flags occur.`,
    ),
    calc(
      'qm-probability',
      'medium',
      `Northline Foods loses money in 40% of recession years and in 10% of other years. The probability of a recession is 30%. Using the total probability rule ${inline(String.raw`P(L)=P(L\mid R)P(R)+P(L\mid R^c)P(R^c)`)}, the unconditional probability of a losing year is closest to:`,
      lossProb,
      [0.4, 0.3 * 0.4],
      pct,
      (ans) =>
        `Weight each conditional loss rate by the chance of that state: ${block(String.raw`0.40(0.30)+0.10(0.70)=0.19`)}. The unconditional probability is ${ans}. The recession loss rate is conditional, and the product 12% omits losses that occur outside recessions.`,
    ),
    calc(
      'qm-probability',
      'easy',
      `Two Bramble Utilities plants operate independently. The probability that plant A is available on a given day is 90%, and the probability that plant B is available is 80%. Using ${inline(String.raw`P(A\cap B)=P(A)P(B)`)}, the probability that both are available is closest to:`,
      bothUp,
      [0.9 + 0.8 - 0.9 * 0.8, 0.9],
      pct,
      (ans) =>
        `Independence lets the joint probability factor: ${block(String.raw`0.90\times 0.80=0.72`)}. The probability both are available is ${ans}. Adding the probabilities and subtracting the joint is the union, and 90% is plant A alone.`,
    ),
    calc(
      'qm-probability',
      'easy',
      `A credit file on Orchard Paper cannot be both upgraded and downgraded in the same review. The upgrade probability is 25% and the downgrade probability is 15%. Using ${inline(String.raw`P(U\cup D)=P(U)+P(D)`)}, the probability of a rating change in either direction is closest to:`,
      eitherRating,
      [0.25 * 0.15, 0.25],
      pct,
      (ans) =>
        `Mutually exclusive outcomes add: ${block(String.raw`0.25+0.15=0.40`)}. The probability of a change is ${ans}. The product would be appropriate for independent joint events, which these two outcomes are not, and 25% is only the upgrade case.`,
    ),
    calc(
      'qm-probability',
      'medium',
      `Vesper Clinics assigns a 55% probability to an USD 8,000,000 payoff and a 45% probability to an USD 1,000,000 payoff. Using ${inline(String.raw`E(X)=\sum p_i X_i`)}, the expected payoff is closest to:`,
      projectValue,
      [0.45 * 8_000_000 + 0.55 * 1_000_000, (8_000_000 + 1_000_000) / 2],
      usd,
      (ans) =>
        `Weight the cash payoffs by the stated probabilities: ${block(String.raw`0.55(8000000)+0.45(1000000)`)}. The expected payoff is ${ans}. Swapping the probabilities, or averaging the two payoffs, discards the tree as it was written.`,
    ),
    calc(
      'qm-probability',
      'hard',
      `Ibis Apparel uses two suppliers that fail independently. Each supplier has a 20% chance of missing a shipment in a given month. Using ${inline(String.raw`P(at\ least\ one)=1-P(none)`)}, the probability that at least one supplier misses a shipment is closest to:`,
      atLeastOne,
      [0.2 + 0.2, 0.2 * 0.2],
      pct,
      (ans) =>
        `The complement of two independent successes is ${block(String.raw`1-(0.80)(0.80)=0.36`)}. The probability of at least one miss is ${ans}. Adding the two 20% figures double-counts the month in which both fail, and 4% is the probability that both fail.`,
    ),
  ])
}

function portmath(): Draft[] {
  const weights = [0.5, 0.3, 0.2]
  const returns = [0.12, 0.07, 0.04]
  const blended = math.portfolioReturn(weights, returns)
  const variance = math.portfolioVariance(0.6, 0.2, 0.4, 0.12, 0.3)
  const sigma = Math.sqrt(variance)
  const covariance = 0.3 * 0.2 * 0.12
  const safety = math.safetyFirst(0.11, 0.03, 0.16)
  const calmSigma = Math.sqrt(math.portfolioVariance(0.5, 0.22, 0.5, 0.16, 0.2))
  const perfectSigma = Math.sqrt(math.portfolioVariance(0.6, 0.18, 0.4, 0.08, 1))
  const zeroSigma = Math.sqrt(math.portfolioVariance(0.6, 0.18, 0.4, 0.08, 0))
  const lockedSigma = 0.5 * 0.22 + 0.5 * 0.16
  const benefit = lockedSigma - calmSigma
  const valueWeighted = math.portfolioReturn([0.6, 0.4], [0.07, 0.15])
  const safetyTight = math.safetyFirst(0.1, 0.04, 0.15)
  const safer =
    'The 9% portfolio, because its safety-first ratio is higher than the 12% portfolio’s ratio.'
  const negativeCov =
    'Portfolio variance is below the weighted sum of the variances, because the covariance term is negative.'

  return exactly('qm-portmath', 12, [
    calc(
      'qm-portmath',
      'easy',
      `A portfolio holds 50% in Quill Software with an expected return of 12%, 30% in Bramble Utilities with an expected return of 7%, and 20% in Lumen Rail with an expected return of 4%. Using ${inline(String.raw`E(R_p)=\sum w_i E(R_i)`)}, the portfolio expected return is closest to:`,
      blended,
      [(0.12 + 0.07 + 0.04) / 3, 0.5 * 0.12 + 0.3 * 0.04 + 0.2 * 0.07],
      pct,
      (ans) =>
        `Expected portfolio return is the weighted average: ${block(String.raw`0.50(0.12)+0.30(0.07)+0.20(0.04)`)}. It equals ${ans}. An equal-weighted mean ignores the holdings, and swapping the utility and rail returns assigns the weights to the wrong assets.`,
    ),
    calc(
      'qm-portmath',
      'medium',
      `A two-asset portfolio puts 60% in an asset with a 20% standard deviation and 40% in an asset with a 12% standard deviation. The correlation is 0.30. Using ${inline(String.raw`\sigma_p^2=w_1^2\sigma_1^2+w_2^2\sigma_2^2+2w_1w_2Cov`)}, portfolio variance is closest to:`,
      variance,
      [math.portfolioVariance(0.6, 0.2, 0.4, 0.12, 0), math.portfolioVariance(0.6, 0.2, 0.4, 0.12, 1)],
      (value) => num(value, 5),
      (ans) =>
        `Variance keeps the squared weights, the squared risks, and twice the weighted covariance: ${block(String.raw`0.60^2(0.20^2)+0.40^2(0.12^2)+2(0.60)(0.40)(0.20)(0.12)(0.30)`)}. The variance is ${ans}. A correlation of zero drops the last term, and a correlation of one is a different portfolio.`,
    ),
    calc(
      'qm-portmath',
      'medium',
      `For that 60/40 portfolio (standard deviations 20% and 12%, correlation 0.30), the portfolio standard deviation is ${inline(String.raw`\sigma_p=\sqrt{\sigma_p^2}`)}. It is closest to:`,
      sigma,
      [Math.sqrt(math.portfolioVariance(0.6, 0.2, 0.4, 0.12, 0)), 0.6 * 0.2 + 0.4 * 0.12],
      pct,
      (ans) =>
        `Take the square root of the variance computed with correlation 0.30. The standard deviation is ${ans}. ${block(String.raw`\sigma_p=\sqrt{0.02016}`)}. Zero correlation produces a smaller figure, and a weighted average of the two standard deviations is the result only when correlation equals one.`,
    ),
    calc(
      'qm-portmath',
      'medium',
      `The same two assets have standard deviations of 20% and 12% and a correlation of 0.30. Their covariance, ${inline(String.raw`Cov=\rho\sigma_1\sigma_2`)}, is closest to:`,
      covariance,
      [variance, 0.3],
      (value) => num(value, 4),
      (ans) =>
        `Covariance does not use the portfolio weights: ${block(String.raw`Cov=0.30\times 0.20\times 0.12=0.0072`)}. It equals ${ans}. Portfolio variance is the full weighted expression, and 0.30 is the correlation before it is scaled by the two risks.`,
    ),
    calc(
      'qm-portmath',
      'easy',
      `A candidate portfolio has an expected return of 11% and a standard deviation of 16%. The investor’s minimum acceptable return is 3%. Using Roy’s ratio ${inline(String.raw`SF=(E(R)-R_L)/\sigma`)}, the safety-first ratio is closest to:`,
      safety,
      [(0.11 - 0.03) / 0.16 ** 2, 0.11 / 0.16],
      (value) => num(value, 2),
      (ans) =>
        `Subtract the threshold from the expected return and divide by the standard deviation: ${block(String.raw`(0.11-0.03)/0.16=0.50`)}. The ratio is ${ans}. Dividing by variance, or ignoring the threshold, is not Roy’s ratio.`,
    ),
    idea(
      'qm-portmath',
      'hard',
      'Two portfolios are judged only by the chance of falling short of a 2% threshold, and returns are treated as normal. Portfolio A has an expected return of 9% and a standard deviation of 14%. Portfolio B has an expected return of 12% and a standard deviation of 22%. The portfolio with the lower shortfall probability is:',
      safer,
      'The 12% portfolio, because a higher expected return always has a lower chance of missing a threshold.',
      'They are equal, because both expected returns sit above the 2% threshold.',
      `Roy’s ratio is ${inline(String.raw`(E(R)-R_L)/\sigma`)}. Portfolio A scores ${inline(String.raw`(0.09-0.02)/0.14\approx 0.50`)} and Portfolio B scores ${inline(String.raw`(0.12-0.02)/0.22\approx 0.45`)}. Under the normal assumption, the higher ratio is the lower shortfall probability. ${safer}`,
    ),
    calc(
      'qm-portmath',
      'medium',
      `An equal-weighted pair has standard deviations of 22% and 16% and a correlation of 0.20. Using ${inline(String.raw`\sigma_p=\sqrt{w_1^2\sigma_1^2+w_2^2\sigma_2^2+2w_1w_2\rho\sigma_1\sigma_2}`)}, the portfolio standard deviation is closest to:`,
      calmSigma,
      [lockedSigma, Math.sqrt(math.portfolioVariance(0.5, 0.22, 0.5, 0.16, 0))],
      pct,
      (ans) =>
        `With equal weights the variance is ${block(String.raw`0.5^2(0.22^2)+0.5^2(0.16^2)+2(0.5)(0.5)(0.22)(0.16)(0.20)`)}, and the standard deviation is its square root. The result is ${ans}. A correlation of one would make the standard deviation the weighted average of 22% and 16%. A correlation of zero drops the covariance term and produces a smaller risk.`,
    ),
    calc(
      'qm-portmath',
      'hard',
      `Compare the equal-weighted 22% and 16% assets at a correlation of 1 with the same assets at a correlation of 0.20. Using ${inline(String.raw`\sigma_{\rho=1}-\sigma_{\rho=0.20}`)}, the reduction in portfolio standard deviation is closest to:`,
      benefit,
      [lockedSigma, calmSigma],
      pct,
      (ans) =>
        `At a correlation of one the standard deviation is ${inline(String.raw`0.5(0.22)+0.5(0.16)=0.19`)}. At a correlation of 0.20 it is lower. The difference is ${block(String.raw`0.19-\sigma_{0.20}`)} and equals ${ans}. Reporting either standard deviation alone does not measure the diversification gap.`,
    ),
    calc(
      'qm-portmath',
      'easy',
      `An investor places USD 60,000 in Bramble Utilities, expected return 7%, and USD 40,000 in Kelso Metals, expected return 15%. Using value weights in ${inline(String.raw`E(R_p)=\sum w_i E(R_i)`)}, the portfolio expected return is closest to:`,
      valueWeighted,
      [(0.07 + 0.15) / 2, 0.6 * 0.15 + 0.4 * 0.07],
      pct,
      (ans) =>
        `The value weights are 0.60 and 0.40: ${block(String.raw`0.60(0.07)+0.40(0.15)`)}. The expected return is ${ans}. An equal-weighted average pretends the positions are the same size, and swapping the returns assigns Kelso’s return to the larger weight.`,
    ),
    calc(
      'qm-portmath',
      'medium',
      `A 60/40 portfolio combines an 18% standard deviation with an 8% standard deviation, and the correlation is exactly 1. Using ${inline(String.raw`\sigma_p=w_1\sigma_1+w_2\sigma_2`)} for this perfect-correlation case, the portfolio standard deviation is closest to:`,
      perfectSigma,
      [zeroSigma, perfectSigma ** 2],
      pct,
      (ans) =>
        `When correlation is one, portfolio standard deviation collapses to the weighted average of the standard deviations: ${block(String.raw`0.60(0.18)+0.40(0.08)`)}. It equals ${ans}. A correlation of zero drops the covariance term and produces a smaller risk. Squaring the 14% result produces a variance, not a standard deviation.`,
    ),
    calc(
      'qm-portmath',
      'hard',
      `A portfolio has an expected return of 10% and a standard deviation of 15%. The investor sets the shortfall threshold at 4%. Using ${inline(String.raw`SF=(E(R)-R_L)/\sigma`)}, the safety-first ratio is closest to:`,
      safetyTight,
      [(0.1 - 0.04) / 0.15 ** 2, (0.1 - 0) / 0.15],
      (value) => num(value, 2),
      (ans) =>
        `The threshold enters the numerator: ${block(String.raw`(0.10-0.04)/0.15`)}. The safety-first ratio is ${ans}. Dividing by variance inflates the ratio, and a threshold of zero answers a different investor constraint.`,
    ),
    idea(
      'qm-portmath',
      'easy',
      'Two assets in a long-only portfolio have a negative return correlation. Relative to a case with the same weights and standard deviations but a zero correlation, this portfolio’s variance is:',
      negativeCov,
      'Equal to the weighted average of the two variances, because weights that sum to one remove covariance.',
      'Higher than the zero-correlation case, because a negative correlation is a penalty in the variance formula.',
      `The two-asset variance is ${inline(String.raw`w_1^2\sigma_1^2+w_2^2\sigma_2^2+2w_1w_2\rho\sigma_1\sigma_2`)}. A negative correlation makes the last term negative. ${negativeCov}`,
    ),
  ])
}

function simulation(): Draft[] {
  const lognormalPrice =
    'The price is lognormal and stays positive if the continuously compounded return is normal.'
  const monteCarloModel =
    'Monte Carlo draws paths from a distribution the analyst specifies in advance.'
  const bootstrapHistory =
    'Bootstrap draws are taken from the observed sample, with replacement.'
  const normalPriceTrap =
    'A normal model for the price itself can produce negative prices, which a lognormal price model does not.'
  const tailGap =
    'A bootstrap path cannot show a crash worse than the worst return already in the sample, while a parametric Monte Carlo draw can.'
  const trialsDoNotFix =
    'More trials shrink simulation error around the assumed model; they do not repair a wrong volatility assumption.'

  return exactly('qm-simulation', 6, [
    idea(
      'qm-simulation',
      'easy',
      'An analyst models the continuously compounded return on Quill Software as a normal random variable and builds the price from today’s price times the exponential of that return. The price distribution is best described as:',
      lognormalPrice,
      'Normal, so the price has the same chance of being negative as of being a large positive number.',
      'Uniform between today’s price and a cap the analyst chooses.',
      `If the continuous return ${inline(String.raw`r`)} is normal, then ${inline(String.raw`P_T=P_0 e^{r}`)} is lognormal. ${lognormalPrice}`,
    ),
    idea(
      'qm-simulation',
      'medium',
      'Piper Street Capital wants a distribution of one-year portfolio values. The team specifies expected returns, volatilities, and correlations, then draws many random paths from that specification. This procedure is best described as:',
      monteCarloModel,
      'A bootstrap, because any computer draw is a resample of last year’s returns.',
      'A hypothesis test, because each path is a p-value for the mean.',
      `Monte Carlo simulation generates ${inline(String.raw`P_{t+1}=P_t e^{\mu+\sigma Z}`)} from a chosen model, where ${inline(String.raw`Z`)} is a random draw. ${monteCarloModel}`,
    ),
    idea(
      'qm-simulation',
      'medium',
      'Instead of naming a distribution, an analyst of Northline Foods repeatedly samples, with replacement, from the firm’s actual monthly returns and compounds the draws into a one-year path. This procedure is best described as:',
      bootstrapHistory,
      'A Monte Carlo study that still requires the analyst to state a volatility parameter.',
      'A closed-form lognormal price, because resampling creates a continuous distribution.',
      `The bootstrap uses the empirical distribution: each draw is one of the observed returns. ${bootstrapHistory} No separate ${inline(String.raw`\sigma`)} is supplied by the analyst.`,
    ),
    idea(
      'qm-simulation',
      'easy',
      'A risk report models the price of Kelso Metals stock in one month as a normal random variable centered on today’s price. A reviewer objects to that choice for a limited-liability stock. The objection is:',
      normalPriceTrap,
      'A normal price is required, because limited liability forces the mean and the median to match.',
      'A normal price cannot be simulated, because normal draws are undefined below the mean.',
      `A normal variable ranges over the whole real line, so ${inline(String.raw`P`)} can be negative. Exponentiating a normal return, ${inline(String.raw`P_0 e^{r}`)}, keeps the price positive. ${normalPriceTrap}`,
    ),
    idea(
      'qm-simulation',
      'hard',
      'The historical sample used for a Lumen Rail bootstrap contains no monthly loss worse than 18%. A parametric Monte Carlo model uses a normal continuous return with a volatility estimated from that same sample. On the chance of a simulated monthly loss worse than 18%:',
      tailGap,
      'Both methods are incapable of producing a loss worse than 18%, because both are tied to the sample.',
      'The bootstrap is more likely to show a worse loss, because it repeats the worst month every path.',
      `Bootstrap support stops at the sample extremes. A normal draw for the continuous return can fall past ${inline(String.raw`-18\%`)} even when no observation did. ${tailGap}`,
    ),
    idea(
      'qm-simulation',
      'medium',
      'A Monte Carlo engine for Bramble Utilities is rerun with ten times as many paths. The volatility input is still the figure from a calm three-year window that the reviewer thinks is too low. The larger run:',
      trialsDoNotFix,
      'Removes the low-volatility problem, because simulation error and model error are the same object.',
      'Converts the study into a bootstrap, because a large number of draws recreates the historical sample.',
      `The standard error of a simulated mean falls like ${inline(String.raw`1/\sqrt{N}`)} as the number of paths grows. That tightens the estimate of the model you specified. ${trialsDoNotFix}`,
    ),
  ])
}

function estimation(): Draft[] {
  const se36 = math.standardError(0.18, 36)
  const se144 = math.standardError(0.18, 144)
  const upper = 0.05 + 1.96 * math.standardError(0.15, 25)
  const se16 = math.standardError(0.12, 16)
  const stratified =
    'Stratified sampling, because it forces each industry into the sample in a planned proportion.'
  const convenience =
    'A convenience sample of only those clients, biased toward accounts that contact the firm.'
  const clt =
    'The sampling distribution of the mean gets closer to normal as the number of independent observations grows.'
  const biasStays =
    'A larger sample shrinks the standard error, but a biased selection rule stays biased.'

  return exactly('qm-estimation', 8, [
    calc(
      'qm-estimation',
      'easy',
      `A sample of 36 monthly returns on Ibis Apparel has a sample standard deviation of 18%. Using ${inline(String.raw`s_{\bar{x}}=s/\sqrt{n}`)}, the standard error of the sample mean is closest to:`,
      se36,
      [0.18, 0.18 / 36],
      pct,
      (ans) =>
        `Divide the sample standard deviation by the square root of the sample size: ${block(String.raw`0.18/\sqrt{36}=0.03`)}. The standard error is ${ans}. The 18% figure is the dispersion of one return, and dividing by n rather than by the square root of n overstates how fast the mean’s uncertainty falls.`,
    ),
    calc(
      'qm-estimation',
      'medium',
      `The Ibis Apparel sample grows from 36 monthly returns to 144, and the sample standard deviation stays at 18%. Using ${inline(String.raw`s_{\bar{x}}=s/\sqrt{n}`)}, the new standard error of the mean is closest to:`,
      se144,
      [se36, 0.18 / 144],
      pct,
      (ans) =>
        `Quadrupling a sample multiplies the standard error by one half when the standard deviation is unchanged: ${block(String.raw`0.18/\sqrt{144}=0.015`)}. The new standard error is ${ans}. The old standard error no longer applies, and dividing 18% by 144 is far too small.`,
    ),
    calc(
      'qm-estimation',
      'medium',
      `A sample mean return is 5% and the standard error of that mean is 3%. An approximate 95% interval uses 1.96 standard errors. Using ${inline(String.raw`\bar{x}+1.96\,s_{\bar{x}}`)}, the upper end of the interval is closest to:`,
      upper,
      [0.05 + 0.03, 0.05 + 1.65 * 0.03],
      pct,
      (ans) =>
        `The upper endpoint adds 1.96 standard errors to the point estimate: ${block(String.raw`0.05+1.96(0.03)`)}. It is ${ans}. Adding one standard error is a narrower band, and 1.65 standard errors is closer to a 90% convention than to 95%.`,
    ),
    idea(
      'qm-estimation',
      'easy',
      'A researcher wants every industry in a broad equity universe to appear in a return study, including industries that are a small slice of the market. Simple random sampling might miss one of those industries. The design that directly prevents that miss is:',
      stratified,
      'Convenience sampling, because the easiest names to price are spread evenly across industries.',
      'Using only the single largest stock, because one name represents every industry it competes with.',
      `Stratified sampling draws inside groups so that each group’s weight in the sample is chosen, often to match ${inline(String.raw`n_k/n`)} to a population share. ${stratified}`,
    ),
    idea(
      'qm-estimation',
      'medium',
      'Piper Street Capital estimates how satisfied its clients are by surveying only the clients who called the desk last month. As a description of the whole client list, this design is:',
      convenience,
      'A simple random sample, because every caller had some chance of being a client.',
      'A stratified sample, because callers naturally sort themselves by mandate size.',
      `A convenience sample selects whatever is easy to reach. If callers differ from silent clients, the sample mean is a biased estimator of the client-list mean: ${inline(String.raw`E(\bar{x})\neq \mu`)}. ${convenience}`,
    ),
    idea(
      'qm-estimation',
      'hard',
      'Weekly returns on a single freight contract are skewed. An analyst still wants a statement about the average weekly return and plans to use a large number of independent weeks. The central limit theorem says:',
      clt,
      'The sample mean stays skewed for any sample size, so a normal interval for the mean is never usable.',
      'The standard error rises as the square root of n, so a larger sample makes the mean less precise.',
      `With independent observations and a finite variance, the distribution of ${inline(String.raw`\bar{x}`)} tightens around ${inline(String.raw`\mu`)} and approaches a normal curve as n grows. ${clt} The standard error is ${inline(String.raw`s/\sqrt{n}`)}, which falls as n rises.`,
    ),
    calc(
      'qm-estimation',
      'hard',
      `A sample of 16 annual returns has a sample standard deviation of 12%. The standard error of the mean uses ${inline(String.raw`\sqrt{n}`)} in the denominator, not ${inline(String.raw`\sqrt{n-1}`)}. The standard error is closest to:`,
      se16,
      [0.12 / Math.sqrt(15), 0.12 / 16],
      pct,
      (ans) =>
        `The sample standard deviation is already the n − 1 statistic. The standard error divides it by the square root of the sample size: ${block(String.raw`0.12/\sqrt{16}`)}. The standard error is ${ans}. Dividing by the square root of 15 treats the divisor as if the standard deviation had not already been adjusted, and dividing by 16 is not a square root.`,
    ),
    idea(
      'qm-estimation',
      'medium',
      'A team doubles the number of price quotes it scrapes from the same three dealers, and those dealers systematically post prices above the broader market. For the estimate of the broader-market mean:',
      biasStays,
      'The bias disappears once the sample passes 30 observations, because the central limit theorem removes selection bias.',
      'The standard error rises because more quotes add more noise and no information.',
      `Selection bias is about ${inline(String.raw`E(\bar{x})-\mu`)}, not about the standard error. More draws from a biased source shrink ${inline(String.raw`s/\sqrt{n}`)} and leave the bias. ${biasStays}`,
    ),
  ])
}

function hypothesis(): Draft[] {
  const typeOne = 'A Type I error: rejecting a null hypothesis that is actually true.'
  const rejectMean = 'Reject the null hypothesis that the mean weekly return is zero.'
  const typeTwo = 'A Type II error, and power is the probability of avoiding that error.'
  const notProof = 'Failing to reject the null is not proof that the null is true.'
  const nonparametric =
    'A nonparametric test, because it does not rely on a normal return distribution.'
  const oneSided =
    'The entire significance level sits in one tail, so the critical value is less extreme than in a two-sided test of the same level.'
  const twoSidedReject =
    'Reject the null, because 2.40 is outside the two-sided critical value of 2.09.'
  const nullIsZero = 'The null is the claim placed on trial, here the claim of no difference from zero.'

  return exactly('qm-hypothesis', 8, [
    idea(
      'qm-hypothesis',
      'easy',
      'A test uses a 5% significance level. The null hypothesis is true, and the test nevertheless rejects it. That outcome is:',
      typeOne,
      'A Type II error: failing to reject a null hypothesis that is false.',
      'A correct decision, because a 5% test is designed to reject every true null.',
      `The significance level ${inline(String.raw`\alpha`)} is the probability of rejecting a true null. That mistake is a Type I error. ${typeOne}`,
    ),
    idea(
      'qm-hypothesis',
      'easy',
      'A test of whether Lumen Rail’s mean weekly return differs from zero returns a p-value of 0.03. The analyst set the significance level at 5% before seeing the data. The decision is:',
      rejectMean,
      'Fail to reject the null, because a p-value below 5% supports keeping the null.',
      'Accept the null as proved, because 0.03 is too small to be a real effect.',
      `Reject when the p-value is below ${inline(String.raw`\alpha`)}. Here ${inline(String.raw`0.03<0.05`)}. ${rejectMean} A small p-value is evidence against the null, not a proof of the null.`,
    ),
    idea(
      'qm-hypothesis',
      'medium',
      'The null hypothesis is false, and the test fails to reject it. In the language of hypothesis testing, this outcome is:',
      typeTwo,
      'A Type I error, because every failure to reject is charged against the significance level.',
      'Proof that the significance level was set too low to detect any effect.',
      `A Type II error keeps a false null. Power is ${inline(String.raw`1-\beta`)}, the probability of rejecting a false null. ${typeTwo}`,
    ),
    idea(
      'qm-hypothesis',
      'medium',
      'An analyst fails to reject the null that a strategy’s mean excess return is zero. The p-value is 0.18 and the significance level is 5%. The justified conclusion is:',
      notProof,
      'The mean excess return is proved to be zero because the test did not reject.',
      'The test should be rerun at a lower significance level until the null is rejected.',
      `Failure to reject means the data are not surprising enough under the null at the chosen ${inline(String.raw`\alpha`)}. It does not pin the population mean at zero. ${notProof}`,
    ),
    idea(
      'qm-hypothesis',
      'medium',
      'Return data for a new token strategy fail every reasonable check for a normal distribution, and the sample is small. A tester still wants evidence about the center of the distribution. The more suitable choice is:',
      nonparametric,
      'A parametric t-test, because parametric tests are valid only when the data are non-normal.',
      'No test of any kind, because independence of categories is the only nonparametric question.',
      `Parametric tests lean on a distributional assumption, often normality of the estimator. Rank-based and other nonparametric procedures relax that assumption. ${nonparametric}`,
    ),
    idea(
      'qm-hypothesis',
      'hard',
      'An analyst tests only whether a mean return is greater than zero, not whether it differs from zero in either direction. Compared with a two-sided test at the same significance level, the one-sided test:',
      oneSided,
      'Splits the significance level across both tails, so it is harder to reject in the suspected direction.',
      'Uses a critical value of zero, because a one-sided question does not need a cutoff.',
      `For a one-sided test, all of ${inline(String.raw`\alpha`)} is in the tail named by the alternative. The critical t is closer to zero than the two-sided critical value at the same ${inline(String.raw`\alpha`)}. ${oneSided}`,
    ),
    idea(
      'qm-hypothesis',
      'hard',
      'A two-sided t-test of a mean uses a 5% critical value of 2.09. The computed test statistic is 2.40. A one-sided 5% critical value for the same degrees of freedom would be 1.72. For the two-sided test the analyst actually specified:',
      twoSidedReject,
      'Fail to reject, because 2.40 is closer to 2.09 than to the one-sided cutoff.',
      'Reject only if the statistic also exceeds 1.72 plus 2.09.',
      `The decision uses the critical value that matches the stated alternative. For two sides, reject when ${inline(String.raw`|t|>2.09`)}. ${twoSidedReject}`,
    ),
    idea(
      'qm-hypothesis',
      'medium',
      'Before looking at a sample of active returns, a researcher writes down the hypothesis that the mean active return equals zero. In the testing framework, that statement is:',
      nullIsZero,
      'The alternative hypothesis, because the alternative is always the hypothesis of no effect.',
      'The power of the test, because power is the claim the researcher hopes to prove.',
      `The null is what the procedure assumes for the sampling distribution of the statistic, often ${inline(String.raw`H_0:\mu=0`)}. ${nullIsZero}`,
    ),
  ])
}

function independence(): Draft[] {
  const tStat = math.correlationT(0.45, 22)
  const rejectCorr =
    'Reject the null that the population correlation is zero, because the test statistic exceeds 2.09.'
  const contingency =
    'A chi-square test on a contingency table, asking whether the two categories are independent.'
  const nonlinear =
    'A correlation of zero does not prove independence if the relationship is nonlinear.'

  return exactly('qm-independence', 4, [
    calc(
      'qm-independence',
      'medium',
      `A sample of 22 paired observations shows a sample correlation of 0.45 between two macro surprise series. The t-statistic for a test that the population correlation is zero is ${inline(String.raw`t=r\sqrt{n-2}/\sqrt{1-r^2}`)}. That statistic is closest to:`,
      tStat,
      [0.45 * Math.sqrt(20), 0.45],
      (value) => num(value, 2),
      (ans) =>
        `Insert the sample correlation and the sample size: ${block(String.raw`t=\frac{0.45\sqrt{20}}{\sqrt{1-0.45^2}}`)}. The statistic is ${ans}. Multiplying by the square root of n − 2 and stopping there skips the denominator, and 0.45 is the correlation rather than the test statistic.`,
    ),
    idea(
      'qm-independence',
      'hard',
      'Using that same paired sample, the analyst compares the correlation t-statistic of about 2.25 with a two-sided 5% critical value of 2.09. There are 20 degrees of freedom. The decision on a null that the population correlation is zero is:',
      rejectCorr,
      'Fail to reject, because a correlation of 0.45 is below the critical value of 2.09.',
      'The test is invalid, because a correlation test requires the two series to be categories rather than numbers.',
      `Compare the computed statistic with the critical value: reject ${inline(String.raw`H_0:\rho=0`)} when ${inline(String.raw`|t|`)} exceeds 2.09. ${rejectCorr}`,
    ),
    idea(
      'qm-independence',
      'easy',
      'An analyst sorts quarters into “recession or not” and “Kelso Metals dividend cut or not,” then fills a two-by-two count table. The procedure aimed at whether those two labels are unrelated is:',
      contingency,
      'A t-test that a Pearson correlation equals zero, because every independence question is a correlation question.',
      'A regression of the dividend in dollars on the recession label’s mean, which does not use the counts.',
      `A contingency-table test compares observed counts with the counts expected if the labels were independent, using a chi-square form ${inline(String.raw`\sum (O-E)^2/E`)}. ${contingency}`,
    ),
    idea(
      'qm-independence',
      'medium',
      'Two variables have a sample correlation near zero, but a scatter plot shows a clear U-shape. A conclusion that the variables are independent because the correlation is near zero is:',
      nonlinear,
      'Required, because a correlation of zero is the definition of statistical independence.',
      'Required only when the sample has more than 30 observations, which makes every curve linear.',
      `Pearson correlation measures linear association. Independence is stronger: the joint distribution factors. A U-shape can have ${inline(String.raw`\rho\approx 0`)} and still be dependent. ${nonlinear}`,
    ),
  ])
}

function regression(): Draft[] {
  const predicted = 0.4 + 1.5 * 6
  const residual = 8.1 - predicted
  const rSquared = 1 - 40 / 160
  const fromRho = 0.6 ** 2
  const slopeMeaning =
    'Inside the fitted line, a one-unit higher capacity use is associated with a 1.5 unit higher output index.'
  const fanShape =
    'The variance of the residuals is not constant, so the usual standard errors are unreliable.'
  const leastSquares =
    'The sum of squared residuals, the gaps between observed output and the fitted line.'
  const interceptCaution =
    'The fitted output index when capacity use is zero, which may sit far outside the data used to fit the line.'

  return exactly('qm-regression', 8, [
    calc(
      'qm-regression',
      'easy',
      `A fitted line for a plant-level output index is ${inline(String.raw`\hat{y}=0.4+1.5x`)}, where x is capacity use. When capacity use is 6, the predicted output index is closest to:`,
      predicted,
      [1.5 * 6, 0.4 + 1.5 + 6],
      (value) => num(value, 2),
      (ans) =>
        `Substitute the stated capacity use into the fitted line: ${block(String.raw`\hat{y}=0.4+1.5(6)`)}. The prediction is ${ans}. The slope term alone drops the intercept, and adding the intercept, the slope, and x as three separate summands is not the equation.`,
    ),
    calc(
      'qm-regression',
      'medium',
      `At that same point the model predicts 9.40 and the plant’s actual output index is 8.10. The residual, ${inline(String.raw`e=y-\hat{y}`)}, is closest to:`,
      residual,
      [predicted - 8.1, 8.1 / predicted],
      (value) => num(value, 2),
      (ans) =>
        `A residual is ${block(String.raw`e=y-\hat{y}=8.10-9.40`)}. It equals ${ans}. The opposite sign would mean predicted minus actual, and the ratio of actual to predicted is not a residual.`,
    ),
    idea(
      'qm-regression',
      'easy',
      'In the fitted line of output index on capacity use, the estimated slope is 1.5. A careful reading of that slope is:',
      slopeMeaning,
      'A guarantee that raising capacity use by one unit will cause output to rise by 1.5 units in every plant.',
      'The share of output variation explained by capacity use, which is what a slope always reports.',
      `The slope in ${inline(String.raw`\hat{y}=a+bx`)} is the change in the fitted y for a one-unit change in x. ${slopeMeaning} It is not, by itself, an R-squared or a policy guarantee.`,
    ),
    calc(
      'qm-regression',
      'medium',
      `A regression of the output index on capacity use has a total sum of squares of 160 and a residual sum of squares of 40. Using ${inline(String.raw`R^2=1-SSE/SST`)}, the coefficient of determination is closest to:`,
      rSquared,
      [40 / 160, 160 / 40],
      (value) => num(value, 2),
      (ans) =>
        `R-squared is the share of variation the line picks up: ${block(String.raw`R^2=1-\frac{40}{160}=0.75`)}. It equals ${ans}. The ratio 40/160 is the unexplained share, and 160/40 is not bounded as a fit statistic.`,
    ),
    calc(
      'qm-regression',
      'hard',
      `In a simple linear regression with an intercept, the correlation between the output index and capacity use is 0.60. For this one-regressor model, ${inline(String.raw`R^2=\rho^2`)}. The coefficient of determination is closest to:`,
      fromRho,
      [0.6, Math.sqrt(0.6)],
      (value) => num(value, 2),
      (ans) =>
        `With one regressor and an intercept, R-squared is the square of the correlation: ${block(String.raw`R^2=0.60^2=0.36`)}. It equals ${ans}. The correlation itself is not R-squared, and the square root of the correlation moves in the wrong direction.`,
    ),
    idea(
      'qm-regression',
      'medium',
      'A plot of residuals from the output-index regression against capacity use spreads out in a fan as capacity use rises. The pattern is a warning that:',
      fanShape,
      'The slope is certainly zero, because a fan shape means the line explains nothing.',
      'The residuals are perfectly normal, because a fan is the shape of a normal curve.',
      `Heteroskedasticity means ${inline(String.raw`Var(e\mid x)`)} is not constant. Ordinary least-squares coefficients can still be unbiased, but the usual standard errors are not. ${fanShape}`,
    ),
    idea(
      'qm-regression',
      'hard',
      'Ordinary least squares chooses the intercept and slope of the output-index line by optimizing a specific quantity. That quantity is:',
      leastSquares,
      'The sum of the raw residuals, which a line with an intercept can drive to zero for many different slopes.',
      'The sum of absolute residuals, which is the least-squares objective written without the square.',
      `Least squares minimizes ${inline(String.raw`\sum e_i^2`)}. ${leastSquares} The unsquared residuals sum to zero for any intercept-fitted line and do not pick out one slope.`,
    ),
    idea(
      'qm-regression',
      'medium',
      'The fitted intercept in the output-index regression is 0.4. Capacity use in the sample runs from 4 to 9. The intercept is best read as:',
      interceptCaution,
      'The average output index in the sample, regardless of capacity use.',
      'The extra output associated with a one-unit increase in capacity use.',
      `In ${inline(String.raw`\hat{y}=0.4+1.5x`)}, the intercept is the fitted value at ${inline(String.raw`x=0`)}. ${interceptCaution} The slope, not the intercept, is the one-unit association.`,
    ),
  ])
}

function bigdata(): Draft[] {
  const supervised =
    'Supervised learning, because the trainer supplies the outcome the model is asked to predict.'
  const overfit =
    'Overfit: it has memorized the training sample and is less useful on new shipments.'
  const altData =
    'It can add a timely signal and can also add legal, lag, and selection problems.'
  const moreRows =
    'More rows from the same biased source do not remove the bias in the training sample.'

  return exactly('qm-bigdata', 4, [
    idea(
      'qm-bigdata',
      'easy',
      'Quill Software trains a model to flag overdue invoices. Each historical invoice is labeled as paid on time or late, and the model uses those labels. This setup is:',
      supervised,
      'Unsupervised learning, because any model that reads invoices is unsupervised.',
      'A bootstrap, because labeled outcomes are resampled without a stated target.',
      `Supervised learning fits inputs to a known label. Here the label is on-time versus late, so the target is ${inline(String.raw`y\in\{0,1\}`)}. ${supervised}`,
    ),
    idea(
      'qm-bigdata',
      'easy',
      'A model of late shipments at Sable Logistics is almost perfect on the months used to train it and much worse on later months that were held out. That pattern is:',
      overfit,
      'Underfit: the model is too simple to have learned the training months.',
      'Proof that the holdout months are not data, because a trained model cannot lose accuracy.',
      `Overfit shows up as a gap between training error and error on unseen rows. If training error is near zero and holdout error is large, the fit chased sample noise. ${overfit}`,
    ),
    idea(
      'qm-bigdata',
      'medium',
      'An equity team buys satellite counts of cars in Northline Foods store lots and a card-spend panel that covers only urban shoppers. As investment data, this alternative set:',
      altData,
      'Is interchangeable with audited revenue, because a large file cannot be biased.',
      'Cannot be used in a supervised model, because alternative data have no timestamps.',
      `Alternative data are inputs outside the standard filings. They may lead the accounting numbers, and they may also cover the wrong population. ${altData} A model still needs an explicit target if the task is supervised, ${inline(String.raw`y=f(x)+\epsilon`)}.`,
    ),
    idea(
      'qm-bigdata',
      'hard',
      'The card-spend panel systematically misses rural stores. The vendor offers ten times as many rows from the same urban panel. For a model meant to describe all Northline Foods stores:',
      moreRows,
      'The bias vanishes once the row count is large, because the law of large numbers corrects a skewed sample design.',
      'The extra rows create an unsupervised problem, even if sales labels are still attached.',
      `The law of large numbers tightens a mean around the mean of the distribution you actually sample. If that distribution is only urban stores, ${inline(String.raw`E(\bar{x})`)} is not the all-store mean. ${moreRows}`,
    ),
  ])
}

function assertBank(drafts: Draft[], easy: number, medium: number, hard: number): void {
  const counts = { easy: 0, medium: 0, hard: 0 }
  const stems = new Set<string>()
  for (const draft of drafts) {
    counts[draft.difficulty] += 1
    const key = draft.stem.replace(/\s+/g, ' ').trim().toLowerCase()
    if (stems.has(key)) throw new Error(`Duplicate stem: ${key.slice(0, 90)}`)
    stems.add(key)
    for (const choice of [draft.correct, draft.wrong[0], draft.wrong[1]]) {
      if (/^(A|B|C|D)[.)]\s/.test(choice)) throw new Error(`Lettered choice: ${choice}`)
    }
    if (/\bclosest to\b/i.test(draft.stem) && !/\\\(|\\\[/.test(draft.stem)) {
      throw new Error(`Stem missing KaTeX: ${draft.stem.slice(0, 80)}`)
    }
    if (/\bclosest to\b/i.test(draft.stem) && !/\\\(|\\\[/.test(draft.explanation)) {
      throw new Error(`Explanation missing KaTeX: ${draft.stem.slice(0, 80)}`)
    }
  }
  if (counts.easy !== easy || counts.medium !== medium || counts.hard !== hard) {
    throw new Error(`Difficulty mix ${counts.easy}/${counts.medium}/${counts.hard}, expected ${easy}/${medium}/${hard}`)
  }
}

export function buildQuant(): Draft[] {
  const drafts = [
    ...rates(),
    ...tvm(),
    ...stats(),
    ...probability(),
    ...portmath(),
    ...simulation(),
    ...estimation(),
    ...hypothesis(),
    ...independence(),
    ...regression(),
    ...bigdata(),
  ]
  assertBank(drafts, 30, 46, 24)
  return drafts
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const drafts = buildQuant()
  finalizeTopic('quant', drafts)
  console.log('ok', drafts.length)
}
