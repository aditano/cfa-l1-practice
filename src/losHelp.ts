/** Short primers for topics candidates usually find hardest. Original teaching notes, not a solution to any item. */
export const LOS_HELP: Record<string, string> = {
  'qm-rates':
    'Split a quoted rate into a real risk-free piece, expected inflation, and premiums for maturity, liquidity, and credit. Holding-period return puts the price change and any cash distribution over the starting price. Time-weighted return links subperiod growth and ignores how much money was invested; money-weighted return is an IRR and does care about cash-flow timing.',
  'qm-tvm':
    'Price is the present value of the cash flows you expect to receive. A level perpetuity is the cash flow divided by the discount rate. A growing perpetuity (the Gordon case) divides next period’s cash flow by discount rate minus growth, and only when growth is lower. Additivity is why a bond is the sum of its discounted coupons and why implied forwards have to agree with the spot curve.',
  'qm-stats':
    'The mean chases outliers; the median does not. Variance and standard deviation describe spread, and the coefficient of variation is spread per unit of mean. Mean above median usually means right skew. Excess kurtosis above zero means heavier tails than a normal curve. Correlation near zero means little linear association, not “no relationship of any kind.”',
  'qm-probability':
    'Expected value is the probability-weighted average outcome. Variance uses those same probabilities on squared gaps from the mean. On a tree, multiply along a path and add across paths that cannot happen together. Bayes’ formula revises a prior by how likely the new information was under each state.',
  'qm-portmath':
    'Portfolio expected return is a weighted average. Portfolio variance is not, unless correlation is 1. The covariance terms are the diversification. Roy’s safety-first ratio is (expected return − threshold) / standard deviation; under a normal assumption, the higher ratio is the lower chance of falling short.',
  'qm-simulation':
    'If the continuously compounded return is normal, the price stays positive and is lognormal. Monte Carlo draws paths from a model you specify. Bootstrap draws from the data you already have. Use the first when you trust the distribution; use the second when the sample is the distribution.',
  'qm-estimation':
    'Simple random sampling gives every member an equal chance. Stratified sampling forces each group to appear. Convenience samples are fast and biased. The central limit theorem says the sample mean tightens around the population mean as n grows, with standard error equal to s divided by the square root of n.',
  'qm-hypothesis':
    'The null is the claim you put on trial, usually “no difference.” A Type I error rejects a true null. A Type II error keeps a false one. The significance level is your Type I budget; power is the chance you reject a false null. Parametric tests assume a distribution. Nonparametric tests are the fallback when that assumption is a poor description of the data.',
  'qm-independence':
    'A test that correlation equals zero asks whether a linear association shows up in the sample. A contingency-table test asks whether two categories are independent. Failing to reject is not proof that the population link is zero.',
  'qm-regression':
    'Least squares picks the line that minimizes the sum of squared residuals. The slope is the change in y for a one-unit change in x inside that model. R-squared is the share of y’s variation the line explains. A residual plot that fans out or bends is a sign the straight-line assumptions are strained.',
  'qm-bigdata':
    'Fintech in this reading means alternative data, text processing, robo-advice, and distributed ledgers. Supervised learning fits inputs to a known outcome; unsupervised learning hunts for structure without one. An overfit model memorizes the sample. More rows do not repair a biased sample.',

  'fsa-intro':
    'Start with the question, then the data, then the process, then the conclusion. The statements are not the whole file: notes, MD&A, and the audit opinion change what a number means. A clean audit opinion is not a forecast.',
  'fsa-income':
    'Revenue is recognized when the performance obligation is satisfied, not when cash happens to arrive. Capitalizing a cost pushes expense into later periods and lifts current profit. Basic EPS uses income available to common shareholders over weighted-average shares. Diluted EPS adds shares from dilutive convertibles and options, and it ignores antidilutive ones.',
  'fsa-balance':
    'Purchased intangibles and goodwill can sit on the balance sheet. Internally generated goodwill does not. Goodwill is not amortized under IFRS or US GAAP; it is tested for impairment. Common-size the balance sheet by total assets so two firms of different scale can be compared.',
  'fsa-cf1':
    'The cash flow statement explains why cash moved, not why accrual profit moved. The indirect method starts at net income and undoes accruals. Under US GAAP, interest paid is operating. IFRS lets firms classify interest paid as operating or financing. Dividends paid are financing under US GAAP and operating or financing under IFRS.',
  'fsa-cf2':
    'Free cash flow to the firm is cash available to all capital providers: CFO plus after-tax interest minus fixed-capital investment. Free cash flow to equity is the cash left for common owners after debt cash flows. A firm can report rising earnings and still have weak free cash flow if working capital or capital spending absorbs the cash.',
  'fsa-inventory':
    'In a rising-price environment, FIFO puts older, cheaper units into COGS, so profit and ending inventory are higher than under LIFO. LIFO is a US GAAP option, not an IFRS one. Write inventory down when net realizable value is below cost; IFRS allows reversals, US GAAP generally does not for inventory in the ordinary course.',
  'fsa-ltassets':
    'Capitalizing a cost raises assets and spreads the expense through depreciation. Expensing it hits profit immediately. Impairment writes the carrying amount down to recoverable amount and the loss usually goes through profit. Derecognition removes the asset and its accumulated depreciation; a sale above the carrying amount is a gain.',
  'fsa-liabilities':
    'Lessees generally put a right-of-use asset and a lease liability on the balance sheet. A defined-contribution pension expense is the contribution. A defined-benefit plan leaves the employer with the investment and actuarial risk. Share-based pay is compensation expense, not a free gift to employees.',
  'fsa-tax':
    'Tax expense is what accrual accounting reports. Taxes payable is what the return says is owed. A deferred tax liability usually means you paid less tax now than the expense you recognized, often because tax depreciation was faster than book depreciation. Permanent differences change the effective rate and do not create a deferred balance. The cash tax rate uses taxes paid, not tax expense.',
  'fsa-quality':
    'High-quality reporting is decision-useful and complete. High-quality earnings are also sustainable. Aggressive choices pull profit forward (long lives, low provisions, channel stuffing). Conservative choices push it out. Non-GAAP figures are a warning when the adjustments keep growing or always exclude “one-time” costs that repeat.',
  'fsa-ratios':
    'Say the ratio out loud: numerator, denominator, and whether you used an average balance. DuPont writes ROE as margin times turnover times leverage, so two firms with the same ROE can be different businesses. A higher current ratio is not automatically safer if inventory is unsaleable.',
  'fsa-model':
    'A sales-driven model starts with revenue drivers, then margins, working capital, capital spending, and the financing that plugs the cash gap. The balance sheet still has to balance. Porter’s forces tell you whether price and cost assumptions are fantasy. Long explicit horizons feel precise and usually are not.',

  'fi-features':
    'The indenture is the contract. An affirmative covenant requires the issuer to do something, such as keep a coverage ratio. A negative covenant forbids something, such as extra secured debt. Read covenants as protections for the lender, not as suggestions.',
  'fi-cashflows':
    'A bullet bond pays coupons and then principal at the end. An amortizing bond pays principal along the way, so its interest-rate risk is shorter. A call helps the issuer. A put helps the investor. A conversion helps the investor and is why the coupon can be lower.',
  'fi-issuance':
    'Primary markets raise cash for the issuer. Secondary markets let investors trade and, by doing that, make the next primary issue easier. Fixed-income trading is still more dealer-driven than most equity markets.',
  'fi-corpmarkets':
    'Commercial paper is short-dated unsecured borrowing, usually rolled over, so it needs backup liquidity. In a repo, the cash lender holds collateral and a haircut. High-yield issuers typically face tighter covenants and a smaller, more credit-sensitive buyer base than investment-grade issuers.',
  'fi-govmarkets':
    'A sovereign can tax and, in its own currency, influence the money supply. That is not the same as a risk-free promise in a foreign currency. On-the-run government bonds are the newest, usually the most liquid benchmark. Supranationals borrow to fund development or policy lending, not a national deficit.',
  'fi-price':
    'Discount every promised coupon and the principal at the yield. If the coupon rate is above that yield, you pay a premium. If it is below, you pay a discount. Between coupon dates, quoted prices are clean; the invoice price adds accrued interest.',
  'fi-yields':
    'Current yield is the annual coupon over price and ignores pull to par. Yield to maturity assumes you hold to maturity and reinvest coupons at that same yield. A semiannual bond basis of 6% means 3% per half year; the effective annual yield is a bit higher than 6% because of compounding. A G-spread is over a government benchmark. An I-spread is over a swap rate. A Z-spread is added to every spot rate. OAS removes the value of an embedded option from the Z-spread.',
  'fi-floaters':
    'A floater’s coupon resets off a market reference rate plus a quoted margin. If the credit spread the market demands widens beyond that quoted margin, the floater’s price drops below par. Money-market discount yields use face value in the denominator; add-on yields use price. They are not the same number.',
  'fi-curve':
    'A spot rate discounts a single payment. A par rate is the coupon that prices a bond at par. The forward rate is the break-even future spot implied by two spots: (1 + z2)^2 = (1 + z1) × (1 + f). If your own forecast of the future spot is above that forward, you expect the longer bond to underperform the rollover strategy, all else equal.',
  'fi-return':
    'A bond’s holding-period return comes from coupon income, reinvestment of those coupons, and the price change at the horizon. If yields jump immediately and then stay put, a horizon near Macaulay duration is where the price loss and the reinvestment gain roughly offset. That is an approximation, not a promise.',
  'fi-duration':
    'Macaulay duration is the present-value-weighted average time to receive cash, in years. Modified duration equals Macaulay duration divided by one plus the periodic yield, and it estimates percent price change for a change in the bond’s own yield: percent change ≈ −modified duration × Δyield. Money duration multiplies by price. PVBP is that money move for one basis point.',
  'fi-convexity':
    'The duration line is straight and the price-yield curve is not. For an option-free bond the curve bends in your favor: add ½ × annual convexity × (Δyield)^2 to the duration estimate. Portfolio duration and convexity are market-value weights of the pieces, and they assume a parallel yield move.',
  'fi-curve-risk':
    'Effective duration shocks the benchmark curve and revalues the bond, so it is the right tool when an embedded option can change the cash flows. Key-rate duration asks what happens if only one maturity on the curve moves. Empirical duration is fit from history and can be smaller than analytical duration when credit spreads tighten as government yields rise.',
  'fi-credit':
    'Expected loss is roughly probability of default times loss given default times exposure. A rating is an ordinal opinion about credit risk. It is not a buy recommendation, it can lag, and two agencies can disagree. Spreads also move with the cycle, not only with the issuer.',
  'fi-credit-gov':
    'Sovereign analysis asks whether the government can pay and whether it will. Local-currency debt has a different risk from foreign-currency debt because the sovereign can create the local currency, at the cost of inflation and the exchange rate. Institutions and external balances matter as much as the debt ratio.',
  'fi-credit-corp':
    'Capacity is cash flow versus debt service. Collateral is what you seize. Covenants are the early-warning contract. Character is the willingness to pay. Senior secured claims sit ahead of senior unsecured, which sit ahead of subordinated debt. A notched issue rating can be below the issuer rating because of that ranking.',
  'fi-securitization':
    'The originator sells loans to a special purpose entity that issues tranches. Investors can buy the slice of risk they want. The issuer may get funding, a smaller balance sheet, or a lower cost. The servicer collects, and the trustee watches the rules. Bankruptcy remoteness is the point of the entity, and it is only as good as the true sale.',
  'fi-abs':
    'Internal credit enhancement includes subordination, overcollateralization, and excess spread. External enhancement is a guarantee or letter of credit. A covered bond gives recourse to the cover pool and to the issuer, and the assets usually stay on the issuer’s balance sheet. Credit-card ABS revolves and can stop early if performance triggers hit.',
  'fi-mbs':
    'Prepayment rises when borrowers refinance, which is contraction risk: the price does not rise like an option-free bond, and you reinvest at a lower yield. When rates rise, prepayments slow and the bond extends. A pass-through shares principal pro rata. Sequential CMO tranches take principal in order. A PAC tranche stays stable inside a prepayment band; the support tranche absorbs the rest. CMBS adds balloon risk, DSCR, and LTV.',

  'der-features':
    'A derivative’s value comes from an underlying. Exchange-traded contracts are standardized, cleared, and margined, so counterparty risk is mostly replaced by the clearinghouse. OTC contracts can be tailored, and the counterparty remains a risk unless they are cleared too.',
  'der-instruments':
    'A forward commitment obligates both sides: forwards, futures, and swaps. A contingent claim gives the buyer a right and the seller an obligation: calls, puts, and many credit derivatives. At expiration a long call is worth max(spot − strike, 0). The profit subtracts the premium. A short call has the opposite payoff.',
  'der-uses':
    'Issuers hedge a future purchase, a future sale, or the character of a liability. Investors hedge, take a view, or build a synthetic exposure. The risks that come with that convenience are leverage, basis risk, counterparty risk, and a contract you cannot exit at a fair price.',
  'der-carry':
    'Replication says two portfolios with the same payoff must have the same price today, or there is an arbitrage. The forward price is the spot compounded at the risk-free rate, minus the present value of benefits you give up (dividends, coupons, convenience) and plus the present value of costs you avoid (storage). The expected future spot is an opinion. The forward price is a no-arbitrage number. They are not the same object.',
  'der-forwards':
    'At initiation the forward price is set so the contract’s value is zero. Later, the long’s value is the new spot (adjusted for remaining carry) minus the present value of the contracted forward price. At expiration, value is simply spot minus the contracted forward price. No cash changes hands at initiation of a plain forward.',
  'der-futures':
    'Futures are marked to market and variation margin is cash today. If the futures price tends to rise when interest rates rise, that cash lands when reinvestment rates are high, so the long futures position is a bit more attractive than a long forward. In that case the futures price can sit above the forward price. The signs flip if the correlation is negative.',
  'der-swaps':
    'A plain interest-rate swap is a package of forward rate agreements. At initiation a par swap has zero value because the fixed rate equals the swap rate. The party that pays fixed and receives floating gains when the reference rate is above the fixed rate. You can picture that side as long a floating-rate note and short a fixed-rate bond.',
  'der-options':
    'Premium equals exercise value plus time value. Exercise value of a call is max(spot − strike, 0) and cannot be negative. More volatility raises both calls and puts. A higher underlying price raises calls and lowers puts. Dividends and other benefits of holding the underlying do the opposite. More time usually helps, with a known exception for some deep European puts.',
  'der-parity':
    'For European options on a non-dividend-paying asset, call plus the present value of the strike equals put plus the spot. That is a protective put matching a fiduciary call. If the call is too expensive relative to that line, sell the call and buy the synthetic. Put-call-forward parity replaces the spot with the present value of the forward price.',
  'der-binomial':
    'In a one-step tree the hedge ratio is the change in option value divided by the change in the underlying. The risk-neutral probability is the weight that makes the underlying grow at the risk-free rate. It is not the investor’s forecast. Discount the probability-weighted option payoff at the risk-free rate. You do not need the real probability of the up move.',

  'pm-part1':
    'A more risk-averse investor has steeper indifference curves and picks a calmer mix on the capital allocation line. The efficient frontier is the set of risky portfolios with the most expected return per unit of risk. Portfolio standard deviation falls as correlation falls. At a correlation of −1, a specific mix can drive variance to zero.',
  'pm-part2':
    'The capital allocation line connects the risk-free asset to a risky portfolio. The capital market line is that line when the risky portfolio is the market. Only systematic risk is paid in the CAPM, because idiosyncratic risk can be diversified. Beta is correlation times the asset’s volatility divided by market volatility. A security above the security market line has a positive alpha and is cheap relative to the model. Sharpe uses total risk. Treynor and Jensen use beta. M-squared rescales the portfolio to market volatility so two Sharpes can be compared as returns.',
  'pm-overview':
    'The portfolio approach cares about how holdings move together, not about each holding in isolation. In a defined-contribution plan the participant bears the investment risk. In a defined-benefit plan the sponsor does. Mutual funds, ETFs, and separately managed accounts are different wrappers around a similar investment idea.',
  'pm-ips':
    'Write the policy down so it survives a change of staff and a bad quarter. Return and risk objectives come first. Constraints are liquidity, time horizon, taxes, legal rules, and anything unique to the client. If willingness to take risk is higher than ability, ability wins. Strategic asset allocation, not the last stock you picked, dominates long-run results.',
  'pm-behavior':
    'Cognitive errors are faulty reasoning: confirmation, anchoring, representativeness, availability, hindsight. Emotional biases are feelings: loss aversion, regret, status quo, endowment, overconfidence. The practical damage is holding losers, trading too much, and refusing to rebalance. Correct a cognitive error with better process. Adapt to an emotional bias when fighting it would make the client abandon the plan.',
  'pm-risk':
    'Risk management chooses which risks to take. It is not the same as minimizing risk. Governance sets tolerance at the top. A risk budget spends that tolerance across teams. Market, credit, and liquidity risk are financial. Operational, model, legal, and settlement risk are not. You can avoid, hedge, insure, or keep a risk. Value at risk is a threshold and a probability. It does not describe how bad losses are past that threshold.',
}
