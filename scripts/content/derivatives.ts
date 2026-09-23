import { pathToFileURL } from 'node:url'
import { exactly, finalizeTopic, numeric, q, type Draft } from '../author.ts'
import { block, inline, num, pct } from '../../src/lib/format.ts'
import * as math from '../../src/lib/formulas.ts'

const topicId = 'derivatives' as const
type Level = Draft['difficulty']

function pickWrongs(correct: number, candidates: number[], format: (value: number) => string): [number, number] {
  const used = new Set<string>([format(correct)])
  const picked: number[] = []
  for (const candidate of candidates) {
    if (!Number.isFinite(candidate)) continue
    const label = format(candidate)
    if (used.has(label)) continue
    used.add(label)
    picked.push(candidate)
    if (picked.length === 2) return [picked[0], picked[1]]
  }
  throw new Error(`Need two wrong choices near ${format(correct)}`)
}

function rows(
  losId: string,
  data: Array<[Level, string, string, string, string, string]>,
): Draft[] {
  return data.map(([difficulty, stem, correct, wrong1, wrong2, explanation]) => {
    const text = explanation.includes(correct) ? explanation : `${explanation} The best answer is ${correct}.`
    return q(topicId, losId, difficulty, stem, correct, wrong1, wrong2, text)
  })
}

function numQ(
  losId: string,
  difficulty: Level,
  stem: string,
  correct: number,
  candidates: number[],
  format: (value: number) => string,
  explain: (shown: string) => string,
): Draft {
  const wrong = pickWrongs(correct, candidates, format)
  return numeric({
    topicId,
    losId,
    difficulty,
    stem,
    correct,
    wrong,
    format,
    explain: (shown) => {
      const text = explain(shown)
      if (!text.includes(shown)) throw new Error(`Explanation omitted ${shown} for ${losId}`)
      if (!/\\\(|\\\[/.test(text) || !/\\\(|\\\[/.test(stem)) {
        throw new Error(`Missing KaTeX for ${losId}: ${stem.slice(0, 110)}`)
      }
      return text
    },
  })
}

const px = (value: number) => num(value, 2)
const rate = (value: number) => pct(value, 2)
const prob = (value: number) => num(value, 3)

function cash(value: number): string {
  const negative = value < 0
  const [whole, frac] = Math.abs(value).toFixed(2).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}${grouped}.${frac}`
}

function features(): Draft[] {
  return rows('der-features', [
    [
      'easy',
      'A contract held by the treasury of Harborline Holdings has a value that changes when the price of an underlying asset changes, and the contract can be settled for the net amount. The contract is most likely:',
      'A derivative, because its value is derived from the underlying',
      'A cash equity share, because any contract on a price is a share',
      'A bank deposit, because settlement in cash makes the payoff risk-free',
      'A derivative takes its value from an underlying price, rate, or event. Net cash settlement is common and does not turn the contract into a deposit or into ownership of the underlying. Buying the cash asset would require paying the full price and would deliver the asset itself, not a contract on it.',
    ],
    [
      'medium',
      'Compared with an over-the-counter forward written by Bramble and Co., an exchange-traded futures contract on the same underlying most likely has:',
      'Standardized terms, daily margin, and a clearinghouse between the two sides',
      'Fully customized maturity and notional, with no margin and no clearinghouse',
      'The same counterparty exposure as the forward, because the exchange does not change credit risk',
      'Exchange-traded contracts are standardized so they can be cleared and traded. The clearinghouse becomes the counterparty, and margin plus daily settlement reduce replacement-cost risk. An over-the-counter forward can match a custom date and size, and unless it is cleared the original counterparty remains a credit exposure.',
    ],
    [
      'medium',
      'Northveil Industrials wants a hedge whose notional and maturity match a specific customer contract and are not listed on an exchange. That hedge is most likely:',
      'An over-the-counter derivative, which can be tailored but leaves counterparty risk unless it is cleared',
      'An exchange future, because futures notionals can be set to any currency amount',
      'A cash purchase of the underlying, which always has the same credit risk as a forward',
      'Over-the-counter derivatives are customized when listed contracts do not fit the exposure. The benefit is a better hedge ratio and date. The cost is that the counterparty may fail before settlement, unless the trade is cleared or collateralized. Exchange futures use fixed sizes, and owning the underlying is a funded position rather than a bilateral contract.',
    ],
    [
      'hard',
      'After two members of an exchange novate a trade, the clearinghouse most likely:',
      'Becomes the buyer to the selling member and the seller to the buying member',
      'Leaves the original members as each other\'s sole credit exposure',
      'Cancels margin, because novation removes performance risk',
      'Novation interposes the clearinghouse. Each member then has a contract with the clearinghouse rather than with the other member, which is how bilateral counterparty risk is replaced. Margin and the guarantee fund still exist because the clearinghouse has taken that performance risk. Novation does not erase the need for collateral.',
    ],
    [
      'easy',
      'A long forward entered by Cinderwell Utilities requires no payment of the spot price on the trade date. That feature most likely means:',
      'The forward provides leveraged exposure, because the underlying price is controlled without paying it upfront',
      'The forward has no risk, because a zero initial premium means a zero future payoff',
      'The forward is an option, because options are the only contracts with a zero initial price',
      'A plain forward is priced so its value is zero at initiation, so no premium is paid for the contract. The long still has full exposure to the underlying and may later owe a large settlement. That unpaid spot price is leverage. Options generally have a positive premium. A zero initial value is not a zero future payoff.',
    ],
    [
      'medium',
      'Cash settlement of a derivative held by Larkspur Foods, compared with physical delivery, most likely means:',
      'The parties pay the net value in cash and do not exchange the underlying asset',
      'The long must always buy the physical asset at the spot price on the trade date',
      'The contract cannot be a derivative, because derivatives require delivery',
      'Cash settlement pays the difference between the underlying price and the contracted price, or the option payoff, in money. Physical delivery exchanges the asset against the contracted price. Both are valid derivative settlements. Cash settlement does not require the long to purchase the asset at today\'s spot, and it does not remove the derivative character of the contract.',
    ],
  ])
}

function instruments(): Draft[] {
  const callPayoff = math.callExercise(112, 100)
  const callProfit = callPayoff - 8
  const putPayoff = math.putExercise(90, 100)
  const putProfit = putPayoff - 6
  return [
    ...rows('der-instruments', [
      [
        'easy',
        'A forward, a futures contract, and a plain interest-rate swap are best grouped together because each one:',
        'Is a forward commitment that obligates both parties',
        'Gives the buyer a right and the seller an obligation',
        'Pays the buyer only when an underlying price finishes above a strike',
        'Forward commitments obligate both sides to transact, or to settle the net amount, on the agreed terms. Forwards, futures, and swaps are in that group. A contingent claim, such as a call or a put, gives the buyer the right to walk away and leaves the obligation with the seller. A call payoff is only one contingent-claim shape.',
      ],
      [
        'easy',
        'A call option purchased by Vellum Rail is best described as a contingent claim because:',
        'The buyer has the right to exercise, and the seller has the obligation if the buyer exercises',
        'Both the buyer and the seller are obligated to exchange the underlying at expiration',
        'The seller may cancel the contract whenever the underlying price rises',
        'The long call decides whether to exercise. If the call finishes out of the money the buyer lets it expire, and the seller cannot force exercise. If it finishes in the money the seller must perform. That one-sided obligation is what separates a contingent claim from a forward commitment, where both sides must perform.',
      ],
      [
        'medium',
        'Relative to an otherwise similar forward, a futures contract most likely differs because:',
        'Gains and losses are settled in cash each day through variation margin',
        'The futures price is paid in full on the trade date and never changes',
        'Only the short has an obligation, while the long holds an option',
        'Futures are marked to market. Variation margin moves the day\'s gain or loss in cash, and the contract value is reset. A plain forward typically accumulates value until maturity, with no daily cash settlement. Neither side of a future has an option to abandon, and the futures price is not prepaid like a spot purchase.',
      ],
      [
        'medium',
        'A plain fixed-for-floating interest-rate swap held by Pebbleford Mining is most likely:',
        'An exchange of interest payments on a notional that is usually not exchanged',
        'A single option on the issuer\'s share price',
        'A contract that always requires the full notional to be paid by both sides at initiation',
        'In a standard interest-rate swap the parties exchange a fixed rate for a floating reference rate on a shared notional. The notional is a calculating device and is typically not paid. A currency swap is the structure that usually exchanges principals. The interest-rate swap is a forward commitment, not a standalone equity option.',
      ],
      [
        'medium',
        'A forward-rate agreement entered by Quill and Oak Retail most likely:',
        'Settles the difference between a fixed rate and a future reference rate for one period',
        'Gives the long the right, but not the obligation, to borrow at the fixed rate',
        'Exchanges two currencies\' notionals at both the start and the end',
        'A forward-rate agreement is a forward commitment on an interest rate. The net payment depends on the reference rate versus the FRA rate, applied to a notional and a year fraction for one period. It is not optional. Exchanging two notionals at both ends describes a currency swap, not a single-period FRA.',
      ],
      [
        'easy',
        'An American equity call differs from a European equity call with the same strike and expiration most likely because:',
        'The American call may be exercised on any day up to and including expiration',
        'The European call may be exercised whenever the holder chooses before expiration',
        'The American call is always worth less than the European call',
        'American exercise is allowed early. European exercise is allowed only at expiration. Because the American holder has every European choice plus extra dates, the American premium is at least as large as the European premium. Early exercise of a call is often suboptimal when the underlying pays no income, but the right still has nonnegative value.',
      ],
      [
        'hard',
        'In a credit-default swap on Ironwharf Logistics, the protection buyer most likely:',
        'Pays a premium and receives a settlement if a defined credit event occurs',
        'Is obligated to buy the issuer\'s bonds at a higher price when credit improves',
        'Has a forward commitment with no contingency, identical to a plain interest-rate swap',
        'The protection buyer pays for the right to be compensated if a credit event, such as failure to pay or restructuring as defined in the contract, occurs. The protection seller bears that contingent obligation. The contract is a credit contingent claim, not a promise that the buyer will purchase bonds when credit improves, and it is not a plain interest-rate swap.',
      ],
      [
        'easy',
        'At expiration, the payoff to the long holder of a call on Redcedar Paper shares is most likely:',
        'The greater of the share price minus the strike, and zero',
        'The greater of the strike minus the share price, and zero',
        'The share price minus the strike, even when that amount is negative',
        'A long call is the right to buy, so it is exercised only when the share price is above the strike. The expiration payoff is max(S - X, 0). The reverse, max(X - S, 0), is a put payoff. The call payoff is never negative; the premium was paid earlier and is not subtracted again inside the payoff, though it is subtracted to compute profit.',
      ],
      [
        'medium',
        'A payer swaption purchased by Marlowe Glass most likely gives the holder:',
        'The right to enter a swap as the fixed-rate payer',
        'The obligation to enter a swap as the fixed-rate payer on a date already fixed with no right to cancel',
        'The right to exchange the swap notional for the issuer\'s common shares',
        'A swaption is an option on a swap. A payer swaption is the right, not the obligation, to pay fixed and receive floating. It is useful for a prospective borrower who wants protection against a rise in swap rates. It is not a mandatory forward swap, and it is not an equity conversion.',
      ],
      [
        'medium',
        'At expiration the payoff of a long put on Thistlegate Insurance shares is positive most likely when:',
        'The share price is below the strike, because the put is the right to sell',
        'The share price is above the strike, because a put gains when the underlying rises',
        'The premium is larger than the strike, regardless of the share price',
        'The long put may sell the shares at the strike. That right is valuable when the market price is lower, and the payoff is max(X - S, 0). A rising share price reduces the put payoff. The premium affects profit, not the sign of the expiration payoff itself.',
      ],
    ]),
    numQ(
      'der-instruments',
      'easy',
      `A long call on Copperlane Transit stock has a strike of 100 and a premium of 8. At expiration the share price is 112. The profit to the long call, ${inline(String.raw`\max(S-X,0)-premium`)}, is closest to:`,
      callProfit,
      [callPayoff, 8, callPayoff + 8],
      px,
      (shown) =>
        `The expiration payoff is the positive part of spot minus strike, and profit subtracts the premium already paid. ${block(String.raw`\max(112-100,0)-8=12-8=4`)} ` +
        `Reporting 12 ignores the premium. Adding the premium to the payoff double-counts the cost in the wrong direction. The long-call profit is closest to ${shown}.`,
    ),
    numQ(
      'der-instruments',
      'medium',
      `A long put on Fennelbrook Agriculture stock has a strike of 100 and a premium of 6. At expiration the share price is 90. The profit to the long put, ${inline(String.raw`\max(X-S,0)-premium`)}, is closest to:`,
      putProfit,
      [putPayoff, 6, putPayoff - 12],
      px,
      (shown) =>
        `The put payoff is the amount by which the strike exceeds the share price, and it cannot be negative. ${block(String.raw`\max(100-90,0)-6=10-6=4`)} ` +
        `The payoff of 10 is not the profit, because the holder paid 6 for the option. The premium alone is not the expiration result. The long-put profit is closest to ${shown}.`,
    ),
  ]
}

function uses(): Draft[] {
  return rows('der-uses', [
    [
      'easy',
      'Glasswater Hotels will buy a large quantity of linens in four months and wants to lock the purchase price today. The appropriate forward commitment is most likely:',
      'A long forward, so a higher spot price is offset by a gain on the hedge',
      'A short forward, so a higher spot price produces a hedge gain',
      'A long put, which obligates the hotel to sell linens if the price rises',
      'A buyer hedges a future purchase by going long the forward. If the spot price rises, the forward gains and offsets the more expensive purchase. A short forward gains when the price falls, which is the hedge for a future seller, not a future buyer. A long put is a right to sell, and it is a contingent claim rather than this forward commitment.',
    ],
    [
      'easy',
      'A grower at Amberfield Dairy will sell milk powder in three months and is concerned that the price will fall. The hedge that locks the sale price is most likely:',
      'A short forward on the powder',
      'A long forward on the powder',
      'A long call, which obligates the grower to buy powder at the strike',
      'A future seller is hurt by a falling price, so the hedge is a short forward: the forward gains when the price declines and offsets the weaker sale. A long forward would add to that loss. A long call is a right to buy, which is the wrong direction and is not an obligation.',
    ],
    [
      'medium',
      'Southpier Ports pays a floating reference rate on an existing loan and wants synthetic fixed-rate debt. The swap that achieves that conversion is most likely one in which the company:',
      'Pays fixed and receives floating',
      'Pays floating and receives fixed',
      'Pays a premium for a put on its own shares',
      'The company already pays floating to its lender. Receiving floating on a swap and paying that receipt onward, while paying fixed to the swap dealer, leaves a net fixed payment. Paying floating on the swap would double the floating exposure. An equity put does not convert the interest character of the loan.',
    ],
    [
      'medium',
      'A speculator at Kindling Energy posts a small futures margin against a large notional. Relative to buying the underlying with cash, this position most likely:',
      'Creates leverage, so a small price move can produce a large percentage gain or loss on the margin',
      'Eliminates the chance of losing more than the margin, because futures losses are capped',
      'Has the same percentage sensitivity as a fully paid cash position of equal notional',
      'Margin is a performance bond, not the full cost of the underlying. The contract still delivers the price change on the full notional, so the return on posted margin is leveraged. Futures losses are not capped at the initial margin; variation margin calls continue. A fully paid position of the same notional has a much larger capital base and a smaller percentage move.',
    ],
    [
      'hard',
      'Whitecap Marine hedges a specific fuel grade with an exchange future on a related, but not identical, benchmark. The risk that the two prices do not move together is most likely:',
      'Basis risk',
      'The elimination of all price risk, because any future on fuel is a perfect hedge',
      'Counterparty risk to the exchange clearinghouse only, with no residual price mismatch',
      'Basis is the difference between the price being hedged and the hedging instrument. Different grades, delivery locations, or maturities can move apart, so the hedge can gain less than the exposure loses. That residual is basis risk. Clearing reduces counterparty risk; it does not make an imperfect price link perfect.',
    ],
    [
      'hard',
      'An investor at Halcyon Instruments obtains equity-market exposure by buying equity futures instead of the shares. This synthetic exposure most likely:',
      'Requires less cash upfront than buying the shares, while still carrying market, basis, and roll risk',
      'Removes market risk, because a future is a hedge by definition',
      'Creates a credit-default swap on the index companies',
      'Long equity futures replicate a long market exposure with margin rather than the full share price. The investor still loses when the index falls. The hedge must be rolled when the contract expires, and the futures price can differ from the cash index by the basis. The position is not a credit-default swap, and being long the future is a view, not a hedge of a short exposure the investor does not have.',
    ],
  ])
}

function carry(): Draft[] {
  const plain = math.forwardPrice(64, 0.05, 0.75)
  const withDividend = math.forwardPrice(90, 0.04, 1, 2.25, 0)
  const commodity = math.forwardPrice(120, 0.03, 0.5, 1.5, 3.2)
  const fair = math.forwardPrice(75, 0.06, 1)
  const quoted = 82
  const arbitragePv = (quoted - fair) / 1.06
  return [
    ...rows('der-carry', [
      [
        'easy',
        'Two portfolios available to Dovetail Furniture have the same payoff on the same future date. Replication and the law of one price most likely imply that:',
        'The portfolios must have the same price today, or an arbitrage is available',
        'The portfolio with the higher expected return must cost more today even if the payoffs match in every state',
        'Prices can differ by any amount because expected returns are opinions',
        'If two sets of cash flows match in every state, they are the same claim. Selling the expensive one and buying the cheap one earns a positive cash amount today and nothing later, which is an arbitrage. Opinions about expected return do not set that no-arbitrage price. The forward price is built from this replication argument.',
      ],
      [
        'medium',
        'An analyst forecasts that the share price of Mossbank Textiles will be 10% higher in one year. The no-arbitrage forward price on that share, which pays no dividend, most likely:',
        'Equals the spot compounded at the risk-free rate, and need not equal the analyst forecast',
        'Equals the analyst forecast, because a forward is a market consensus expected price',
        'Equals the spot, because a fair forward never includes interest',
        'The forward price is the cost of buying the share with borrowed money and carrying it to the forward date. With no income, that is spot times one plus the risk-free rate raised to T. The analyst\'s expected future spot is an opinion and can differ from that carry price when investors require a risk premium. Interest is part of carry, so the forward is not the spot.',
      ],
      [
        'hard',
        'The quoted forward price on a non-dividend-paying asset is above the no-arbitrage forward price. The cash-and-carry arbitrage most likely consists of:',
        'Selling the forward, borrowing, and buying the underlying',
        'Buying the forward, shorting the underlying, and lending the proceeds',
        'Buying both the forward and the underlying with cash, so both sides gain if the quote is rich',
        'If the forward is too expensive, sell it and synthesize the long forward more cheaply: borrow, buy the asset, and carry it to delivery. At maturity the loan repayment is the fair forward, and the rich quoted forward produces a locked gain. The reverse trades, buying the forward and shorting the asset, are used when the quoted forward is too cheap.',
      ],
      [
        'medium',
        'A higher convenience yield on a commodity held by Nettle and Pine Packaging most likely:',
        'Lowers the forward price, because convenience yield is a benefit of holding the physical asset',
        'Raises the forward price, because every benefit of ownership is added to carry cost',
        'Leaves the forward price unchanged, because convenience yield is an expected-spot opinion',
        'Benefits of holding the underlying, including dividends, coupons, and convenience yield, are subtracted in present-value form inside the forward price. Storage and other costs are added. A larger convenience yield therefore reduces the no-arbitrage forward. It is a carry benefit, not a forecast of the future spot and not a cost.',
      ],
    ]),
    numQ(
      'der-carry',
      'easy',
      `A non-dividend-paying share of Halcyon Instruments is at 64. The risk-free rate is 5% and the forward matures in 0.75 years. The no-arbitrage forward price, ${inline(String.raw`F=S(1+r)^{T}`)}, is closest to:`,
      plain,
      [64, 64 * 1.05, 64 * (1 + 0.05 * 0.75)],
      px,
      (shown) =>
        `With no benefits and no costs, carry is just the risk-free financing of the spot. ${block(String.raw`F=64\times(1.05)^{0.75}=${num(plain, 4)}`)} ` +
        `Leaving the price at 64 ignores interest. Compounding for a full year, or using simple interest of 5% times 0.75, does not match the 0.75-year compound growth. The forward price is closest to ${shown}.`,
    ),
    numQ(
      'der-carry',
      'medium',
      `A share of Westmere Steel is at 90. The present value of dividends over the next year is 2.25, the risk-free rate is 4%, and the forward matures in one year. The forward price, ${inline(String.raw`F=(S-PV_{div})(1+r)^{T}`)}, is closest to:`,
      withDividend,
      [math.forwardPrice(90, 0.04, 1), math.forwardPrice(90, 0.04, 1, 0, 2.25), 90 - 2.25],
      px,
      (shown) =>
        `Dividends are a benefit the forward holder does not receive, so their present value is subtracted before the position is compounded. ${block(String.raw`F=(90-2.25)\times 1.04=${num(withDividend, 4)}`)} ` +
        `Compounding 90 with no dividend adjustment overstates the forward. Adding the dividend present value treats income as a storage cost. Subtracting the dividend and forgetting to compound stops at the prepaid forward. The forward price is closest to ${shown}.`,
    ),
    numQ(
      'der-carry',
      'hard',
      `A commodity used by Orchard and Anvil is at 120. Over a half-year forward, the present value of storage is 3.20 and the present value of convenience yield is 1.50. The risk-free rate is 3%. The forward price, ${inline(String.raw`F=(S-PV_b+PV_c)(1+r)^{T}`)}, is closest to:`,
      commodity,
      [math.forwardPrice(120, 0.03, 0.5), math.forwardPrice(120, 0.03, 0.5, 3.2, 1.5), 120 - 1.5 + 3.2],
      px,
      (shown) =>
        `Storage is a cost of holding the physical commodity and convenience yield is a benefit. ${block(String.raw`F=(120-1.50+3.20)\times(1.03)^{0.5}=${num(commodity, 4)}`)} ` +
        `The net carry addition is 1.70, and that prepaid forward is then compounded for half a year. Ignoring both adjustments, swapping the sign of storage and convenience, or forgetting to compound each produces a different price. The forward price is closest to ${shown}.`,
    ),
    numQ(
      'der-carry',
      'hard',
      `The no-arbitrage one-year forward on a non-dividend share at 75 is ${num(fair, 2)} when the risk-free rate is 6%. A dealer quotes 82. The arbitrage profit per share in today\'s money, ${inline(String.raw`\frac{82-F}{1.06}`)}, is closest to:`,
      arbitragePv,
      [quoted - fair, quoted - 75, fair - quoted],
      px,
      (shown) =>
        `The quoted forward is rich versus carry. Sell it, borrow 75, and buy the share. In one year the loan costs ${num(fair, 2)} and delivery under the forward receives 82, a locked 2.50. ${block(String.raw`PV=\frac{82-${num(fair, 2)}}{1.06}=${num(arbitragePv, 4)}`)} ` +
        `That present value is the arbitrage profit today. The undiscounted 2.50 is the future profit, and 82 minus 75 ignores financing. The present-value arbitrage profit is closest to ${shown}.`,
    ),
  ]
}

function forwards(): Draft[] {
  const contracted = math.forwardPrice(80, 0.04, 1)
  const valueUp = math.forwardValue(86, contracted, 0.04, 0.5)
  const valueDown = math.forwardValue(74, contracted, 0.04, 0.5)
  const atExpiry = math.forwardValue(91, contracted, 0.04, 0)
  const fairStart = math.forwardPrice(40, 0.03, 2)
  const valueStart = math.forwardValue(40, fairStart, 0.03, 2)
  const offMarket = math.forwardValue(50, 54, 0.05, 1)
  const later = math.forwardValue(102, 110, 0.06, 1.25)
  const shortValue = -valueUp
  return [
    ...rows('der-forwards', [
      [
        'easy',
        'A plain forward is entered at the no-arbitrage forward price. At that moment the value of the forward to the long is most likely:',
        'Zero, while the forward price itself is generally not zero',
        'Equal to the forward price, because price and value are the same word',
        'Equal to the spot price, because the long has effectively bought the asset',
        'The forward price is the delivery price that sets the contract value to zero. Price and value are different objects. After initiation, value moves as the spot moves, while the contracted forward price stays fixed. The long has not paid the spot and does not yet own the asset.',
      ],
      [
        'medium',
        'Ignoring negotiated collateral, the cash that changes hands at initiation of a plain at-market forward between Kestrel Aviation and a dealer is most likely:',
        'Zero, because the forward price is set so the contract value is zero',
        'The full spot price, paid by the long to the short',
        'The forward price, prepaid by the long',
        'An at-market forward has zero value, so neither side pays a premium for the contract. The spot is not paid until a physical delivery at maturity, and a cash-settled forward pays only the net amount at the end. Prepaying the forward price would be a different, prepaid forward with a positive initial cash flow.',
      ],
      [
        'easy',
        'At the expiration of a long forward with no remaining carry, the value to the long is most likely:',
        'The spot price minus the contracted forward price',
        'The contracted forward price minus the original spot',
        'Zero, because every forward value returns to zero at expiration',
        'When no time remains, discounting disappears and the long\'s value is S_T minus the delivery price F_0. That amount is zero only if the spot happens to equal the contracted forward. Futures are the contracts whose value is reset to zero by daily settlement; a forward\'s accumulated value is settled at the end.',
      ],
    ]),
    numQ(
      'der-forwards',
      'medium',
      `A non-dividend share forward was contracted at ${num(contracted, 2)}. Half a year remains, the risk-free rate is 4%, and the share is now 86. There is no remaining income. The long forward value, ${inline(String.raw`V=S-\frac{F_0}{(1+r)^{t}}`)}, is closest to:`,
      valueUp,
      [86 - contracted, contracted - 86, math.forwardPrice(86, 0.04, 0.5)],
      px,
      (shown) =>
        `With no remaining income, the long\'s value is the spot minus the present value of the price the long still has to pay. ${block(String.raw`V=86-\frac{${num(contracted, 2)}}{(1.04)^{0.5}}=${num(valueUp, 4)}`)} ` +
        `Subtracting the undiscounted forward price ignores half a year of interest. The new forward price for a fresh contract is not the value of the old one. The value to the long is closest to ${shown}.`,
    ),
    numQ(
      'der-forwards',
      'medium',
      `The same non-dividend forward was contracted at ${num(contracted, 2)}. Half a year remains, the risk-free rate is 4%, and the share has fallen to 74. The long forward value, ${inline(String.raw`V=74-\frac{${num(contracted, 2)}}{(1.04)^{0.5}}`)}, is closest to:`,
      valueDown,
      [74 - contracted, contracted - 74, math.forwardValue(74, contracted, 0.04, 1)],
      px,
      (shown) =>
        `The contracted price does not change when the spot falls. ${block(String.raw`V=74-\frac{${num(contracted, 2)}}{(1.04)^{0.5}}=${num(valueDown, 4)}`)} ` +
        `The present value of the delivery price is still above 74, so the long\'s value is negative. Using a full year of discounting, or subtracting the spot from the forward with no discounting, answers a different question. The value to the long is closest to ${shown}.`,
    ),
    numQ(
      'der-forwards',
      'easy',
      `A long forward contracted at ${num(contracted, 2)} expires today, and the underlying share is at 91. The value to the long, ${inline(String.raw`V_T=S_T-F_0`)}, is closest to:`,
      atExpiry,
      [91, contracted, 91 - 80],
      px,
      (shown) =>
        `At expiration the discount factor is one. ${block(String.raw`V_T=91-${num(contracted, 2)}=${num(atExpiry, 2)}`)} ` +
        `The long gains because the share is above the delivery price. The original spot of 80 is no longer the comparison, and the value is not the spot by itself. The expiration value is closest to ${shown}.`,
    ),
    numQ(
      'der-forwards',
      'medium',
      `A two-year forward on a non-dividend share at 40 is struck at the no-arbitrage price when the risk-free rate is 3%. The value to the long at initiation, ${inline(String.raw`V_0=S_0-\frac{F_0}{(1+r)^{2}}`)}, is closest to:`,
      Math.abs(valueStart) < 1e-8 ? 0 : valueStart,
      [fairStart - 40, 40 * 0.03 * 2, fairStart],
      px,
      (shown) =>
        `The no-arbitrage forward is spot compounded for two years, ${block(String.raw`F_0=40\times(1.03)^{2}=${num(fairStart, 4)}`)} ` +
        `Discounting that delivery price for two years returns exactly the spot, so ${inline(String.raw`V_0=40-\frac{${num(fairStart, 4)}}{(1.03)^{2}}=0`)}. The forward price is not the value. Interest over two years is not a fee paid to enter the contract. The initiation value is closest to ${shown}.`,
    ),
    numQ(
      'der-forwards',
      'hard',
      `A dealer requires Lowridge Cement to contract a one-year forward at 54 even though the non-dividend share is at 50 and the risk-free rate is 5%. The value of that off-market forward to the long at initiation, ${inline(String.raw`V=50-\frac{54}{1.05}`)}, is closest to:`,
      offMarket,
      [math.forwardPrice(50, 0.05, 1) - 54, 54 - 50, 50 - 54],
      px,
      (shown) =>
        `The fair forward is 50 times 1.05, or 52.50. Contracting to pay 54 makes the long overpay. ${block(String.raw`V_0=50-\frac{54}{1.05}=${num(offMarket, 4)}`)} ` +
        `The value is the present value of 52.50 minus 54, which is negative for the long. The undiscounted gap of 2.50, and the raw gap between 54 and 50, are not the present value of the mispricing. The off-market value is closest to ${shown}.`,
    ),
    numQ(
      'der-forwards',
      'hard',
      `A non-dividend forward was struck at 110. With 1.25 years left, the risk-free rate is 6% and the spot is 102. The long\'s value, ${inline(String.raw`V=102-\frac{110}{(1.06)^{1.25}}`)}, is closest to:`,
      later,
      [102 - 110, 110 - 102, math.forwardValue(102, 110, 0.06, 1)],
      px,
      (shown) =>
        `Discount the contracted forward price for the time that remains, then subtract it from the current spot. ${block(String.raw`V=102-\frac{110}{(1.06)^{1.25}}=${num(later, 4)}`)} ` +
        `There is no income to add. Using one year instead of 1.25 years changes the present value of 110. The raw difference between 102 and 110 ignores discounting. The long\'s value is closest to ${shown}.`,
    ),
    numQ(
      'der-forwards',
      'medium',
      `Half a year remains on a non-dividend forward contracted at ${num(contracted, 2)}. The rate is 4% and the spot is 86. The value to the short, ${inline(String.raw`V_{short}=-(S-\frac{F_0}{(1.04)^{0.5}})` )}, is closest to:`,
      shortValue,
      [valueUp, 86 - contracted, contracted],
      px,
      (shown) =>
        `The short has agreed to sell at the old forward price, so the short\'s value is minus the long\'s value. ${block(String.raw`V_{short}=-(86-\frac{${num(contracted, 2)}}{(1.04)^{0.5}})=${num(shortValue, 4)}`)} ` +
        `The spot is above the present value of the delivery price, which helps the long and hurts the short. Reporting the long\'s positive value with the wrong sign would reverse the position. The value to the short is closest to ${shown}.`,
    ),
  ]
}

function futures(): Draft[] {
  const variationPaid = (220 - 217) * 50 * 4
  return [
    ...rows('der-futures', [
      [
        'easy',
        'Variation margin on an exchange-traded future held by Tinderbox Media is most likely:',
        'The daily cash settlement of the mark-to-market gain or loss',
        'A premium paid once at initiation, equal to the futures price',
        'The interest rate that makes the futures price equal the spot',
        'Each day the futures price change is converted into cash. The gainer receives variation margin and the loser pays it, which resets the contract value toward zero. That cash is not an option premium and it is not the cost-of-carry rate. Initial margin is the separate performance bond posted to open the position.',
      ],
      [
        'hard',
        'Suppose interest rates tend to be high in the same states in which a futures price is high. Relative to an otherwise identical forward, the futures price most likely:',
        'Can exceed the forward price, because the long receives variation margin when reinvestment rates are high',
        'Must be below the forward price, because margin is always a cost to the long',
        'Equals the forward price, because daily settlement cannot affect a no-arbitrage price',
        'A long futures position receives cash when the futures price rises. If those are also the states with high interest rates, the cash can be reinvested at a high rate, and margin outflows occur when financing is cheap. That correlation makes long futures more attractive than a long forward, so the futures price can sit above the forward price. The signs reverse if the correlation is negative.',
      ],
      [
        'hard',
        'If the futures price of a contract used by Brightloom Components is negatively correlated with interest rates, the futures price most likely:',
        'Can lie below the otherwise identical forward price',
        'Must lie above the forward price for the same correlation reason as a positive link',
        'Is unrelated to the forward price, because correlation affects only option premiums',
        'Negative correlation means the long futures holder receives variation margin when rates are low and pays it when rates are high. That pattern is less attractive than a forward, which does not generate interim cash. The futures price can therefore be lower than the forward price. The positive-correlation result does not keep the same sign, and the effect is about forwards versus futures, not about option premiums.',
      ],
      [
        'medium',
        'Initial margin and maintenance margin on a futures account most likely differ because:',
        'Initial margin is posted to open the trade, and a balance below maintenance triggers a margin call',
        'Maintenance margin is paid to the issuer of the underlying, while initial margin is an option premium',
        'Both amounts are prepaid forwards and are never returned',
        'Initial margin is the performance bond required to establish the position. If mark-to-market losses pull the balance under the maintenance level, the holder must restore collateral, typically back to the initial level. Margin is not a payment to the underlying issuer and it is not a premium that buys an option. It remains collateral, subject to the clearing rules.',
      ],
      [
        'medium',
        'As a futures contract used by Sablemere Chemicals approaches expiration, the futures price most likely:',
        'Converges to the spot price of the deliverable, because carry time disappears',
        'Converges to the original forward price agreed on the first trade date',
        'Stays a fixed basis away from the spot, equal to the initial margin',
        'With no time left, financing, storage, and income no longer separate the futures price from the deliverable spot, so the basis goes to zero. The original trade price is history; daily settlement has already paid the path from that price. Initial margin is collateral, not a permanent wedge between futures and spot.',
      ],
    ]),
    numQ(
      'der-futures',
      'easy',
      `A trader at Mossbank Textiles is long 4 futures. The multiplier is 50. Yesterday\'s futures price was 220 and today\'s is 217. The variation margin the long must pay, ${inline(String.raw`(220-217)\times 50\times 4`)}, is closest to:`,
      variationPaid,
      [(220 - 217) * 50, (220 - 217) * 4, 217 * 4],
      cash,
      (shown) =>
        `The long loses when the futures price falls. ${block(String.raw`Payment=(220-217)\times 50\times 4=3\times 200=600`)} ` +
        `Forgetting the multiplier leaves 12, and forgetting the four contracts leaves 150. The payment is cash variation margin, not a new initial margin equal to the futures price. The amount the long pays is closest to ${shown}.`,
    ),
  ]
}

function swaps(): Draft[] {
  const receiptHigh = (0.034 - 0.028) * 20_000_000 * 0.5
  const receiptLow = (0.021 - 0.028) * 20_000_000 * 0.5
  const pvKnown = receiptHigh / Math.sqrt(1.05)
  const quarterly = (0.046 - 0.04) * 5_000_000 * 0.25
  return [
    ...rows('der-swaps', [
      [
        'easy',
        'At initiation, a par interest-rate swap of Nettle and Pine Packaging is struck at the current swap rate. The value of that swap is most likely:',
        'Zero to both parties, because the fixed rate equals the market swap rate',
        'Equal to the notional, paid by the fixed payer at initiation',
        'Equal to the present value of the floating leg only, with the fixed leg ignored',
        'A par swap sets the fixed rate so the present value of the fixed leg equals the present value of the floating leg. The net value is therefore zero at initiation, which is why no premium is paid. The notional is not exchanged on a plain interest-rate swap. Ignoring the fixed leg would leave a floating-rate note, not a swap.',
      ],
      [
        'medium',
        'After initiation, swap rates rise. The party that pays fixed and receives floating on an existing par swap most likely sees the swap value:',
        'Increase, because the party is paying a below-market fixed rate',
        'Decrease, because paying fixed is hurt whenever rates rise',
        'Stay at zero for the life of the swap, because a par swap never changes value',
        'The fixed rate on an existing swap does not reset. When the market swap rate rises, a promise to pay the old lower fixed rate becomes an asset to the fixed payer. Equivalently, the short fixed-rate bond in that package falls in value, which helps the party who is short it. The value is zero only at the par start, not forever.',
      ],
      [
        'medium',
        'The pay-fixed side of a plain interest-rate swap is most likely replicated by:',
        'A long floating-rate note and a short fixed-rate bond',
        'A long fixed-rate bond and a short floating-rate note',
        'A long call and a short call with the same strike',
        'Receiving floating is like owning a floating-rate note, and paying fixed is like being short a fixed-rate bond. At initiation both are at par, so the package is worth zero, matching a par swap. The opposite package is the receive-fixed side. Two calls with the same strike net to nothing and do not create interest payments.',
      ],
      [
        'hard',
        'A plain interest-rate swap can be viewed as a package of forward-rate agreements. That description is most accurate because:',
        'Each settlement date pays the difference between the reference rate and the fixed rate on the notional',
        'Each settlement date gives the fixed payer an option to cancel that period',
        'The notional is delivered at every settlement date like a chain of currency forwards',
        'On each date the net interest is (reference rate minus fixed rate) times notional times the year fraction, which is the payoff of an FRA for that period. The parties are obligated; they cannot skip a date. A plain interest-rate swap does not deliver the notional on each date. The package of those obligatory rate forwards is the swap.',
      ],
      [
        'easy',
        'On a plain single-currency interest-rate swap, the notional principal is most likely:',
        'Used to compute interest and not exchanged',
        'Exchanged at initiation and again at maturity in two different currencies',
        'Paid in full by the floating payer at every reset date',
        'The notional scales the interest payments and cancels out of a net settlement. It is not paid back and forth in a single-currency interest-rate swap. Exchanging different currency principals at both ends is the usual currency-swap structure. The floating payer does not repay the notional on each reset.',
      ],
      [
        'hard',
        'A currency swap that converts a foreign-currency liability of Meridian Development Bank into a domestic-currency liability most likely differs from a plain interest-rate swap because:',
        'The two notionals are exchanged at initiation and at maturity',
        'No interest payments are made, only the notionals',
        'The swap value must stay positive for both parties after initiation',
        'Because the principals are in different currencies, they do not net. The parties typically exchange notionals at the start and re-exchange them at the end, and they pay interest in the currency they receive. Interest is still paid. As rates and the spot FX rate move, the value moves away from zero and cannot be positive for both sides at once.',
      ],
    ]),
    numQ(
      'der-swaps',
      'easy',
      `A pay-fixed swap on a notional of 20,000,000 has a fixed rate of 2.80%. The reference rate for the period is 3.40%, and the year fraction is 0.50. The net receipt of the fixed payer, ${inline(String.raw`(r_{ref}-r_{fix})\times N\times\tau`)}, is closest to:`,
      receiptHigh,
      [(0.034 - 0.028) * 20_000_000, (0.028 - 0.034) * 20_000_000 * 0.5, 0.034 * 20_000_000 * 0.5],
      cash,
      (shown) =>
        `The fixed payer receives the reference rate and pays the fixed rate, so the net receipt is positive when the reference rate is higher. ${block(String.raw`(0.034-0.028)\times 20{,}000{,}000\times 0.50=60{,}000`)} ` +
        `Dropping the year fraction doubles the payment. Reversing the rate gap computes the receipt of the floating payer. The full floating coupon is not the net swap payment. The fixed payer\'s net receipt is closest to ${shown}.`,
    ),
    numQ(
      'der-swaps',
      'medium',
      `The same 20,000,000 pay-fixed swap has a fixed rate of 2.80% and a year fraction of 0.50, but the reference rate is 2.10%. The net receipt of the fixed payer, ${inline(String.raw`(0.021-0.028)\times 20{,}000{,}000\times 0.50`)}, is closest to:`,
      receiptLow,
      [(0.028 - 0.021) * 20_000_000 * 0.5, (0.021 - 0.028) * 20_000_000, 0],
      cash,
      (shown) =>
        `The reference rate is below the fixed rate, so the fixed payer\'s net receipt is negative, meaning that party pays. ${block(String.raw`(0.021-0.028)\times 20{,}000{,}000\times 0.50=-70{,}000`)} ` +
        `The absolute amount is 70,000, but the sign for the fixed payer is negative. Omitting the year fraction, or reporting zero because the swap started at par, misses this period\'s settlement. The net receipt is closest to ${shown}.`,
    ),
    numQ(
      'der-swaps',
      'hard',
      `The next net receipt on a pay-fixed swap is already set at 60,000 and will be paid in 0.50 years. The annual discount rate is 5%. The present value of that known receipt, ${inline(String.raw`PV=\frac{60000}{(1.05)^{0.5}}`)}, is closest to:`,
      pvKnown,
      [receiptHigh, receiptHigh / 1.05, receiptHigh * 1.05 ** 0.5],
      cash,
      (shown) =>
        `Once the reference rate is set, the coming net payment is a fixed cash flow. Discount it for the half year until it is paid. ${block(String.raw`PV=\frac{60{,}000}{(1.05)^{0.5}}=${num(pvKnown, 4)}`)} ` +
        `Leaving it undiscounted ignores time value. Discounting for a full year uses the wrong waiting time. Compounding the receipt forward would move it the wrong direction in time. The present value is closest to ${shown}.`,
    ),
    numQ(
      'der-swaps',
      'medium',
      `A pay-fixed swap has a notional of 5,000,000, a fixed rate of 4.00%, and a reference rate of 4.60% for a quarter with year fraction 0.25. The fixed payer\'s net receipt, ${inline(String.raw`(0.046-0.040)\times 5{,}000{,}000\times 0.25`)}, is closest to:`,
      quarterly,
      [(0.046 - 0.04) * 5_000_000, (0.046 - 0.04) * 5_000_000 * 0.5, (0.04 - 0.046) * 5_000_000 * 0.25],
      cash,
      (shown) =>
        `Apply the rate gap to the notional and the quarterly year fraction. ${block(String.raw`(0.046-0.040)\times 5{,}000{,}000\times 0.25=7{,}500`)} ` +
        `Using a half-year fraction, or forgetting the fraction, overstates the quarter\'s net payment. The floating payer\'s receipt has the opposite sign. The fixed payer\'s net receipt is closest to ${shown}.`,
    ),
  ]
}

function options(): Draft[] {
  const callExercise = math.callExercise(78, 70)
  const timeValue = 11 - callExercise
  const putExercise = math.putExercise(42, 50)
  const lowerBound = Math.max(50 - 48 / 1.06, 0)
  return [
    ...rows('der-options', [
      [
        'easy',
        'A call on Dovetail Furniture with a strike of 40 is priced while the share is at 46. The call\'s moneyness is most likely:',
        'In the money, because the share price is above the strike',
        'Out of the money, because calls are in the money when the share is below the strike',
        'At the money, because the premium has not been subtracted from the share price',
        'A call is in the money when the underlying price exceeds the strike, at the money when they are equal, and out of the money when the share is below the strike. A put uses the opposite comparison. The premium affects profit and time value; it is not part of the moneyness test.',
      ],
      [
        'medium',
        'All else equal, an increase in the expected volatility of Redcedar Paper shares most likely:',
        'Raises both the call value and the put value',
        'Raises the call value and lowers the put value',
        'Lowers both values, because volatility is a cost of carry',
        'A long option benefits from a wider distribution of the underlying. The call gains from the extra upside and can expire unused on the downside. The put gains from the extra downside and can expire unused on the upside. Higher volatility is not a carry cost, and it does not push the two premiums in opposite directions.',
      ],
      [
        'medium',
        'All else equal, a higher spot price of Vellum Rail shares most likely:',
        'Raises call values and lowers put values',
        'Raises both call values and put values',
        'Lowers call values and raises put values',
        'A call finishes further in the money when the spot rises, so its value rises. A put finishes further out of the money, so its value falls. This is the sign of delta: positive for a long call and negative for a long put. Volatility, not the spot move, is what lifts both premiums together.',
      ],
      [
        'hard',
        'All else equal, a larger dividend on the underlying shares most likely has which effect on European option values?',
        'It lowers the call and raises the put, because the dividend is a benefit of holding the shares rather than the call',
        'It raises the call and lowers the put, because income makes the shares more volatile',
        'It leaves both unchanged, because dividends are paid to option holders',
        'Dividends and other benefits of the underlying reduce the forward price. A lower forward hurts the call and helps the put. Option holders do not receive the dividend unless they own the shares, which is why early exercise of an American call can become rational just before a large dividend. The dividend is not a volatility input.',
      ],
      [
        'hard',
        'A deep in-the-money European put on a non-dividend-paying share can be worth less when expiration is further away. That exception most likely exists because:',
        'The holder must wait longer to receive the strike and cannot exercise early',
        'Time value is required to be negative for every European call as well',
        'Put-call parity forces every longer-dated put to have a lower premium than the stock price',
        'A deep European put is almost a claim to the strike. Delaying expiration delays that cash, and the European holder cannot force early payment. Extra volatility may not be enough to offset the delay, so a longer maturity can reduce the put value. European calls on non-dividend shares do not share this exception. Parity does not say that every longer put is worth less than the share.',
      ],
      [
        'medium',
        'The delta of a long put and the delta of a long call on the same share most likely have which signs?',
        'The call delta is positive and the put delta is negative',
        'Both deltas are positive',
        'Both deltas are negative',
        'Delta is the change in the option value for a small increase in the underlying. A long call rises with the share, so its delta lies between 0 and 1. A long put falls as the share rises, so its delta lies between -1 and 0. Vega, not delta, is positive for both long options when volatility rises.',
      ],
    ]),
    numQ(
      'der-options',
      'easy',
      `A call on Larkspur Foods has a strike of 70 and the share is at 78. The exercise value, ${inline(String.raw`\max(S-X,0)`)}, is closest to:`,
      callExercise,
      [0, 78, 70],
      px,
      (shown) =>
        `Exercise value, or intrinsic value, of a call is the greater of spot minus strike and zero. ${block(String.raw`\max(78-70,0)=8`)} ` +
        `It cannot be the whole share price, and it is not zero when the call is in the money. The premium is not subtracted inside the exercise value; any excess of the premium over 8 is time value. The exercise value is closest to ${shown}.`,
    ),
    numQ(
      'der-options',
      'medium',
      `The same Larkspur Foods call has an exercise value of ${num(callExercise, 2)} and a premium of 11. Time value, ${inline(String.raw`Premium-\max(S-X,0)`)}, is closest to:`,
      timeValue,
      [11, callExercise, 11 + callExercise],
      px,
      (shown) =>
        `The premium splits into exercise value and time value. ${block(String.raw`Time=11-8=3`)} ` +
        `Before expiration an in-the-money option premium is usually above intrinsic value, and that gap is time value. Reporting the whole premium, or adding intrinsic value to the premium, does not isolate the gap. Time value is closest to ${shown}.`,
    ),
    numQ(
      'der-options',
      'easy',
      `A put on Cinderwell Utilities has a strike of 50 and the share is at 42. The exercise value, ${inline(String.raw`\max(X-S,0)`)}, is closest to:`,
      putExercise,
      [0, 42, 50],
      px,
      (shown) =>
        `A put\'s exercise value is the greater of strike minus spot and zero. ${block(String.raw`\max(50-42,0)=8`)} ` +
        `The put is in the money by 8. The exercise value is not the share price and not the strike. As with a call, exercise value is not reduced by the premium. The exercise value is closest to ${shown}.`,
    ),
    numQ(
      'der-options',
      'hard',
      `A European call on a non-dividend share has a strike of 48, the share is at 50, the risk-free rate is 6%, and one year remains. The lower bound, ${inline(String.raw`\max(S-\frac{X}{1+r},0)`)}, is closest to:`,
      lowerBound,
      [Math.max(50 - 48, 0), 50 - 48 * 1.06, 0],
      px,
      (shown) =>
        `A European call on a non-dividend share is worth at least the spot minus the present value of the strike, and not less than zero. ${block(String.raw`\max\left(50-\frac{48}{1.06},0\right)=${num(lowerBound, 4)}`)} ` +
        `Using the undiscounted strike gives a lower intrinsic-style number that is not the European bound. Compounding the strike upward moves it the wrong way. A bound of zero is true but weaker than the carry bound when the call is in the money on a forward basis. The lower bound is closest to ${shown}.`,
    ),
  ]
}

function parity(): Draft[] {
  const callFromPut = math.putCallParityCall(4.5, 60, 60, 0.05, 1)
  const callSecond = math.putCallParityCall(2, 40, 42, 0.03, 0.5)
  const putFromCall = 3 - 40 + 45 / 1.05
  const marketCall = 9
  const richBy = marketCall - callFromPut
  return [
    ...rows('der-parity', [
      [
        'medium',
        'For European options on a non-dividend-paying share, put-call parity says a fiduciary call matches a protective put. That equality is most likely:',
        'Call plus the present value of the strike equals put plus the share',
        'Call plus the share equals put plus the undiscounted strike',
        'Call plus put equals the share, for any strike and any rate',
        'The fiduciary call is a call plus cash equal to the present value of the strike. The protective put is a put plus the share. They have the same expiration payoff, so c + PV(X) = p + S. The strike must be discounted. Adding the call and the put does not recover the share unless the rest of the parity terms happen to vanish.',
      ],
      [
        'hard',
        'Put-call-forward parity most likely rewrites the share in the parity relation as:',
        'The present value of the forward price',
        'The undiscounted forward price',
        'The strike, because a forward price equals the strike by definition',
        'Because a prepaid forward equals the present value of the forward price, and that prepaid forward equals the share when the share pays no income, c + PV(X) = p + PV(F). Using the raw forward price would double-count growth to the forward date. The forward price equals the strike only for an at-the-money forward, not in general.',
      ],
    ]),
    numQ(
      'der-parity',
      'medium',
      `A European put is priced at 4.50. The non-dividend share is at 60, the strike is 60, the risk-free rate is 5%, and one year remains. The parity price of the call, ${inline(String.raw`c=p+S-\frac{X}{1+r}`)}, is closest to:`,
      callFromPut,
      [4.5, 4.5 + 60 - 60, 4.5 + 60 - 60 * 1.05],
      px,
      (shown) =>
        `Solve parity for the call. ${block(String.raw`c=4.50+60-\frac{60}{1.05}=${num(callFromPut, 4)}`)} ` +
        `The present value of the strike is ${num(60 / 1.05, 4)}, not 60 and not 60 compounded forward. Dropping the put or failing to discount the strike breaks the identity c + PV(X) = p + S. The parity call price is closest to ${shown}.`,
    ),
    numQ(
      'der-parity',
      'hard',
      `A European put is priced at 2. The non-dividend share is at 40, the strike is 42, the risk-free rate is 3%, and half a year remains. The parity call price, ${inline(String.raw`c=2+40-\frac{42}{(1.03)^{0.5}}`)}, is closest to:`,
      callSecond,
      [2 + 40 - 42, 2 + 40 - 42 / 1.03, math.putCallParityCall(2, 40, 42, 0.03, 1)],
      px,
      (shown) =>
        `Discount the strike for half a year, not for a full year. ${block(String.raw`c=2+40-\frac{42}{(1.03)^{0.5}}=${num(callSecond, 4)}`)} ` +
        `Subtracting the raw strike ignores interest. Discounting for a full year overstates the present-value benefit of delaying the strike. The parity relation still reads call plus PV(strike) equals put plus spot. The call price is closest to ${shown}.`,
    ),
    numQ(
      'der-parity',
      'medium',
      `A European call on a non-dividend share is priced at 3 by parity inputs that are: share 40, strike 45, risk-free rate 5%, and one year to expiration. The parity put price, ${inline(String.raw`p=c-S+\frac{X}{1+r}`)}, is closest to:`,
      putFromCall,
      [3 - 40 + 45, 3 + 40 - 45 / 1.05, 45 / 1.05],
      px,
      (shown) =>
        `Rearrange c + PV(X) = p + S into the put. ${block(String.raw`p=3-40+\frac{45}{1.05}=${num(putFromCall, 4)}`)} ` +
        `The present value of 45 is greater than the share minus the call, so the put has a positive price. Using the undiscounted strike, or solving for the call again, does not give the put. The parity put price is closest to ${shown}.`,
    ),
    numQ(
      'der-parity',
      'hard',
      `Using the parity inputs of a 4.50 put, a share at 60, a strike of 60, a 5% rate, and one year, the no-arbitrage call is ${num(callFromPut, 4)}. A dealer quotes the call at 9. The amount by which the call is rich, ${inline(String.raw`9-c_{parity}`)}, is closest to:`,
      richBy,
      [marketCall - 4.5, callFromPut, marketCall - 60],
      px,
      (shown) =>
        `The arbitrage gap is the quoted call minus the parity call. ${block(String.raw`9-${num(callFromPut, 4)}=${num(richBy, 4)}`)} ` +
        `Sell the rich call and buy the synthetic call: buy the put, buy the share, and borrow the present value of the strike. The initial cash inflow equals this gap, and the expiration payoffs cancel. Comparing the call with the put alone, or with the share, is not the parity residual. The call is rich by an amount closest to ${shown}.`,
    ),
  ]
}

function binomial(): Draft[] {
  const callTree = math.onePeriodBinomial(100, 1.2, 0.85, 0.04, 100, 'call')
  const putTree = math.onePeriodBinomial(50, 1.25, 0.8, 0.02, 52, 'put')
  const su = 100 * 1.2
  const sd = 100 * 0.85
  return [
    ...rows('der-binomial', [
      [
        'medium',
        'In a one-period binomial model, the risk-neutral probability of the up move is most likely:',
        'The weight that makes the underlying grow at the risk-free rate, not the investor\'s forecast',
        'The investor\'s real-world probability that the up move occurs',
        'Always equal to one-half, regardless of the multipliers and the interest rate',
        'The risk-neutral probability is (1 + r - d) / (u - d). It is solved so that a portfolio of the underlying matches risk-free growth. It is not elicited from an opinion about how likely the up move is, and it equals one-half only for particular multipliers and rates. The option is then discounted at the risk-free rate using this weight.',
      ],
      [
        'hard',
        'The hedge ratio in a one-period binomial model is most likely used to:',
        'Build a portfolio of the underlying and the option that earns the risk-free rate',
        'Replace the risk-free rate with the investor\'s required return when discounting the option',
        'Set the up multiplier equal to the down multiplier',
        'The hedge ratio is the change in option value divided by the change in the underlying. Holding that many shares against one written option, or the reverse, cancels the up and down outcomes. The hedged portfolio therefore earns the risk-free rate, which is why the discount rate is the risk-free rate. The multipliers are inputs, not something the hedge ratio sets equal.',
      ],
    ]),
    numQ(
      'der-binomial',
      'medium',
      `A one-period call has spot 100, an up multiplier of 1.20, a down multiplier of 0.85, a period risk-free rate of 4%, and a strike of 100. The call price, ${inline(String.raw`c=\frac{\pi c_u+(1-\pi)c_d}{1+r}`)}, is closest to:`,
      callTree.price,
      [callTree.upPayoff, callTree.hedgeRatio * 100, (callTree.upPayoff + callTree.downPayoff) / 2 / 1.04],
      px,
      (shown) =>
        `The up share price is 120 and the down share price is 85, so the call payoffs are 20 and 0. ${block(String.raw`\pi=\frac{1.04-0.85}{1.20-0.85}=${num(callTree.riskNeutralProbability, 4)}`)} ` +
        `${block(String.raw`c=\frac{${num(callTree.riskNeutralProbability, 4)}\times 20}{1.04}=${num(callTree.price, 4)}`)} ` +
        `The up payoff is not the premium. An equal-weighted average would replace the risk-neutral weight with one-half. The call price is closest to ${shown}.`,
    ),
    numQ(
      'der-binomial',
      'hard',
      `A one-period put has spot 50, an up multiplier of 1.25, a down multiplier of 0.80, a period rate of 2%, and a strike of 52. The put price, ${inline(String.raw`p=\frac{\pi p_u+(1-\pi)p_d}{1+r}`)}, is closest to:`,
      putTree.price,
      [putTree.downPayoff, Math.abs(putTree.hedgeRatio) * 50, putTree.riskNeutralProbability],
      px,
      (shown) => {
        const pu = math.putExercise(50 * 1.25, 52)
        const pd = math.putExercise(50 * 0.8, 52)
        return (
          `The up price is 62.50 and the down price is 40. The put payoffs are ${num(pu, 2)} and ${num(pd, 2)}. ` +
          `${block(String.raw`\pi=\frac{1.02-0.80}{1.25-0.80}=${num(putTree.riskNeutralProbability, 4)}`)} ` +
          `${block(String.raw`p=\frac{${num(putTree.riskNeutralProbability, 4)}\times ${num(pu, 2)}+${num(1 - putTree.riskNeutralProbability, 4)}\times ${num(pd, 2)}}{1.02}=${num(putTree.price, 4)}`)} ` +
          `Discounting at the risk-free rate, not at a risk-adjusted equity rate, is part of the model. The down payoff and the hedge ratio are inputs to the replication, not the put premium. The put price is closest to ${shown}.`
        )
      },
    ),
    numQ(
      'der-binomial',
      'medium',
      `For the call with spot 100, up multiplier 1.20, down multiplier 0.85, and strike 100, the hedge ratio ${inline(String.raw`h=\frac{c_u-c_d}{S(u-d)}`)} is closest to:`,
      callTree.hedgeRatio,
      [callTree.riskNeutralProbability, 1, callTree.upPayoff / su],
      prob,
      (shown) =>
        `The call goes from 20 in the up state to 0 in the down state, while the share goes from ${num(su, 2)} to ${num(sd, 2)}. ${block(String.raw`h=\frac{20-0}{120-85}=${num(callTree.hedgeRatio, 4)}`)} ` +
        `A hedge ratio between 0 and 1 is a long fraction of a share against a short call. The risk-neutral probability is a different output of the same tree. The hedge ratio is closest to ${shown}.`,
    ),
    numQ(
      'der-binomial',
      'hard',
      `Using spot 100, up multiplier 1.20, down multiplier 0.85, and a period rate of 4%, the risk-neutral probability of the up move, ${inline(String.raw`\pi=\frac{1+r-d}{u-d}`)}, is closest to:`,
      callTree.riskNeutralProbability,
      [callTree.hedgeRatio, 0.5, (1.2 - 1.04) / (1.2 - 0.85)],
      prob,
      (shown) =>
        `Choose the probability that forces the share to earn the risk-free rate. ${block(String.raw`\pi=\frac{1.04-0.85}{1.20-0.85}=\frac{0.19}{0.35}=${num(callTree.riskNeutralProbability, 4)}`)} ` +
        `Check: ${num(callTree.riskNeutralProbability, 4)} times 120 plus the complementary weight times 85, all divided by 1.04, returns the spot of 100. One-half is not implied by these multipliers. The hedge ratio uses payoffs, not this probability. The risk-neutral probability is closest to ${shown}.`,
    ),
  ]
}

export function buildDerivatives(): Draft[] {
  return [
    ...exactly('der-features', 6, features()),
    ...exactly('der-instruments', 12, instruments()),
    ...exactly('der-uses', 6, uses()),
    ...exactly('der-carry', 8, carry()),
    ...exactly('der-forwards', 10, forwards()),
    ...exactly('der-futures', 6, futures()),
    ...exactly('der-swaps', 10, swaps()),
    ...exactly('der-options', 10, options()),
    ...exactly('der-parity', 6, parity()),
    ...exactly('der-binomial', 6, binomial()),
  ]
}

function main(): void {
  const drafts = buildDerivatives()
  const questions = finalizeTopic('derivatives', drafts)
  const levels = new Set(drafts.map((draft) => draft.difficulty))
  if (levels.size !== 3) throw new Error('derivatives difficulty mix is incomplete')
  if (questions.length !== 80) throw new Error(`derivatives length ${questions.length}`)
  console.log(`ok ${questions.length}`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
