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
  return vet(q('equity', losId, difficulty, stem, correct, wrong1, wrong2, explanation))
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
      topicId: 'equity',
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

function times(value: number): string {
  return `${num(value, 2)} times`
}

function countText(value: number, label: string): string {
  return `${Math.round(value).toLocaleString('en-US')} ${label}`
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

function markets(): Draft[] {
  const cashRequired = 200 * 45 * 0.4
  const longTrigger = math.marginCallPriceLong(64, 0.5, 0.25)
  const longAsShort = math.marginCallPriceShort(64, 0.5, 0.25)
  const shortTrigger = math.marginCallPriceShort(40, 0.4, 0.25)
  const shortAsLong = math.marginCallPriceLong(40, 0.4, 0.25)
  const levered = math.leveragedLongReturn(80, 92, 0.4, 1)
  const unlevered = math.hpr(80, 92, 1)
  const priceOnlyEquity = (92 - 80) / (80 * 0.4)
  const stillSafe = math.marginCallPriceLong(50, 0.4, 0.25)
  return [
    ask(
      'eq-markets',
      'easy',
      'Calder Rail sells new common shares to the public, and the cash proceeds go to Calder. The next day an investor who bought those shares sells them to another investor on the exchange. Which statement is most accurate?',
      'The first sale is a primary-market transaction. The later trade between investors is a secondary-market transaction and does not raise cash for Calder.',
      'Both sales are primary-market transactions, because the shares were issued by a public company.',
      'The first sale is secondary, because the exchange is involved, and the later trade is primary because it sets the market price.',
      'A primary market is where the issuer receives capital: an IPO or a seasoned offering. A secondary market is where investors trade existing shares with each other. The issuer does not receive the proceeds of that second trade. Calling every public-company trade primary misses the distinction the cash flow depends on.',
    ),
    ask(
      'eq-markets',
      'easy',
      'An investor in Moth & Pine Outfitters wants a definition of the intermediary that will handle the order. Which distinction is most accurate?',
      'A broker finds the other side as an agent and earns a commission. A dealer trades from inventory and earns the bid-ask spread.',
      'A broker buys shares into its own inventory, and a dealer is prohibited from holding inventory.',
      'Brokers and dealers are the same role. The only difference is whether the market is open that day.',
      'A broker acts for the customer and is paid a commission. A dealer is a principal: it quotes a bid and an ask and holds inventory, so its compensation is the spread. A firm can do both, but the two roles allocate the risk differently. The dealer takes inventory risk. The broker, acting only as agent, does not.',
    ),
    ask(
      'eq-markets',
      'easy',
      'Juniper Pay is quoted at a bid of 28 and an ask of 28.10. An investor submits a market order to buy. Which description of that order is most accurate?',
      'It seeks immediate execution at the best available price, so the buy is expected to pay the ask, and the execution price is not guaranteed.',
      'It guarantees a purchase at 28, because a market buy always trades at the bid.',
      'It rests in the book until the price falls below 28, because a market order is a type of limit order.',
      'A market order trades price certainty for speed. A buy lifts the ask if the quote is still there, but the price can move before the order arrives. It does not guarantee the bid, and it does not wait for a lower limit. The bid-ask spread is part of the cost of insisting on immediacy.',
    ),
    ask(
      'eq-markets',
      'medium',
      'An investor who is long Southwharf Logistics places a stop-sell order with a trigger below the current price. What is that order designed to do, and what risk remains?',
      'It is meant to sell once the price falls to the trigger, limiting further losses on the long. The fill can be worse than the trigger if the price gaps through it.',
      'It guarantees a sale at the trigger price, because a stop order becomes a limit order at that exact price.',
      'It buys more shares when the price falls, so the position’s average cost declines.',
      'A stop-sell on a long position becomes a market sell when the trigger is touched. That is a defensive order, not an order to add shares. Because it becomes a market order, the execution price is not guaranteed. In a gap down, the sale can print well below the trigger. A stop-limit would add a limit price, and then the risk is that the order does not fill at all.',
    ),
    ask(
      'eq-markets',
      'medium',
      'A hedge fund borrows shares of Bellwether Clinics, sells them at 40, and plans to buy them back later. The shares pay a dividend while the short is open. Which description is most accurate?',
      'The short profits if the share price falls. While the short is open, the short seller owes the dividend to the share lender.',
      'The short profits if the share price rises, and the dividend is paid to the short seller.',
      'A short sale uses no margin, because the sale generates cash that belongs to the short seller with no collateral requirement.',
      'Selling borrowed shares profits when the repurchase price is lower. The cash from the sale is not free and clear: initial margin is posted, and maintenance margin still applies if the price rises. Dividends declared during the short belong economically to the lender, so the short seller pays them. A rising price hurts the short, which is why the maintenance trigger is above the sale price.',
    ),
    ask(
      'eq-markets',
      'medium',
      'Arroyo Solar Glass trades on an exchange with a public limit-order book. A different security trades only when dealers quote bids and offers. Which market-structure contrast is most accurate?',
      'The exchange is order-driven: customer orders are matched with other orders. The dealer market is quote-driven: intermediaries provide the bid and the ask.',
      'Both structures are quote-driven, because every trade has a price.',
      'The dealer market is order-driven, and the exchange is a call auction that can never trade continuously.',
      'In an order-driven market, liquidity comes from the orders themselves, often displayed in a book and matched continuously or in a call. In a quote-driven market, dealers supply liquidity by quoting both sides. A market can combine the two, but the source of the quote is the distinction. A continuous exchange is not forced to be a single call auction.',
    ),
    ask(
      'eq-markets',
      'easy',
      'Kindling Software shares trade on an exchange that uses a clearinghouse. What does the clearinghouse change about counterparty risk?',
      'It becomes the buyer to every seller and the seller to every buyer, and it manages margin so each trader’s exposure is to the clearinghouse rather than to the other trader.',
      'It guarantees the issuer’s operating profit, so the shares cannot fall below the offer price.',
      'It removes the need for margin, because clearing means every trade settles a year later.',
      'Novation puts the clearinghouse in the middle of exchange trades. Margin, and the clearinghouse’s default fund, are what make that promise credible. The clearinghouse does not guarantee the company’s earnings or the share price. Futures and exchange equity trades still settle on a short cycle; clearing is not a reason to drop margin.',
    ),
    ask(
      'eq-markets',
      'medium',
      'A trader at Harbor & Holt Mutual enters an order that must execute in full immediately or be cancelled, and a second order that may execute in part immediately with the rest cancelled. Which labels match?',
      'The all-or-nothing immediate order is fill-or-kill. The partial-fill immediate order is immediate-or-cancel.',
      'The all-or-nothing order is a day order, and the partial order is good-till-cancelled.',
      'Both orders are stop orders, and the difference is only the trigger price.',
      'Time-in-force instructions are separate from the price instruction. Fill-or-kill dies unless the entire size prints immediately. Immediate-or-cancel takes whatever size is available now and cancels the residual. A day order can rest until the close. Good-till-cancelled can rest across days. A stop is a trigger, not a description of partial fills.',
    ),
    ask(
      'eq-markets',
      'easy',
      'Glassorchard Foods is quoted 18.00 bid and 18.08 ask. An investor buys at the market and later sells at the market, and the quote never changes. Ignoring commissions, what does the round trip cost?',
      'The bid-ask spread, 0.08 per share, because the buy pays the ask and the sell receives the bid.',
      'Nothing, because a market quote is a free public good and both trades occur at 18.00.',
      '0.08 plus the full share price, because the spread is charged on top of paying both the bid and the ask.',
      'A market buy lifts the ask and a market sell hits the bid. If the quote is unchanged, the investor buys at 18.08 and sells at 18.00, so 0.08 of the round trip is the spread. That is a transaction cost even when the midpoint never moves. The investor does not pay the spread in addition to paying both sides in full; the two execution prices already embed it.',
    ),
    ask(
      'eq-markets',
      'hard',
      'An investor buys Larchmont Sensors on 40% initial margin. The share price falls 15% and there is no dividend. Which statement about the equity return is most accurate?',
      'The loss on the investor’s equity is larger than 15%, because the loss is measured against the margin deposit rather than against the full share price.',
      'The loss on equity equals 15%, because margin changes only the initial cash outlay and not the return.',
      'The loss on equity is smaller than 15%, because the broker absorbs the borrowed portion of the decline.',
      'With 40% margin the investor’s equity is 40% of the starting price, but the price decline hits the full position. A 15% price drop is 15/40 = 37.5% of the equity before any interest on the margin loan. Leverage amplifies losses as well as gains. The broker does not absorb the borrowed portion; the loan stays outstanding and the equity absorbs the price move first.',
    ),
    numQ(
      'eq-markets',
      'easy',
      `Pewterline Shipping is purchased at ${usd(45, 2)} a share. The investor buys 200 shares with an initial margin requirement of 40%. The cash the investor must deposit is closest to ${inline(String.raw`200 \times 45 \times 0.40`)}.`,
      cashRequired,
      [200 * 45, 200 * 45 * 0.6],
      (value) => usd(value, 0),
      (formatted) =>
        `Initial margin is the equity the buyer posts at the trade. ${inline(String.raw`200 \times 45 \times 0.40`)} equals ${formatted}. The other 60% is borrowed. Paying the full ${usd(9_000, 0)} would be an unlevered purchase. Posting only the borrowed amount reverses which side of the trade is the investor’s capital.`,
    ),
    numQ(
      'eq-markets',
      'medium',
      `Quaypoint Engineering is bought at ${usd(64, 0)} with 50% initial margin and 25% maintenance margin. The long margin-call price is closest to ${inline(String.raw`64 \times \frac{1-0.50}{1-0.25}`)}.`,
      longTrigger,
      [longAsShort, 64 * (1 - 0.25)],
      (value) => usd(value, 2),
      (formatted) =>
        `A long margin call is triggered when the price falls to ${inline(String.raw`P_0\times\frac{1-\text{initial}}{1-\text{maintenance}}`)}. That price is ${formatted}. The short-sale formula uses one plus the margins and produces a trigger above the purchase price, which is the wrong direction for a long. Multiplying by one minus maintenance alone ignores how much was borrowed.`,
    ),
    numQ(
      'eq-markets',
      'medium',
      `A trader shorts Frostline Apparel at ${usd(40, 0)}. Initial margin is 40% and maintenance margin is 25%. The short margin-call price is closest to ${inline(String.raw`40 \times \frac{1+0.40}{1+0.25}`)}.`,
      shortTrigger,
      [shortAsLong, 40 * (1 + 0.4)],
      (value) => usd(value, 2),
      (formatted) =>
        `A short loses money when the price rises. The trigger is ${inline(String.raw`P_0\times\frac{1+\text{initial}}{1+\text{maintenance}}`)}, which equals ${formatted}. Using the long formula produces a price below the sale, which would be a profit for the short, not a margin call. One plus the initial margin, without dividing by one plus maintenance, overstates the trigger.`,
    ),
    numQ(
      'eq-markets',
      'hard',
      `Amberlane Motors is purchased at ${usd(80, 0)} on 40% initial margin. It is later sold at ${usd(92, 0)} after a ${usd(1, 0)} dividend. Ignore interest on the margin loan. The return on the investor’s equity is closest to ${inline(String.raw`\frac{(92-80)+1}{80\times 0.40}`)}.`,
      levered,
      [unlevered, priceOnlyEquity],
      (value) => pct(value, 2),
      (formatted) =>
        `Equity at the start is ${usd(32, 0)}. The loan is ${usd(48, 0)}. Ending equity is the sale price minus the loan plus the dividend, ${usd(45, 0)}. ${inline(String.raw`\frac{45-32}{32}`)} equals ${formatted}. The unlevered holding-period return is ${pct(unlevered, 2)}. Leaving the dividend out of the equity profit understates the return the position actually earned.`,
    ),
    ask(
      'eq-markets',
      'hard',
      `Briar Court Hotels was bought at ${usd(50, 0)} on 40% initial margin. Maintenance margin is 25%. The price is now ${usd(42, 0)}. Using ${inline(String.raw`P_0\times\frac{1-\text{initial margin}}{1-\text{maintenance margin}}`)}, has a maintenance margin call been triggered?`,
      'No. The price is still above the long maintenance trigger, so the equity ratio is still above 25%.',
      'Yes. Any decline from the purchase price triggers a maintenance call on a long margin position.',
      'Yes. The price has crossed the short-sale trigger, so the long position must be closed.',
      `No. The price is still above the long maintenance trigger, so the equity ratio is still above 25%. The trigger is ${inline(String.raw`50\times\frac{0.60}{0.75}`)} = ${usd(stillSafe, 2)}. At ${usd(42, 0)} the loan per share is still ${usd(30, 0)}, so equity is ${usd(12, 0)} and the equity ratio is ${pct(12 / 42, 2)}. A margin call on a long requires the price to fall through that trigger. The short-sale trigger sits above the original price and does not apply to this long.`,
    ),
    ask(
      'eq-markets',
      'medium',
      'Nightingale Audio is quoted 22 bid and 22.15 ask. An investor submits a limit order to buy at 22.15. Which statement about execution is most accurate?',
      'The buy limit is marketable, because the limit is at the ask, so it can execute immediately. A buy limit set below the ask would rest and might not fill.',
      'A limit order never executes immediately, even when the limit is equal to the ask.',
      'The order becomes a stop-sell, because every limit price at the ask is a protective stop.',
      'A buy limit specifies the highest price the investor will pay. If that price is at or above the current ask, the order can trade now and is called marketable. A buy limit below the ask sits in the book and faces execution uncertainty. It is not a stop. The distinction between a marketable limit and a resting limit is the reason two “limit orders” can have opposite chances of filling.',
    ),
  ]
}

function indexes(): Draft[] {
  const p0 = [20, 50, 30]
  const p1 = [22, 45, 36]
  const shares = [100, 40, 80]
  const dividends = [0.5, 1, 0]
  const priceReturns = p0.map((price, index) => math.hpr(price, p1[index]))
  const totalReturns = p0.map((price, index) => math.hpr(price, p1[index], dividends[index]))
  const beginValue = p0.reduce((sum, price, index) => sum + price * shares[index], 0)
  const weights = p0.map((price, index) => (price * shares[index]) / beginValue)
  const priceWeighted = p1.reduce((sum, price) => sum + price, 0) / p0.reduce((sum, price) => sum + price, 0) - 1
  const valueWeighted = math.portfolioReturn(weights, priceReturns)
  const equalWeighted = math.mean(priceReturns)
  const valueTotal = math.portfolioReturn(weights, totalReturns)
  const p0b = [10, 40, 80]
  const p1b = [12, 40, 64]
  const sharesB = [50, 20, 10]
  const returnsB = p0b.map((price, index) => math.hpr(price, p1b[index]))
  const beginB = p0b.reduce((sum, price, index) => sum + price * sharesB[index], 0)
  const weightsB = p0b.map((price, index) => (price * sharesB[index]) / beginB)
  const priceWeightedB = p1b.reduce((sum, price) => sum + price, 0) / p0b.reduce((sum, price) => sum + price, 0) - 1
  const valueWeightedB = math.portfolioReturn(weightsB, returnsB)
  const equalWeightedB = math.mean(returnsB)
  const newDivisor = (24 + 36 + 30) / 40
  const floatCap = 6_000_000 * 18
  return [
    numQ(
      'eq-indexes',
      'medium',
      `A price-weighted index contains three fictional shares. Beginning prices are 20, 50, and 30. Ending prices are 22, 45, and 36. There is no divisor change. The price-weighted return is closest to ${inline(String.raw`\frac{22+45+36}{20+50+30}-1`)}.`,
      priceWeighted,
      [valueWeighted, equalWeighted],
      (value) => pct(value, 2),
      (formatted) =>
        `A price-weighted return depends on the sum of prices, not on shares outstanding. ${inline(String.raw`\frac{103}{100}-1`)} equals ${formatted}. The value-weighted return on the same names, using 100, 40, and 80 shares, is ${pct(valueWeighted, 2)}. The equal-weighted average of the three price returns is ${pct(equalWeighted, 2)}. The high-priced middle share, which fell, pulls the price-weighted result more than an equal-weighted average does.`,
    ),
    numQ(
      'eq-indexes',
      'medium',
      `The same three shares, priced 20, 50, and 30 at the start and 22, 45, and 36 at the end, have 100, 40, and 80 shares outstanding. The value-weighted price return is closest to ${inline(String.raw`\frac{22\times 100+45\times 40+36\times 80}{20\times 100+50\times 40+30\times 80}-1`)}.`,
      valueWeighted,
      [priceWeighted, equalWeighted],
      (value) => pct(value, 2),
      (formatted) =>
        `Value weights use beginning market capitalization. Beginning value is 6,400 and ending value is 6,880, so ${inline(String.raw`\frac{6{,}880}{6{,}400}-1`)} equals ${formatted}. That is not the price-weighted return of ${pct(priceWeighted, 2)} and not the equal-weighted return of ${pct(equalWeighted, 2)}. Large capitalizations dominate this result even when a low-priced name has a large percentage move.`,
    ),
    numQ(
      'eq-indexes',
      'easy',
      `Three shares return 10%, −10%, and 20% over the same period, which are the price returns of names that moved from 20 to 22, 50 to 45, and 30 to 36. The equal-weighted price return is closest to ${inline(String.raw`\frac{0.10-0.10+0.20}{3}`)}.`,
      equalWeighted,
      [priceWeighted, valueWeighted],
      (value) => pct(value, 2),
      (formatted) =>
        `Over a single period, an equal-weighted index return is the arithmetic average of the constituent returns. ${inline(String.raw`\frac{0.20}{3}`)} equals ${formatted}. Price weighting gives ${pct(priceWeighted, 2)} on these prices, and value weighting with 100, 40, and 80 shares gives ${pct(valueWeighted, 2)}. Equal weight gives the smallest name the same vote as the largest name.`,
    ),
    numQ(
      'eq-indexes',
      'hard',
      `Beginning prices are 20, 50, and 30 with 100, 40, and 80 shares. Ending prices are 22, 45, and 36. Dividends per share are 0.50, 1.00, and 0. The value-weighted total return is closest to ${inline(String.raw`\frac{\text{ending value}+\text{dividends}}{\text{beginning value}}-1`)}.`,
      valueTotal,
      [valueWeighted, equalWeighted],
      (value) => pct(value, 2),
      (formatted) =>
        `Total return adds the dividends to the ending value. Cash dividends are 0.50×100 + 1×40 = 90, and ending market value is 6,880, so ${inline(String.raw`\frac{6{,}970}{6{,}400}-1`)} equals ${formatted}. The price return of ${pct(valueWeighted, 2)} leaves the dividends out. The equal-weighted price return of ${pct(equalWeighted, 2)} neither value-weights the names nor includes income.`,
    ),
    numQ(
      'eq-indexes',
      'hard',
      `A price-weighted index of three shares priced 24, 36, and 60 uses a divisor of 3, so the index level is 40. The share priced 60 splits 2-for-1 and trades at 30 just after the split. The new divisor that keeps the index at 40 is closest to ${inline(String.raw`\frac{24+36+30}{40}`)}.`,
      newDivisor,
      [3, 2],
      (value) => num(value, 2),
      (formatted) =>
        `After the split the price sum is 90. Holding the index at 40 requires a divisor of ${formatted}. ${inline(String.raw`\frac{90}{40}`)} is that adjustment. Leaving the divisor at 3 would drop the index even though no economic value changed. A divisor of 2 would push the index to 45 and invent a gain from the split.`,
    ),
    numQ(
      'eq-indexes',
      'medium',
      `A second price-weighted basket starts at prices 10, 40, and 80 and ends at 12, 40, and 64, with no divisor change. Its price-weighted return is closest to ${inline(String.raw`\frac{12+40+64}{10+40+80}-1`)}.`,
      priceWeightedB,
      [valueWeightedB, equalWeightedB],
      (value) => pct(value, 2),
      (formatted) =>
        `The price sum falls from 130 to 116 because the expensive share’s decline dominates. ${inline(String.raw`\frac{116}{130}-1`)} equals ${formatted}. With 50, 20, and 10 shares, the value-weighted return is ${pct(valueWeightedB, 2)}. The equal-weighted average of +20%, 0%, and −20% is ${pct(equalWeightedB, 2)}. Price weighting is why one high-priced loser can drag the index while an equal-weighted reading is flat.`,
    ),
    numQ(
      'eq-indexes',
      'easy',
      `A company has 10 million shares outstanding, of which 4 million are closely held and not freely tradable. The price is ${usd(18, 0)}. Float-adjusted market capitalization is closest to ${inline(String.raw`6{,}000{,}000 \times 18`)}.`,
      floatCap,
      [10_000_000 * 18, 4_000_000 * 18],
      (value) => usd(value, 0),
      (formatted) =>
        `Float adjustment keeps the shares that public investors can actually trade. ${inline(String.raw`(10-4)\text{ million}\times 18`)} equals ${formatted}. The full-company capitalization of ${usd(180_000_000, 0)} counts shares that are not in the float. Using only the closely held shares measures the block that the index is trying to exclude.`,
    ),
    ask(
      'eq-indexes',
      'easy',
      'Campo Verde Grain is added to a price-weighted index and to a value-weighted index at the same time. Its share price is high and its market capitalization is small. Which weight comparison is most accurate?',
      'The share has a large weight in the price-weighted index and a small weight in the value-weighted index.',
      'The share has a large weight in both indexes, because a high price always means a large firm.',
      'The share has a small weight in the price-weighted index, because price weighting uses market capitalization.',
      'Price weighting gives influence to a high price per share, regardless of how many shares exist. Value weighting gives influence to price times shares outstanding. A small firm with a high price can therefore dominate a price-weighted index and barely move a value-weighted one. A stock split would cut the price-weighted influence and, after the divisor adjustment, leave the value-weighted weight essentially unchanged.',
    ),
    ask(
      'eq-indexes',
      'medium',
      'An analyst criticizes a value-weighted benchmark of large fictional industrials because several of the biggest names look expensive on fundamentals. Which feature of value weighting is the criticism pointing at?',
      'Weights rise with market capitalization, so names that have become expensive can become a larger part of the index.',
      'Value weighting forces every name to an equal weight, so expensive names are constantly sold.',
      'Value weighting uses only the share price, so a split automatically reduces an expensive firm’s weight.',
      'A capitalization-weighted index lets price appreciation increase a constituent’s weight. If the appreciation is a higher valuation rather than a higher fundamental value, the index puts more money in the richer name. That is the opposite of equal weighting, which rebalances away from winners. It is also not price weighting, which would care about the price per share rather than the value of the whole firm.',
    ),
    ask(
      'eq-indexes',
      'medium',
      'Hillcrest Looms is in an equal-weighted index that is rebalanced quarterly. Compared with a capitalization-weighted index of the same names, which statement is most accurate?',
      'The equal-weighted index gives more weight to smaller names and must trade to restore equal weights, so turnover and transaction costs are higher.',
      'The equal-weighted index never rebalances, because each name’s weight automatically stays equal when prices change.',
      'The capitalization-weighted index must sell winners and buy losers every quarter or it stops being cap-weighted.',
      'Equal weights drift as soon as returns differ, so restoring them means selling relative winners and buying relative losers. That contrarian rebalancing raises turnover. A cap-weighted index lets weights follow prices, so ordinary price moves do not require rebalancing trades. Reconstitution, which changes membership, is a separate event for both indexes.',
    ),
    ask(
      'eq-indexes',
      'easy',
      'Red Kettle Markets appears in two indexes of the same stocks. One index level ignores dividends. The other assumes dividends are reinvested in the index. Which labels match the two series?',
      'The series that ignores dividends is a price-return index. The series that reinvests them is a total-return index.',
      'The series that ignores dividends is a total-return index, because price is the total outcome of holding shares.',
      'Both series are price-return indexes. Reinvesting dividends changes only the divisor.',
      'A price-return index tracks price changes only. A total-return index adds dividends, usually by assuming they are reinvested in the basket. Over long periods the gap is the income the shares paid. Calling the price series a total return would hide that income, and reinvestment is not accomplished by tweaking a price-weighted divisor alone.',
    ),
    ask(
      'eq-indexes',
      'medium',
      'After a 2-for-1 split, the divisor of a price-weighted index is reset so the index level does not change at the moment of the split. What happens to the split company’s influence in that index?',
      'Its weight falls, because its price is now half of what it was, even though the index level was held constant.',
      'Its weight doubles, because each old share is now two shares in a price-weighted index.',
      'Its weight is unchanged, because a divisor adjustment freezes every constituent’s weight.',
      'The divisor change keeps the index from jumping, but the constituent’s weight is its price divided by the sum of prices. Halving the price halves that share of the sum. The economic holding of an investor who owned the stock is unchanged by the split; the price-weighted index is what changes the company’s influence. Value weighting would not cut the company’s weight merely because the share count doubled and the price halved.',
    ),
    ask(
      'eq-indexes',
      'hard',
      'A committee removes two names from a capitalization-weighted index and adds two others. Separately, an equal-weighted version of the old basket trades back to equal weights. Which vocabulary is most accurate?',
      'Changing membership is reconstitution. Restoring target weights is rebalancing.',
      'Both actions are reconstitution, because any trade in an index product changes the index definition.',
      'Changing membership is rebalancing, and restoring equal weights is a stock split.',
      'Reconstitution decides which securities are in the index. Rebalancing resets weights toward the rule, such as equal weights, without necessarily changing the member list. A cap-weighted index can be reconstituted on a schedule and still not need rebalancing just because prices moved. A split changes a price and a share count; it is not the name for an equal-weight reset.',
    ),
    ask(
      'eq-indexes',
      'easy',
      'A pension fund uses a broad equity index as a benchmark for an active manager and also as the basis for a separate passive holding. Which use is most accurate?',
      'The index can be both a yardstick for active results and the portfolio that a passive mandate is trying to hold.',
      'An index can be a benchmark only if it is price-weighted, and it cannot be held passively.',
      'A passive holding must use a different index from the benchmark, or the active manager’s result is undefined.',
      'Benchmarks measure the opportunity set the active manager was hired to beat. The same rules can be implemented in a passive fund that tries to own the index. The weighting scheme does not have to be price weighting for either use. Using one index for both jobs is coherent: the active result is then the difference from the portfolio the investor could have held at low cost.',
    ),
    ask(
      'eq-indexes',
      'medium',
      'Brindle Bank’s equity index covers 80 large listed firms in its home market and excludes smaller listed firms and all private companies. A strategist calls the index “the market.” Which caution is most accurate?',
      'The index is a proxy for the included names, not for every equity risk in the economy. Omitted small and private firms can make the proxy incomplete.',
      'Any published index is the market portfolio by definition, so omissions do not affect expected-return models.',
      'Excluding private firms raises the index dividend yield to the risk-free rate.',
      'Index coverage is a design choice. A large-cap listed index can be an excellent liquid benchmark and still miss the returns and risks of smaller and private businesses. Treating it as the complete market portfolio overstates how much of the economy it contains. Coverage does not mechanically set the dividend yield equal to the risk-free rate.',
    ),
    ask(
      'eq-indexes',
      'hard',
      'Why can an equal-weighted index of the same constituents outperform a capitalization-weighted index over a period even when both are calculated from the same prices?',
      'Equal weight puts more capital in the smaller names. If those names rise more than the giants, the equal-weighted return is higher before its extra transaction costs.',
      'Equal weight always exceeds cap weight, because the arithmetic average exceeds every capitalization-weighted return.',
      'The two returns must be identical if membership is identical, because weighting cannot change a return.',
      'Weighting changes the portfolio. Equal weight tilts toward smaller names and, between rebalances, lets each name contribute its own return equally. If small names lead, equal weight wins on paper. It does not win by arithmetic necessity, and the live result still has to pay the higher turnover. Identical membership does not imply an identical return once the weights differ.',
    ),
  ]
}

function efficiency(): Draft[] {
  const expected = math.capm(0.02, 1.4, 0.08)
  const abnormal = 0.15 - expected
  return [
    ask(
      'eq-efficiency',
      'easy',
      'A researcher says the market for Rookery Software’s shares is weak-form efficient. What does that claim mean for information and for technical analysis?',
      'Prices already reflect historical prices and volumes, so technical analysis of that history should not add value.',
      'Prices reflect every public filing, so fundamental analysis of the annual report should not add value.',
      'Prices reflect private information, so even company insiders should be unable to earn abnormal returns.',
      'Weak form means the price impounds the trading record. Chart patterns and other trading rules built only on that record should not produce abnormal returns after costs. Public fundamental information is the step up to semi-strong efficiency. Private information is the step up to strong form. Weak form is the narrowest of the three claims.',
    ),
    ask(
      'eq-efficiency',
      'easy',
      'A second researcher says the same market is semi-strong efficient. Which activity does that claim say should fail to earn abnormal returns?',
      'Fundamental analysis that uses only public information, including filings, news, and published economic data.',
      'Trading on material nonpublic information about a contract that has not been announced.',
      'Nothing fails. Semi-strong efficiency means prices ignore both public news and the trading history.',
      'Semi-strong efficiency says the price already reflects public information, so studying that information should not produce an abnormal return after costs. It includes the historical prices of the weak form. It does not claim that insiders with genuinely private information are powerless. That stronger claim is the strong form.',
    ),
    ask(
      'eq-efficiency',
      'easy',
      'Strong-form efficiency is the broadest claim of the three. Which information set does it say is already in the price?',
      'All information, public and private, so even insiders cannot systematically earn abnormal returns.',
      'Only historical prices, so insiders and fundamental analysts can both earn abnormal returns.',
      'Only information that has been printed in a regulator’s filing, so a press release is still exploitable.',
      'Strong form includes weak and semi-strong information and also private information. If it holds, insider trading should not earn abnormal returns either. Evidence that insiders do earn such returns is evidence against the strong form, without by itself settling the weaker forms. A press release is public once it is released; strong form is not limited to regulator filings.',
    ),
    ask(
      'eq-efficiency',
      'medium',
      'If a market is semi-strong efficient, which other statement must also be true?',
      'The market is weak-form efficient, because historical prices are part of the public information set.',
      'The market is strong-form efficient, because public efficiency automatically includes private information.',
      'Technical analysis begins to add value, because semi-strong efficiency cancels fundamental analysis only.',
      'The forms nest. Semi-strong contains the price history, so it implies weak form. It does not imply strong form, because private information can still be outside the price. Technical analysis is already supposed to fail under weak form, so semi-strong efficiency does not revive it. A market that fails weak form cannot pass the stricter tests.',
    ),
    ask(
      'eq-efficiency',
      'medium',
      'Serial-correlation tests and runs tests on daily returns of Barleyhouse Foods fail to find a tradable pattern. Which form of efficiency are those tests aimed at?',
      'Weak form, because they ask whether the return history predicts the next return.',
      'Semi-strong form, because they use the firm’s latest audited footnotes.',
      'Strong form, because a runs test observes insider order flow directly.',
      'Tests that use only the sequence of past returns are weak-form tests. A lack of serial correlation is consistent with weak form, though it is not a proof that every trading rule fails after costs. Semi-strong tests need public information beyond the price history, such as an earnings announcement. Insider-trading studies are the usual strong-form evidence, not a runs test.',
    ),
    ask(
      'eq-efficiency',
      'medium',
      'Windmill Cement announces a large contract during the trading day. The share price jumps within minutes and then trades flat, and a study finds no remaining abnormal return after the announcement window. Which conclusion is most appropriate?',
      'The speed of the adjustment is evidence consistent with semi-strong efficiency for this public announcement.',
      'The jump proves strong-form efficiency, because the contract was known to managers the week before.',
      'The jump rejects weak form, because any price change means the history was not in the price.',
      'An event study around a public announcement is a semi-strong test. A fast move to a new price, with no lingering abnormal return, is what semi-strong efficiency predicts. The fact that managers knew earlier is a question about strong form, which this post-announcement window does not answer. A price change on news is not a violation of weak form; weak form says you cannot profit from the old prices, not that prices never move.',
    ),
    ask(
      'eq-efficiency',
      'hard',
      'Past winners in a fictional small-cap universe keep outperforming past losers for several months after the ranking date. Transaction costs are large in those names. How should this momentum result be read?',
      'It challenges weak form if the pattern is more than chance, but it is an exploitable anomaly only if it survives costs and risk adjustment.',
      'It confirms strong form, because momentum uses private information about future earnings.',
      'It is irrelevant to efficiency, because any pattern in past prices is allowed under weak form.',
      'Momentum is a pattern in past returns, so it sits in the weak-form information set. A reliable pattern is a challenge to the claim that technical information has no value. Many such patterns shrink once spreads, impact, and risk are included. The careful conclusion is “possible anomaly, not yet a free lunch,” not a confirmation of strong form and not a statement that weak form permits any trading rule.',
    ),
    ask(
      'eq-efficiency',
      'medium',
      'A value strategy buys public firms with low price-to-book ratios and earns higher average returns than the broad index. The data are all published. Which efficiency claim is under pressure if the extra return is not compensation for risk?',
      'Semi-strong form, because the strategy uses only public information.',
      'Only weak form, because price-to-book is a chart pattern.',
      'No form is affected, because any public ratio is inside the strong-form information set and nowhere else.',
      'Price and book value are public. A risk-adjusted abnormal return from that information is a semi-strong anomaly. It is also a weak-form issue only in the nested sense that semi-strong includes prices; the new information beyond the price history is the accounting number. Strong form is a broader claim. Finding a public anomaly does not require a finding about insider information.',
    ),
    ask(
      'eq-efficiency',
      'hard',
      'Insiders at Holloway Sensors earn abnormal returns in the weeks before they disclose open-market purchases. The same stocks do not drift after the disclosure becomes public. Which pairing is most accurate?',
      'The pre-disclosure profits are evidence against strong form. The lack of drift after disclosure is consistent with semi-strong form.',
      'Both findings support strong form, because insiders are part of the public once they trade.',
      'The pre-disclosure profits support weak form and reject semi-strong form.',
      'Strong form says private information is already in the price. Profits earned before the disclosure say it was not. Once the trade or the filing is public, a flat abnormal return is what semi-strong efficiency predicts. The pre-disclosure result does not rescue a weak-form story, and insider status does not become public merely because an insider placed an order that nobody else has seen.',
    ),
    ask(
      'eq-efficiency',
      'medium',
      'A mispricing in a fictional micro-cap looks large on paper. Borrowing the shares is impossible, the spread is wide, and the position cannot be sized. What does that illustrate?',
      'Limits to arbitrage. A mispricing can persist because the trade that would remove it is not realistically available.',
      'Strong-form efficiency. If a trade is costly, the price is defined to reflect all private information.',
      'That technical analysis is required, because costly arbitrage converts every market into a weak-form failure.',
      'Efficiency arguments often assume someone can trade the gap away. When short sales are unavailable and costs consume the gap, the mispricing can sit there without offering a usable abnormal return. That is a limit to arbitrage, not a proof of strong form, and it does not by itself validate chart reading. The practical question is whether an implementable strategy remains after costs.',
    ),
    ask(
      'eq-efficiency',
      'easy',
      'A client hears that markets are semi-strong efficient and concludes that portfolio construction no longer matters. Which reply is most accurate?',
      'Efficiency, if it holds, argues against expecting abnormal return from security selection. Risk, taxes, liquidity, and the client’s constraints still determine the portfolio.',
      'Efficiency means every investor should hold the same stocks in the same weights, so constraints are irrelevant.',
      'Efficiency means active managers are guaranteed to beat the index by the size of their fee.',
      'Even in an efficient market, investors differ in horizon, taxes, spending needs, and willingness to bear risk. The market portfolio is not automatically each client’s portfolio. What efficiency challenges is the belief that public information will reliably produce alpha after costs. It does not guarantee that paying an active fee will help, and it does not make the investment policy statement unnecessary.',
    ),
    ask(
      'eq-efficiency',
      'hard',
      'A market fails a simple weak-form test: a published trading rule based only on past prices earns abnormal returns after costs. Which statement follows?',
      'The market is not weak-form efficient, and therefore it is also not semi-strong or strong-form efficient.',
      'The market can still be strong-form efficient, because strong form does not require weak form.',
      'The result supports semi-strong efficiency, because a price-based rule uses public fundamental data.',
      'The forms are nested. Strong implies semi-strong, and semi-strong implies weak. Failing the weakest test fails the stricter ones too. A past-price rule is not a fundamental test. One robust after-cost result is enough to reject the claim for that market; it does not mean every other trading rule works, but it does mean the “all history is in the price” claim is false.',
    ),
    numQ(
      'eq-efficiency',
      'medium',
      `Otterbend Cider returned 15% over a month. The risk-free rate was 2%, the share’s beta is 1.4, and the market returned 8%. The abnormal return relative to the CAPM is closest to ${inline(String.raw`0.15 - \big(0.02 + 1.4\times(0.08-0.02)\big)`)}.`,
      abnormal,
      [0.15 - 0.08, expected],
      (value) => pct(value, 2),
      (formatted) =>
        `The CAPM expected return is ${pct(expected, 2)}. Abnormal return is actual minus that benchmark. ${inline(String.raw`0.15-0.104`)} equals ${formatted}. Subtracting the raw market return ignores beta. Quoting the CAPM return itself reports the hurdle, not the surprise relative to the hurdle. Event studies average this kind of abnormal return around news.`,
    ),
    ask(
      'eq-efficiency',
      'easy',
      'Which research design matches the form of efficiency it is built to examine?',
      'Insider-trading profits test strong form. Announcement event studies test semi-strong form. Autocorrelation of returns tests weak form.',
      'Insider-trading profits test weak form. Autocorrelation tests strong form. Event studies test nothing about information.',
      'All three designs test only strong form, because every price is public after it prints.',
      'Match the information set to the test. Past returns alone are weak form. Public announcements are semi-strong. Private information in the hands of insiders is strong form. A printed price is public, but that does not turn an insider study into a weak-form test; the question is what information the trader had when the profit was earned.',
    ),
  ]
}

function overview(): Draft[] {
  return [
    ask(
      'eq-overview',
      'easy',
      'Northpine Timber issues common shares. Which bundle of features most accurately describes those shares?',
      'A residual claim on assets and earnings, voting rights, and limited liability for the owners.',
      'A fixed coupon, a maturity date, and a senior claim ahead of every creditor.',
      'A contractual obligation to pay a stated dividend, with unlimited liability for the owners.',
      'Common equity is paid after creditors and preferred shareholders. Owners typically vote for the board and are not personally liable for the company’s debts beyond their investment. Dividends are discretionary, not a coupon, and there is no maturity. Treating common stock as senior debt reverses the capital structure.',
    ),
    ask(
      'eq-overview',
      'easy',
      'Kestrel Metering also has preferred shares outstanding. In a liquidation, how do those preferred shares rank?',
      'Behind creditors and ahead of common equity, for the preference stated in the contract.',
      'Ahead of every creditor and behind common equity.',
      'Equal to common equity, because the word equity means the claims always share pro rata.',
      'Preferred stock is equity with a priority over common stock for dividends and for a stated liquidation preference. It does not jump the queue ahead of debt. “Equity” does not mean every equity claim is identical; the preference is the reason the security has a different price and a different risk from the common.',
    ),
    ask(
      'eq-overview',
      'medium',
      'Willowbranch Clinics missed two years of dividends on its cumulative preferred shares and wants to resume a dividend on the common. Which constraint applies?',
      'The preferred arrears must be paid before any common dividend. The missed preferred dividends accumulated.',
      'The missed preferred dividends expired, so the firm may pay the common dividend immediately.',
      'Cumulative preferred dividends are interest, so they were already accrued as a debt liability and the common dividend is unrestricted.',
      'Cumulative preferred dividends that are not declared stay in arrears and block common dividends until the arrears are cleared. Noncumulative preferred would typically lose the missed dividends. Unless the preferred is mandatorily redeemable or otherwise meets the definition of a liability, undeclared cumulative dividends are not the same thing as bond interest already recognized as debt.',
    ),
    ask(
      'eq-overview',
      'hard',
      'Dune & Harbor Shipping elects three directors. A minority holder owns 40% of the shares and the rest is one block. The charter uses cumulative voting. Which statement is most accurate?',
      'The minority holder can concentrate all of its votes on one nominee and can elect a director. Statutory voting would let the majority win every seat.',
      'Cumulative voting gives the majority three votes per share and the minority one, so the minority cannot be represented.',
      'Statutory voting is the system that lets a minority holder cast all votes for a single seat.',
      'Under cumulative voting, each shareholder gets votes equal to shares times seats and may cast them all for one nominee. That concentration is what lets a large minority elect at least one director. Statutory, or straight, voting holds a separate election for each seat, and the same majority can win each one. The labels are easy to swap, and the swap reverses who the voting rule protects.',
    ),
    ask(
      'eq-overview',
      'medium',
      'Paperfinch Press issues callable preferred shares. Rates fall sharply a year later and the issuer calls the issue at the stated call price. Who benefits from the call feature, and how should the original yield have compared with non-callable preferred?',
      'The issuer benefits by refinancing more cheaply. Callable preferred should have offered a higher yield than otherwise identical non-callable preferred.',
      'The holder benefits, so callable preferred should have offered a lower yield than non-callable preferred.',
      'Neither side is affected, because a call price equal to par removes both the refinancing gain and any yield difference.',
      'The call belongs to the issuer. When rates fall, the issuer retires an expensive dividend and replaces it. Investors bear reinvestment risk, so they demand a higher yield, or a lower price, than on preferred that cannot be called. A call at par does not make the holder whole for the lost stream of high dividends. The feature is not neutral.',
    ),
    ask(
      'eq-overview',
      'medium',
      'Iron Lantern Tools issues convertible preferred that can be exchanged for a fixed number of common shares. Compared with otherwise identical non-convertible preferred, which description is most accurate?',
      'The conversion option is valuable to the holder, so the preferred dividend can be lower. The holder gives up the preferred position if the option is exercised.',
      'The option is valuable to the issuer, so the holder should demand a higher preferred dividend than on straight preferred.',
      'Conversion leaves the preferred claim in place and adds the common shares on top, so the holder is never diluted.',
      'Convertibility lets the holder participate in common-share upside. That option has value, so investors accept a lower preferred dividend than on a straight preferred of the same issuer. Exercising replaces the preferred claim with common; it does not stack the two claims. The issuer is the one that has sold the option, which is why the coupon, or here the dividend, can be smaller.',
    ),
    ask(
      'eq-overview',
      'medium',
      'Cinder & Rye Bakery’s preferred shares participate: after a base preferred dividend, they share extra dividends with the common once the common dividend passes a threshold. What does that participation add?',
      'Upside if the firm pays large common dividends, on top of the preferred priority for the base dividend.',
      'A maturity date and a senior claim ahead of the bank loan.',
      'An obligation for the holder to buy more common shares whenever the common dividend is raised.',
      'Participating preferred keeps the dividend priority for its base amount and adds a share of unusually high common distributions. That is equity upside, not a creditor’s maturity and not a claim senior to debt. It is also not a requirement that the holder purchase more shares. The participation is why this preferred can be worth more than a plain preferred when the firm is very profitable.',
    ),
    ask(
      'eq-overview',
      'easy',
      'A domestic investor buys a sponsored American depositary receipt on a fictional foreign shipper, Lowmarsh Ferries, rather than buying the ordinary shares in the foreign market. What has the investor obtained?',
      'A domestic-market receipt representing the foreign shares, quoted in the domestic currency. The investor still has foreign-company and currency exposure.',
      'A domestic bond issued by the investor’s own government, with no exposure to Lowmarsh.',
      'A receipt that removes currency risk because the depositary guarantees the foreign exchange rate.',
      'An ADR is a receipt from a depositary bank against shares held overseas. Sponsorship means the company is involved. Trading and dividends are arranged in the domestic currency, which is convenient, but the underlying asset is still the foreign equity. Currency moves between the dividend’s home currency and the investor’s currency still affect the result. The depositary does not turn the holding into a government bond.',
    ),
    ask(
      'eq-overview',
      'medium',
      'Goldthread Textiles has a book value of 8 per share and a market price of 14. The firm expenses its brand-building costs and has earned returns above its cost of equity. Which reading of the gap is most careful?',
      'Price above book can reflect unrecognized intangible value and expected economic profits. It is not, by itself, proof that the shares are overvalued.',
      'Price above book proves the shares are overvalued by the entire premium, because book value is intrinsic value.',
      'Price cannot exceed book value under either IFRS or US GAAP, so the quote must be a data error.',
      'Book value is an accounting residual. Assets such as an internally developed brand may be missing, and the market capitalizes earnings power that the balance sheet does not. A premium to book is therefore not automatic evidence of a rich price. A valuation model, not the premium alone, decides whether 14 is cheap or expensive relative to fundamentals. Nothing in the standards caps price at book value.',
    ),
    ask(
      'eq-overview',
      'hard',
      'Plover Ridge Hotels has two common classes. Class A is widely held and has one vote per share. Class B is held by the founders, has ten votes per share, and is a small fraction of the share count. Which governance consequence is most accurate?',
      'The founders can control board elections with a minority of the cash-flow claims. Public holders of Class A bear that separation of votes from economic ownership.',
      'Dual-class structures give voting power to the class with the most shares outstanding, so Class A controls the board.',
      'Ten votes per Class B share are ignored under statutory voting, so the structure has no control effect.',
      'Super-voting shares let insiders elect directors even when most of the capital was supplied by the low-vote class. That can let founders pursue a long-term plan, and it can also entrench them. The economic interest and the voting interest are different portfolios. The vote multiple is the point of the structure; statutory voting does not delete it.',
    ),
    ask(
      'eq-overview',
      'medium',
      'Saltmere Fisheries compares issuing debt with issuing preferred stock. The preferred dividend is discretionary and non-deductible. The bond interest is contractual and tax-deductible. Which financing consequence is most accurate?',
      'Preferred stock is less likely to force a default if the dividend is skipped, and it does not create a tax shield the way deductible interest does.',
      'Preferred dividends are tax-deductible and must be paid, so they behave exactly like bond coupons.',
      'Skipping a preferred dividend is an event of default under every commercial code, just like skipping a coupon.',
      'Debt brings a tax shield and a default risk if the coupon is missed. Plain preferred stock usually brings neither: the dividend is not deductible in the standard corporate tax setting this question uses, and passing it does not by itself bankrupt the firm, though it can block common dividends and damage access to capital. Mandatorily redeemable preferred can be classified as a liability and needs to be read contract by contract. The plain comparison is equity flexibility versus debt discipline and tax deductibility.',
    ),
    ask(
      'eq-overview',
      'hard',
      'Amberglass Solar issues putable preferred. The holder may sell the shares back to the firm at a fixed price if rates rise. How does that put affect the holder and the yield?',
      'The put protects the holder when rates rise, so putable preferred can offer a lower dividend yield than otherwise identical straight preferred.',
      'The put protects the issuer when rates rise, so the yield should be higher than on straight preferred.',
      'A put and a call have the same effect on yield, because both are options on the preferred dividend.',
      'The put is the holder’s option. If yields rise and the preferred’s price would otherwise fall, the holder can put the shares at the contracted price. That protection has value, so the issuer can pay a lower dividend than on preferred that the holder cannot put. A call is the issuer’s option and pushes the yield the other way. The two embedded options are not substitutes.',
    ),
  ]
}

function past(): Draft[] {
  const revenue = 25 * 80_000
  const baseEbit = (25 - 15) * 80_000 - 400_000
  const upEbit = (25 - 15) * 88_000 - 400_000
  const ebitGrowth = upEbit / baseEbit - 1
  return [
    numQ(
      'eq-past',
      'easy',
      `Finch & Timber sold 80,000 units at ${usd(25, 0)} last year. Revenue for that price and volume is closest to ${inline(String.raw`25 \times 80{,}000`)}.`,
      revenue,
      [25 * 80_000 * 0.4, 80_000],
      (value) => usd(value, 0),
      (formatted) =>
        `A simple revenue build is price times volume. ${inline(String.raw`25 \times 80{,}000`)} equals ${formatted}. A 40% gross margin would describe profit after product cost, not revenue. The unit count alone is not a currency amount. Later analysis can split the change in revenue into price, volume, and mix.`,
    ),
    numQ(
      'eq-past',
      'hard',
      `The same timber firm has a variable cost of ${usd(15, 0)} per unit, annual fixed operating costs of ${usd(400_000, 0)}, and last year’s volume of 80,000 units at ${usd(25, 0)}. If volume rises 10% and price and costs stay constant, the percentage increase in EBIT is closest to ${inline(String.raw`\frac{\text{contribution}}{\text{EBIT}}\times 10\%`)}.`,
      ebitGrowth,
      [0.1, (upEbit - baseEbit) / revenue],
      (value) => pct(value, 2),
      (formatted) =>
        `Last year’s contribution is ${usd(800_000, 0)} and EBIT is ${usd(baseEbit, 0)}, so the degree of operating leverage is 2. A 10% volume increase raises EBIT by ${formatted}. ${inline(String.raw`\frac{800{,}000}{400{,}000}\times 0.10`)} is that product. EBIT does not rise only 10%, because the fixed costs do not rise. Measuring the EBIT dollar change against revenue, rather than against EBIT, produces a margin change rather than the percentage change in operating profit.`,
    ),
    ask(
      'eq-past',
      'medium',
      'Rookery Software’s operating costs are almost entirely salaries that do not fall when a contract is delayed. A 5% drop in revenue cuts EBIT by much more than 5%. Which cost structure does that describe?',
      'High operating leverage. Fixed operating costs make profit more sensitive to sales than a variable-cost structure would.',
      'High financial leverage. The sensitivity comes from interest expense, whatever the cost mix.',
      'Low operating leverage. A larger EBIT move than the sales move means fixed costs are small.',
      'Operating leverage is the sensitivity of operating profit to sales, and it rises with fixed operating costs. Interest creates financial leverage, which this fact pattern does not need. Low operating leverage would mean EBIT moves less than sales, or roughly with sales, because most costs would have flexed. The salary base is the fixed operating cost doing the work.',
    ),
    ask(
      'eq-past',
      'easy',
      'Barleyhouse Foods sells 60% of its output to one grocery chain under a contract that reprices every year. Which business risk is most immediate?',
      'Customer concentration. Losing or squeezing that buyer would hit revenue and could compress the margin at the same time.',
      'No incremental risk, because a large customer is diversification.',
      'Supplier power, because the grocery chain is selling inputs to Barleyhouse.',
      'A single buyer that is more than half of sales can walk away, delay orders, or push price. That is customer concentration and buyer power, not diversification. The grocery chain is a customer, not a supplier of Barleyhouse’s inputs. The analyst should read the contract length and the repricing history before treating last year’s revenue as a base that will recur.',
    ),
    ask(
      'eq-past',
      'medium',
      'Windmill Cement’s blended gross margin rose even though the margin on each individual product was unchanged. The firm sold a larger share of its high-margin specialty binder and a smaller share of bulk cement. What explains the blended margin?',
      'Mix. Shifting the sales weights toward the higher-margin product raises the average margin with no change in product-level margins.',
      'Operating leverage. A mix shift is the definition of fixed operating costs.',
      'A change in accounting principle for depreciation, because mix cannot move a gross margin.',
      'The blended margin is a weighted average of product margins. Changing the weights changes the average even when each product’s own margin is flat. That is mix, and it can reverse if the specialty share falls back. It is not operating leverage, which is about fixed costs, and it does not require an accounting-policy change. A forecast that ignores the mix will treat a composition effect as a permanent price increase.',
    ),
    ask(
      'eq-past',
      'medium',
      'Holloway Sensors can add a large number of software seats with little new capital spending. Northpine Timber cannot add a million board-feet without another kiln and more timberland equipment. Which contrast is most useful in a model?',
      'The software firm is asset-light and can grow sales with less incremental capital. The timber firm is asset-heavy and growth shows up as capital spending.',
      'The timber firm is asset-light, because inventory is its only asset. The software firm must capitalize every new seat as a plant.',
      'Capital intensity does not affect free cash flow, so the contrast can be omitted from both models.',
      'Asset intensity tells you whether growth consumes cash. An asset-light model can turn a sales increase into free cash flow quickly. An asset-heavy model must fund capacity first, so the same sales growth can reduce free cash flow for a while. Inventory does not make a kiln-based business asset-light. Leaving capital spending out of both models would erase the difference the businesses actually have.',
    ),
    ask(
      'eq-past',
      'hard',
      'Otterbend Cider is growing quickly, its cash conversion cycle is positive, and its gross margin is healthy. Cash from operations is weak. Which link is most accurate?',
      'Growth with a positive cash conversion cycle invests in receivables and inventory faster than payables fund them, so profit can rise while operating cash lags.',
      'A positive cash conversion cycle releases cash as sales grow, so weak CFO means the margin is negative.',
      'Working capital cannot affect CFO when the gross margin is positive.',
      'The cash conversion cycle is the net time the firm’s cash is tied up in operations. If that cycle is positive, higher sales usually require a larger stock of receivables and inventory. The cash goes out before it comes back. A healthy margin does not cancel that investment. Weak CFO in a growth year is consistent with the business, and it is a reason to forecast the working-capital use explicitly rather than to assume profit equals cash.',
    ),
    ask(
      'eq-past',
      'easy',
      'Willowbranch Clinics earns most of its revenue from annual maintenance contracts that renew at a high rate. A competing equipment firm earns most of its revenue from one-off installation projects. Which revenue stream is easier to forecast, and why?',
      'The maintenance contracts, because the opening book and the renewal rate give a base that the project firm does not have.',
      'The installation projects, because one-off jobs are contractually required to repeat at the same size.',
      'Neither can be forecast, because both are revenue and revenue is always a random walk.',
      'Recurring contracted revenue has a starting balance, a renewal rate, and a price. That is a forecastable base plus growth. Project revenue can be real and still clump: a big job this year does not create the same job next year. Neither stream is a mathematical random walk by virtue of being revenue. The quality difference is persistence, which belongs in the revenue build before any multiple is applied.',
    ),
    ask(
      'eq-past',
      'medium',
      'Plover Ridge Hotels reports a stable consolidated margin. One segment, city hotels, is growing and its margin is falling. A second segment, airport hotels, is shrinking and its margin is rising. What can the consolidated margin hide?',
      'A deteriorating core franchise. Mix toward the shrinking high-margin segment can hold the average up while the growing segment gets worse.',
      'Nothing. A stable consolidated margin means every segment’s margin is stable.',
      'That both segments should be valued on the airport segment’s margin, because it is the higher one.',
      'Consolidation weights the segments. A shift toward a high-margin segment that is shrinking can offset weakness in the segment that is becoming the business. Segment disclosure exists so the analyst does not treat the average as the story. The growing segment’s margin is the one that will dominate later, and using the shrinking segment’s margin for the whole firm would copy the mix that is going away.',
    ),
    ask(
      'eq-past',
      'medium',
      'Saltmere Fisheries has interest-bearing debt of 90, cash of 15, and a large seasonal working-capital swing. An analyst quotes net debt of 75. Which use of that figure is most careful?',
      'Net debt is a starting leverage picture. It still needs a check that the cash is surplus and not trapped in seasonal inventory or restricted accounts.',
      'Net debt is always zero for a seasonal firm, because working capital replaces debt.',
      'Cash is subtracted without limit, including cash the debt covenants require the firm to hold and never spend.',
      'Interest-bearing debt minus cash is a useful first cut, and it is better than ignoring cash. It is not a finished analysis when the cash balance is the funding for the next season’s inventory or is restricted by a covenant. Subtracting cash the firm cannot distribute overstates how much debt could be repaid tomorrow. Seasonal working capital is an operating use, not a reason to record debt at zero.',
    ),
    ask(
      'eq-past',
      'easy',
      'A brokerage-like affiliate of Brindle Bank has almost no fixed operating costs. Commissions and revenue rise and fall together. Which operating-leverage description fits?',
      'Low operating leverage. EBIT should move roughly with revenue because costs flex.',
      'High operating leverage. A variable-cost business magnifies every sales change into a larger EBIT change.',
      'Zero financial leverage, because operating costs and interest are the same expense.',
      'When costs are variable, contribution and EBIT sit close to each other and a sales decline takes costs with it. That is low operating leverage. High operating leverage is the fixed-cost case. Financial leverage is about the debt service below operating profit, not about whether commissions flex. The affiliate can still have debt; the cost structure does not decide the capital structure.',
    ),
    ask(
      'eq-past',
      'hard',
      'Goldthread Textiles shows a gross margin five points above a peer that sells a similar cloth. Which interpretation is most careful?',
      'The gap is consistent with a price or cost advantage, and it should be checked for accounting differences in inventory cost and depreciation before it is called a moat.',
      'A higher gross margin is proof of a permanent moat, and accounting policy cannot affect the comparison.',
      'Gross margins are not comparable by construction, so a five-point gap contains no information.',
      'Gross margin is one of the cleaner windows on product economics. A persistent gap can be pricing power, mix, or a real cost advantage. It can also be FIFO versus a different cost flow, or depreciation that one firm puts in cost of goods sold and the other puts in operating expense. The careful reading keeps the economic hypothesis and audits the accounting before paying a higher multiple for the gap.',
    ),
  ]
}

function industry(): Draft[] {
  return [
    ask(
      'eq-industry',
      'easy',
      'New plants in the fictional bulk-cement industry can be permitted and financed in under a year, and customers switch suppliers over a small price difference. Which of Porter’s forces is strongest in that description?',
      'Threat of entry, because capital and switching costs are not effective barriers.',
      'Supplier power, because easy entry means input vendors set the cement price.',
      'Threat of substitutes is irrelevant whenever entry is easy.',
      'Barriers to entry include capital intensity, regulation, brand, scale, and switching costs. If plants are easy to finance and buyers switch for a small discount, incumbents cannot count on a protected return. That is the threat of entry. Supplier power is about the firms that sell inputs to the cement makers, which this fact pattern does not describe. Substitutes are a separate force; easy entry does not turn them off.',
    ),
    ask(
      'eq-industry',
      'easy',
      'Four national grocery chains buy most of the output of many small packaged-food producers. The chains have purchasing data the producers cannot see. Which force is strongest?',
      'Buyer power. Concentrated, informed customers can push price and terms.',
      'Supplier power, because the grocery chains supply food to the producers.',
      'Threat of entry by the food producers into each other’s plants.',
      'Buyers have power when they are concentrated relative to sellers, when they are price sensitive, and when they know more about demand than the sellers do. The chains are customers of the food producers, not their suppliers. Entry threats concern new food producers or new chains, not the existing producers entering one another’s existing plants. The margin in this industry is negotiated downstream.',
    ),
    ask(
      'eq-industry',
      'medium',
      'A single specialist fabricator supplies a patented valve that every maker of a fictional medical device must use. Switching would require a new regulatory filing. Which force does that create for the device makers?',
      'Supplier power. The valve vendor can take margin because it is hard to replace.',
      'Buyer power, because a patent always belongs to the customer.',
      'Rivalry among the device makers is lower, because a powerful supplier reduces competition.',
      'A concentrated, differentiated, hard-to-replace input is supplier power. It lets the vendor charge more of the value the device makers earn. The patent is the supplier’s, not the buyer’s. A powerful supplier does not calm rivalry among its customers; it taxes them, and they may compete even harder for the remaining margin.',
    ),
    ask(
      'eq-industry',
      'medium',
      'Travelers can choose a fictional intercity rail service or a new low-fare coach that makes the same trip in similar time. Ticket buyers compare the two on a phone. Which force is this?',
      'Threat of substitutes. The coach meets the same need and caps what the rail service can charge.',
      'Threat of entry into rail, because the coach company is a new rail operator.',
      'Supplier power, because passengers supply seats to the railway.',
      'A substitute is a different product that satisfies the same job. The coach does not have to be a rail operator to limit rail fares. Entry would be another rail firm on the same tracks. Passengers are buyers, not suppliers of the railway’s inputs. When substitution is one tap away, the rail firm’s pricing power is the thing the model should not take for granted.',
    ),
    ask(
      'eq-industry',
      'medium',
      'Several fictional airlines fly the same route, planes are leased and can be moved in, and fixed schedules mean an empty seat expires at departure. Price cuts are matched within a day. Which force is most intense?',
      'Rivalry. Similar products, flexible capacity, perishable inventory, and rapid matching make price competition severe.',
      'Threat of substitutes is the only force that can explain matching price cuts.',
      'Buyer power is low whenever a firm publishes a price, so rivalry cannot be high.',
      'Rivalry heats up when products are hard to tell apart, capacity can enter, and unsold inventory perishes. Matching a fare cut is the conduct that force produces. Substitutes, such as rail or video meetings, are a different force. Published prices do not imply weak buyers; on this route the buyers are choosing among lookalike seats, which is exactly why rivalry hurts the airlines.',
    ),
    ask(
      'eq-industry',
      'hard',
      'A fictional battery chemistry has a few pilot customers, very high prices, large ongoing losses, and no agreed standard. Demand growth is still slow because the product is being proven. Which life-cycle stage fits best?',
      'Embryonic. The market is unproven, investment is heavy, prices are high, and risk is high.',
      'Mature. Slow growth and industry losses are the definition of maturity.',
      'Decline. Losses mean demand has already peaked and capacity should be scrapped.',
      'The embryonic stage is the start: slow adoption, high prices, heavy investment, and a real chance the product never becomes a market. Growth comes later, when demand accelerates and prices often fall as scale arrives. Maturity is a developed market with slower but established demand, not a pilot market. Decline is shrinking demand for a product the market already adopted. Losses in a pilot are not the same fact as a sunset.',
    ),
    ask(
      'eq-industry',
      'medium',
      'A fictional household-cleaner category grows about as fast as population, brands are stable, and price increases stick only when input costs rise. A few firms earn steady returns and rarely enter or exit. Which stage is this?',
      'Mature. Growth is modest, competitive positions are established, and cash generation is steadier than in the early stages.',
      'Embryonic. Any industry with input costs is still being invented.',
      'Shakeout. Stable brands prove that weaker firms are currently failing in large numbers.',
      'Maturity is the settled phase: growth near the economy or the population, repeat purchase, and competition over share and cost rather than over whether the product exists. Embryonic industries do not have stable national brands and routine cost pass-through. Shakeout is the earlier slowdown when excess entrants are forced out. A mature firm can still be a good or a bad investment; the stage describes the competitive weather, not a buy rating.',
    ),
    ask(
      'eq-industry',
      'easy',
      'A government publishes a binding rule that cuts how much solvent a fictional coatings plant may emit, effective next year. In a PESTLE map, where does this sit?',
      'It is a legal and environmental factor. It can raise costs and change which plants remain viable.',
      'It is a pure social factor, because only consumer taste is affected by a binding rule.',
      'It sits outside PESTLE, because regulation is not part of industry analysis.',
      'PESTLE covers political, economic, social, technological, legal, and environmental forces. A binding emissions rule is legal, and the substance of the rule is environmental. It can force spending, close high-emitting lines, or favor a cleaner competitor. Consumer taste may also shift, but the rule itself is not only a social story. Leaving regulation out of industry work misses a force that can reprice the whole sector in one effective date.',
    ),
    ask(
      'eq-industry',
      'easy',
      'An analyst contrasts a fictional luxury-auto maker with a fictional staple-food producer. Which cyclicality statement is most accurate?',
      'Auto demand and pricing usually swing more with the economy. Staple food volumes are more defensive.',
      'Staple food is the cyclical industry, because people trade down only when incomes rise.',
      'Both are defensive, because both sell physical goods to households.',
      'Cyclical businesses sell goods that customers can postpone, and their operating leverage often amplifies the cycle. A car is that kind of purchase. Defensive businesses sell goods people keep buying in a downturn, and staple food is the usual example. Selling a physical good does not put a firm in either bucket. The distinction matters for the revenue path in a recession scenario.',
    ),
    ask(
      'eq-industry',
      'medium',
      'A fictional semiconductor foundry shows unit cost falling as cumulative wafers produced rise, even after this year’s utilization is held constant in the comparison. Which idea is that?',
      'The experience curve. Cumulative production, not just this year’s volume, can lower unit cost through learning.',
      'Operating leverage. Unit cost falls only when fixed costs are zero.',
      'Buyer power. Customers set the foundry’s unit cost by contract.',
      'The experience curve says cost per unit tends to fall as cumulative output rises, because people and processes learn. That is different from spreading this year’s fixed cost over this year’s volume, which is a utilization effect. Operating leverage is about how profit moves with sales, not about a learning-driven cost curve. Customers influence price more directly than they dictate the foundry’s accumulated learning.',
    ),
    ask(
      'eq-industry',
      'hard',
      'A fictional conglomerate sells cement, a software subscription, and a chain of clinics. A data vendor classifies the whole firm in “construction materials” because that segment is still the largest. What limitation of industry classification does this show?',
      'A single label follows a rule such as the largest segment and can hide businesses that should be valued and compared separately.',
      'Standard classifications split every segment into its own listed security, so the conglomerate problem does not arise.',
      'The construction-materials label means the software and clinic cash flows have the construction industry’s risk.',
      'Classifications such as GICS or ICB need one home for a company, often based on the main activity. That is useful for screens and benchmarks, and it is clumsy for a conglomerate. The software subscriptions and the clinics do not acquire cement-cycle risk because a vendor picked a label. Sum-of-the-parts analysis, using segment disclosure, is the repair. The classification does not legally split the company into separate listed shares.',
    ),
    ask(
      'eq-industry',
      'medium',
      'Three fictional railroads carry most of a region’s freight, and the customers are thousands of small shippers with no alternative. Which concentration reading is most accurate?',
      'High seller concentration plus fragmented buyers favors the railroads’ pricing power, subject to regulation and substitutes such as trucking.',
      'High seller concentration always destroys pricing power, because the three firms must undercut each other.',
      'Fragmented buyers give the buyers pricing power, so the railroads’ concentration does not matter.',
      'Concentration helps incumbents when buyers are weak and substitutes are poor. Three railroads facing many small shippers is that shape, until regulation, trucking, or a shipper coalition pushes back. Concentration does not guarantee a price war, and it does not become irrelevant just because someone computes it. The analyst still has to name the substitute and the regulator before turning concentration into a margin forecast.',
    ),
  ]
}

function forecast(): Draft[] {
  const companySales = 500_000_000 * 0.09
  const nextWc = 11_500_000 * 0.15
  const wcInvestment = nextWc - 1_400_000
  return [
    ask(
      'eq-forecast',
      'easy',
      'An analyst forecasts Finch & Timber by starting with regional housing starts, then timber demand, then the firm’s share of that demand. A second analyst starts with the firm’s mill capacity, contracted prices, and named customers. Which labels fit?',
      'The first build is top-down. The second is bottom-up. A useful file often checks that the two routes meet.',
      'The first build is bottom-up, because housing starts are a company asset. The second is top-down, because customers are an economy.',
      'Both are top-down, because any forecast that uses arithmetic is macroeconomic.',
      'Top-down starts with the economy or the industry and drills to a share. Bottom-up starts with the company’s own capacity, price list, and customers and builds revenue up. They should be reconciled: a bottom-up share that implies an implausible fraction of housing demand is a warning. The direction of the build, not the presence of arithmetic, is the distinction.',
    ),
    numQ(
      'eq-forecast',
      'easy',
      `Next year’s industry sales for a fictional specialty valve are ${usd(500_000_000, 0)}. Holloway Sensors’ share is forecast to rise from 8% to 9%. The firm’s forecast sales are closest to ${inline(String.raw`500{,}000{,}000 \times 0.09`)}.`,
      companySales,
      [500_000_000 * 0.08, 500_000_000 * 0.01],
      (value) => usd(value, 0),
      (formatted) =>
        `Company sales in this build are industry sales times the forecast share. ${inline(String.raw`500{,}000{,}000 \times 0.09`)} equals ${formatted}. Keeping the old 8% share understates the case the analyst actually wrote down. Taking only the one-point share gain produces the increment, not the revenue the firm will bill.`,
    ),
    ask(
      'eq-forecast',
      'medium',
      'A fictional packaged-food firm just printed a gross margin five points above its ten-year average after a temporary input glut. Competitors have idle plants. The base case holds the new margin forever. Which critique is most accurate?',
      'Without a barrier, abnormal margins in a competitive industry should be faded toward a normal level. Idle competitor capacity makes a permanent premium especially hard to defend.',
      'Margins are random and should be forecast to widen by the same five points every year.',
      'A margin above the firm’s own history is the best evidence that competition has ended, so the fade belongs only in the downside case that is discarded.',
      'Competitive forces attack excess margins. A one-year gift from input prices, with rivals able to add volume, is a poor base for a perpetual premium. Mean reversion is a modeling judgment, not a law that every margin collapses immediately, and it is not a reason to extrapolate the surprise further upward. The base case should say what stops rivals from copying the margin.',
    ),
    ask(
      'eq-forecast',
      'medium',
      'Northpine Timber’s forecast sets maintenance capital spending near depreciation and then adds a separate line for a new kiln. Which use of that split is most accurate?',
      'Maintenance near depreciation is a starting point for a stable asset base. The kiln is growth spending and must be justified by volume the existing mills cannot produce.',
      'All capital spending must equal depreciation, so the kiln line should be deleted or the model is inconsistent.',
      'Depreciation is cash, so maintenance spending is omitted to avoid counting the same cash twice.',
      'Depreciation allocates historical cost. Replacement cash can be near it for a steady mill and far from it if equipment prices or technology have moved. A new kiln is incremental capacity, not maintenance, and it belongs in the forecast only if the volume needs it. Deleting every project that is not equal to depreciation hides growth. Omitting the cash spend because depreciation was recognized double counts nothing: depreciation is not the cash outlay.',
    ),
    numQ(
      'eq-forecast',
      'medium',
      `Cinder & Rye Bakery’s sales are forecast at ${usd(11_500_000, 0)}. Noncash operating working capital is forecast at 15% of sales. The current working-capital balance is ${usd(1_400_000, 0)}. The cash investment in working capital is closest to ${inline(String.raw`0.15 \times 11{,}500{,}000 - 1{,}400{,}000`)}.`,
      wcInvestment,
      [nextWc, 1_400_000 * 0.15],
      (value) => usd(value, 0),
      (formatted) =>
        `The cash use is the increase in the balance, not the balance the firm already holds. Next year’s balance is ${usd(nextWc, 0)}, so the investment is ${formatted}. ${inline(String.raw`1{,}725{,}000 - 1{,}400{,}000`)} is that increase. Using the entire ending balance would treat existing flour, receivables, and payables as if they had to be purchased again.`,
    ),
    ask(
      'eq-forecast',
      'medium',
      'Kindling Software may win a platform contract. If it wins, revenue and hiring both step up. If it loses, both stay on the old path. Why is a scenario better than nudging the growth rate up by two points?',
      'The win and the loss are different operating states. A scenario can move revenue, cost, and capital together. A one-point nudge does not describe either state.',
      'Scenarios are discouraged, because a forecast is required to be a single number with no alternative.',
      'Nudging the growth rate is better, because it automatically builds the hiring that the contract would require.',
      'A contract win changes the shape of the business, not just the second decimal of a growth rate. Scenarios keep the links: more revenue, more staff, maybe more working capital, and a probability the analyst can argue about. A single nudged growth rate hides which state is being forecast and usually forgets the costs that come with the win. Publishing one number afterward is fine; pretending the alternative does not exist is the mistake.',
    ),
    ask(
      'eq-forecast',
      'hard',
      'An analyst runs a sensitivity that changes only the renewal rate, and a scenario in which a recession cuts volumes, lengthens collections, and stops price increases together. Which description is most accurate?',
      'Sensitivity isolates one driver. A scenario is a coherent story in which several drivers move in a way that could actually happen together.',
      'Sensitivity and scenario analysis are the same tool, because both change an input.',
      'A scenario may change only one driver, and a sensitivity must change every line of the model.',
      'Sensitivity answers “what if this one assumption is wrong?” It is a useful audit of the model’s nerve endings. A scenario answers “what if this world arrives?” and should be internally consistent: a recession that cuts volume but leaves collections and pricing untouched may be an incomplete story. Swapping the definitions produces a file that looks thorough and does not stress the links that break together.',
    ),
    ask(
      'eq-forecast',
      'medium',
      'The forecast raises Finch & Timber’s selling prices by 6% for inflation and leaves variable costs per unit unchanged. No productivity program is described. What is wrong with that combination?',
      'Inflation should be applied consistently unless a real margin change is an explicit thesis. Raising price and freezing cost invents a margin expansion.',
      'Costs should be inflated and prices held flat, because inflation never affects the price a firm charges.',
      'Inflation is excluded from both lines by convention, so the price increase should be removed and the margin will then be correct.',
      'If input prices and selling prices share an inflation regime, both belong in the forecast. Holding unit cost fixed while lifting price raises the real margin with no operating story. The reverse, inflating costs only, invents a margin collapse. A real improvement can still be forecast, and it should be labeled as productivity or pricing power rather than smuggled in as an inconsistent index.',
    ),
    ask(
      'eq-forecast',
      'easy',
      'Last year’s forecast for Rookery Software was 12% growth. The product lost a distribution partner this quarter. The new forecast is 11% because “we were close last time.” Which bias is that?',
      'Anchoring. The old number is doing the work that the lost partner should be doing.',
      'Mean reversion. Any forecast within a point of last year’s forecast is mean reversion by definition.',
      'Bottom-up forecasting, because 11% was calculated from customer records.',
      'Anchoring sticks to a reference number and adjusts too little. The lost partner is new information about the revenue base, and a one-point trim may not reflect the accounts that partner carried. Mean reversion is a statement about an economic series returning to a normal level, not a compliment for any small edit. A bottom-up forecast would name the customers and the churn, not the proximity to last year’s slide.',
    ),
    ask(
      'eq-forecast',
      'hard',
      'A ten-year forecast keeps Holloway Sensors’ unit growth at 18% while the industry is forecast to grow at 6%. No share ceiling is stated. Why is that path fragile?',
      'Sustained growth above the industry means the firm’s share rises every year. Without a reason it can keep taking share, the growth rate should fade.',
      'A firm cannot grow faster than its industry for even one year, so the first year must be cut to 6%.',
      'Share gains reduce risk, so a widening gap versus the industry justifies a lower discount rate and a higher perpetual growth rate.',
      'Share is a percent of a finite market. Growing 12 points faster than the industry, compounded, eventually implies a share the market cannot hold. A few years of share gains are ordinary and do not have to be cut to the industry rate immediately. A decade of them needs a moat, distribution, or a new market. It does not, by itself, make the business safer or license a higher terminal growth rate.',
    ),
  ]
}

const UNDER = 'Undervalued relative to the Gordon growth value.'
const OVER = 'Overvalued relative to the Gordon growth value.'
const FAIR = 'Fairly priced relative to the Gordon growth value.'

function gordonPrices(): Draft[] {
  const cases: Array<[string, number, number, number, Level]> = [
    ['Calder Rail', 1.5, 0.1, 0.04, 'easy'],
    ['Moth & Pine Outfitters', 2.4, 0.12, 0.03, 'medium'],
    ['Juniper Pay', 0.8, 0.09, 0.02, 'hard'],
    ['Southwharf Logistics', 3, 0.11, 0.05, 'easy'],
    ['Bellwether Clinics', 4.2, 0.13, 0.04, 'medium'],
    ['Arroyo Solar Glass', 1.1, 0.08, 0.03, 'hard'],
    ['Kindling Software', 5, 0.15, 0.06, 'easy'],
    ['Harbor & Holt Mutual', 2, 0.1, 0.05, 'medium'],
  ]
  return cases.map(([company, d0, r, g, difficulty]) => {
    const { d1, price } = math.gordon(d0, r, g)
    return numQ(
      'eq-valuation',
      difficulty,
      `${company} just paid a dividend of ${usd(d0, 2)}. Dividends are expected to grow at a constant ${pct(g, 2)}, and the required return is ${pct(r, 2)}. The Gordon growth value is closest to ${inline(String.raw`\frac{D_1}{r-g}`)}.`,
      price,
      [d0 / (r - g), d1 / r],
      (value) => usd(value, 2),
      (formatted) =>
        `Next year’s dividend is ${usd(d1, 2)}. ${inline(String.raw`\frac{D_1}{r-g}`)} equals ${formatted}. Dividing the dividend that was just paid, rather than next year’s dividend, understates the value. Discounting next year’s dividend as a no-growth perpetuity ignores the growth that the constant-growth model is built to include. The model requires growth to stay below the required return.`,
    )
  })
}

function leadingMultiples(): Draft[] {
  const cases: Array<[string, number, number, number, Level]> = [
    ['Glassorchard Foods', 0.4, 0.1, 0.04, 'easy'],
    ['Larchmont Sensors', 0.55, 0.12, 0.03, 'medium'],
    ['Pewterline Shipping', 0.7, 0.09, 0.04, 'hard'],
    ['Quaypoint Engineering', 0.3, 0.11, 0.05, 'easy'],
    ['Frostline Apparel', 0.5, 0.13, 0.04, 'medium'],
    ['Amberlane Motors', 0.45, 0.08, 0.02, 'hard'],
  ]
  return cases.map(([company, payout, r, g, difficulty]) => {
    const leading = math.justifiedLeadingPe(payout, r, g)
    const trailing = math.justifiedTrailingPe(payout, r, g)
    return numQ(
      'eq-valuation',
      difficulty,
      `${company} is expected to pay out ${pct(payout, 0)} of earnings. The required return is ${pct(r, 2)} and growth is a constant ${pct(g, 2)}. The justified leading P/E is closest to ${inline(String.raw`\frac{\text{payout}}{r-g}`)}.`,
      leading,
      [trailing, payout / r],
      times,
      (formatted) =>
        `Justified leading P/E uses next year’s earnings in the denominator of price over earnings, so growth enters once, through the denominator of ${inline(String.raw`\frac{\text{payout}}{r-g}`)}. The multiple is ${formatted}. The trailing justified multiple, ${times(trailing)}, is higher because it capitalizes last year’s smaller earnings. Dividing the payout by the required return alone drops growth out of a growing firm.`,
    )
  })
}

function trailingMultiples(): Draft[] {
  const cases: Array<[string, number, number, number, Level]> = [
    ['Briar Court Hotels', 0.6, 0.1, 0.04, 'easy'],
    ['Nightingale Audio', 0.35, 0.12, 0.06, 'medium'],
    ['Campo Verde Grain', 0.8, 0.11, 0.03, 'hard'],
    ['Hillcrest Looms', 0.25, 0.09, 0.02, 'easy'],
    ['Red Kettle Markets', 0.5, 0.14, 0.05, 'medium'],
    ['Brindle Bank', 0.65, 0.1, 0.05, 'hard'],
  ]
  return cases.map(([company, payout, r, g, difficulty]) => {
    const trailing = math.justifiedTrailingPe(payout, r, g)
    const leading = math.justifiedLeadingPe(payout, r, g)
    return numQ(
      'eq-valuation',
      difficulty,
      `${company} has a payout ratio of ${pct(payout, 0)}, a required return of ${pct(r, 2)}, and constant growth of ${pct(g, 2)}. The justified trailing P/E is closest to ${inline(String.raw`\frac{\text{payout}\times(1+g)}{r-g}`)}.`,
      trailing,
      [leading, (payout * (1 + g)) / r],
      times,
      (formatted) =>
        `Trailing price-to-earnings uses earnings that have already been reported, so the justified multiple grosses the payout up by growth. ${inline(String.raw`\frac{\text{payout}\times(1+g)}{r-g}`)} equals ${formatted}. The leading multiple of ${times(leading)} is the same model on next year’s earnings and is lower. Dropping the growth term from the denominator treats the firm as if growth did not change the capitalization rate.`,
    )
  })
}

function twoStageWrong(dividends: number[], r: number, g: number): [number, number] {
  const last = dividends[dividends.length - 1]
  const forgotTerminal = last / (r - g)
  const forgotGrowth = dividends.reduce((sum, dividend, index) => {
    const t = index + 1
    const cash = t === dividends.length ? dividend + forgotTerminal : dividend
    return sum + cash / (1 + r) ** t
  }, 0)
  const dividendsOnly = dividends.reduce((sum, dividend, index) => sum + dividend / (1 + r) ** (index + 1), 0)
  return [forgotGrowth, dividendsOnly]
}

function twoStageValues(): Draft[] {
  const cases: Array<[string, number[], number, number, Level]> = [
    ['Sable Finch Rail', [1.2, 1.44], 0.1, 0.04, 'medium'],
    ['Copperwhistle Mining', [2, 2.2, 2.42], 0.09, 0.03, 'hard'],
    ['Lantern Harbor Inns', [0.8, 1], 0.12, 0.05, 'easy'],
    ['Moss & Mile Delivery', [3, 3.3], 0.11, 0.04, 'medium'],
    ['Hearthscript Games', [1.5, 1.8, 2], 0.1, 0.03, 'hard'],
    ['Vale & Copper Insurance', [4, 4.4], 0.13, 0.04, 'easy'],
  ]
  return cases.map(([company, dividends, r, g, difficulty]) => {
    const price = math.twoStagePrice(dividends, r, g)
    const [forgotGrowth, dividendsOnly] = twoStageWrong(dividends, r, g)
    const listed = dividends.map((dividend, index) => `D${index + 1}=${dividend.toFixed(2)}`).join(', ')
    return numQ(
      'eq-valuation',
      difficulty,
      `${company} will pay dividends of ${listed}, and then dividends grow at ${pct(g, 2)} forever. The required return is ${pct(r, 2)}. The two-stage value is closest to ${block(String.raw`V_0=\sum_{t=1}^{n}\frac{D_t}{(1+r)^t}+\frac{P_n}{(1+r)^n}`)}.`,
      price,
      [forgotGrowth, dividendsOnly],
      (value) => usd(value, 2),
      (formatted) =>
        `The terminal price at the last explicit dividend uses ${inline(String.raw`P_n=\frac{D_n(1+g)}{r-g}`)} and is discounted along with that dividend. The present value is ${formatted}. Forgetting the growth step in the terminal price, or discounting only the explicit dividends and dropping the terminal value, leaves out the cash flows that usually dominate a short explicit stage.`,
    )
  })
}

function preferredStock(): Draft[] {
  const cases: Array<[string, number, number, Level]> = [
    ['Paperfinch Press', 2.4, 0.08, 'easy'],
    ['Iron Lantern Tools', 5, 0.1, 'medium'],
    ['Lowmarsh Ferries', 1.8, 0.06, 'hard'],
  ]
  return cases.map(([company, dividend, r, difficulty]) =>
    numQ(
      'eq-valuation',
      difficulty,
      `${company} has non-callable, non-convertible preferred stock that pays a perpetual annual dividend of ${usd(dividend, 2)}. The required return is ${pct(r, 2)}. The preferred value is closest to ${inline(String.raw`\frac{D}{r}`)}.`,
      dividend / r,
      [dividend / (1 + r), dividend * r],
      (value) => usd(value, 2),
      (formatted) =>
        `A level perpetual dividend is a perpetuity. ${inline(String.raw`\frac{D}{r}`)} equals ${formatted}. Discounting one dividend by a single year prices a one-period note, not a preferred stock that does not mature. Multiplying the dividend by the required return produces a dollar yield, not a price.`,
    ),
  )
}

function enterpriseValues(): Draft[] {
  const evSimple = 480 + 150 - 30
  const multiple = evSimple / 75
  const evFull = 250 + 100 + 40 + 20 - 15
  return [
    numQ(
      'eq-valuation',
      'easy',
      `Goldthread Textiles has a common-equity market value of ${usd(480, 0)} million, interest-bearing debt of ${usd(150, 0)} million, and cash of ${usd(30, 0)} million. Enterprise value is closest to ${inline(String.raw`480 + 150 - 30`)}.`,
      evSimple,
      [480 + 150, 480 - 30],
      (value) => `${usd(value, 0)} million`,
      (formatted) =>
        `Enterprise value is the value of core operations to all capital providers: equity plus debt minus cash. ${inline(String.raw`480+150-30`)} equals ${formatted}. Leaving the cash in double counts a non-operating asset the equity value already includes. Subtracting cash from equity alone is an equity figure, not enterprise value.`,
    ),
    numQ(
      'eq-valuation',
      'medium',
      `Using Goldthread’s enterprise value of ${usd(evSimple, 0)} million and EBITDA of ${usd(75, 0)} million, EV/EBITDA is closest to ${inline(String.raw`\frac{600}{75}`)}.`,
      multiple,
      [(480 + 150) / 75, (480 - 30) / 75],
      times,
      (formatted) =>
        `The multiple divides enterprise value by EBITDA. ${inline(String.raw`\frac{600}{75}`)} equals ${formatted}. Adding debt and forgetting to subtract cash uses a larger enterprise value. Subtracting cash from equity and then dividing by EBITDA answers a different, equity-side question with a pre-interest earnings number, which mixes the claimholders.`,
    ),
    numQ(
      'eq-valuation',
      'hard',
      `Plover Ridge Hotels has common equity of ${usd(250, 0)} million, debt of ${usd(100, 0)} million, preferred stock of ${usd(40, 0)} million, noncontrolling interest of ${usd(20, 0)} million, and cash of ${usd(15, 0)} million. Enterprise value is closest to ${inline(String.raw`250+100+40+20-15`)}.`,
      evFull,
      [250 + 100 - 15, 250 + 100 + 40 + 20 + 15],
      (value) => `${usd(value, 0)} million`,
      (formatted) =>
        `A fuller enterprise value adds claims that are not common equity and are not operating liabilities: debt, preferred, and noncontrolling interest, then subtracts cash. ${inline(String.raw`250+100+40+20-15`)} equals ${formatted}. Stopping at common equity plus debt minus cash omits claims that EBITDA is also earned for. Adding cash instead of subtracting it treats surplus cash as an operating asset that the buyer must pay for twice.`,
    ),
    ask(
      'eq-valuation',
      'medium',
      'Two fictional manufacturers have similar operations and very different debt levels. An analyst wants a multiple that does not reward the more levered firm just because interest reduced its earnings. Which choice fits?',
      'EV/EBITDA. EBITDA is before interest, and enterprise value includes debt, so the multiple is aimed at operating value rather than at equity earnings.',
      'Trailing P/E. Net income is before interest, so leverage cannot affect the multiple.',
      'Price to book. Book equity rises when the firm borrows, so leverage drops out of the ratio.',
      'Enterprise value is equity plus net debt, and EBITDA is profit before interest, tax, and depreciation. Firms with different capital structures can be compared on that operating multiple more fairly than on net income, which is after interest. Borrowing does not increase book equity; it increases assets and liabilities. P/E remains useful, and it answers an equity question that already includes the capital structure.',
    ),
  ]
}

function mispricing(): Draft[] {
  const cases: Array<[string, number, number, number, number, 'under' | 'over' | 'fair', Level]> = [
    ['Finch & Timber', 1.5, 0.1, 0.04, 20, 'under', 'easy'],
    ['Rookery Software', 2, 0.1, 0.05, 55, 'over', 'medium'],
    ['Barleyhouse Foods', 3, 0.11, 0.05, 52.5, 'fair', 'hard'],
    ['Windmill Cement', 4.2, 0.13, 0.04, 36, 'under', 'medium'],
    ['Otterbend Cider', 0.8, 0.09, 0.02, 18, 'over', 'hard'],
  ]
  const text = { under: UNDER, over: OVER, fair: FAIR }
  return cases.map(([company, d0, r, g, market, verdict, difficulty]) => {
    const { price } = math.gordon(d0, r, g)
    const correct = text[verdict]
    const wrongs = [UNDER, OVER, FAIR].filter((choice) => choice !== correct) as [string, string]
    return ask(
      'eq-valuation',
      difficulty,
      `${company} just paid ${usd(d0, 2)}. Constant growth is ${pct(g, 2)}, the required return is ${pct(r, 2)}, and the market price is ${usd(market, 2)}. Using ${inline(String.raw`P_0=\frac{D_1}{r-g}`)}, the share is best described as which of the following?`,
      correct,
      wrongs[0],
      wrongs[1],
      `The Gordon value is ${usd(price, 2)}. ${inline(String.raw`P_0=\frac{D_1}{r-g}`)} is the comparison with the market price of ${usd(market, 2)}. ${correct} A market price below that value is a buy on this model, a market price above it is a sell on this model, and a match is a fair price on this model. The conclusion is only as good as the constant-growth assumptions.`,
    )
  })
}

function growthLink(): Draft[] {
  const retention = 0.6
  const roe = 0.18
  const g = retention * roe
  const d0 = 2
  const payout = 0.5
  const consistentG = (1 - payout) * 0.12
  const r = 0.1
  const { d1, price } = math.gordon(d0, r, consistentG)
  return [
    numQ(
      'eq-valuation',
      'easy',
      `Saltmere Fisheries retains 60% of earnings and earns an ROE of 18%. The sustainable growth rate is closest to ${inline(String.raw`0.60 \times 0.18`)}.`,
      g,
      [0.4 * roe, roe],
      (value) => pct(value, 2),
      (formatted) =>
        `Sustainable growth is the retention ratio times ROE. ${inline(String.raw`0.60 \times 0.18`)} equals ${formatted}. Using the payout ratio instead of the retention ratio grows the firm only with the earnings it does not keep. Using ROE alone assumes every dollar of earnings is reinvested.`,
    ),
    ask(
      'eq-valuation',
      'hard',
      'A firm raises its retention ratio and leaves ROE and the required return unchanged. What does the Gordon model say about the value effect?',
      'Growth rises, and the payout falls. The net effect on price is ambiguous, because a higher growth rate and a smaller dividend pull in opposite directions.',
      'Price always rises, because any increase in the growth rate raises a Gordon value when the payout is ignored.',
      'Price always falls, because a lower payout reduces next year’s dividend and the growth rate does not enter the model.',
      'Retention raises g = b × ROE and cuts the payout that sets the dividend. In the Gordon expression those two moves conflict. Whether value rises depends on whether the firm earns more on the retained dollar than shareholders require. Quoting only the higher growth rate, or only the lower dividend, tells half of the story the formula is built from.',
    ),
    ask(
      'eq-valuation',
      'medium',
      'An analyst plugs a long-run growth rate equal to the required return into a Gordon model for a mature fictional utility. What is the modeling consequence?',
      'The model is unusable. Constant growth must stay below the required return, so a multistage model or a lower perpetual growth rate is required.',
      'The price equals next year’s dividend, because a zero denominator is interpreted as a one-year holding period.',
      'The price is zero, because a mature firm is not allowed to grow at the required return.',
      'The Gordon denominator is r − g. When growth equals the required return the expression explodes, and when growth exceeds it the result is economically nonsense for a stable dividend stream. A mature utility needs a perpetual growth rate below the required return, often near long-run economy growth, or an explicit stage that fades down to such a rate. The fix is to change the horizon or the growth assumption, not to reinterpret a zero denominator as a one-year price.',
    ),
    numQ(
      'eq-valuation',
      'hard',
      `Moss & Mile Delivery just paid a dividend of ${usd(2, 2)}. It pays out half of earnings, ROE is 12%, and the required return is 10%. Using a growth rate equal to retention times ROE, the Gordon value is closest to ${inline(String.raw`\frac{2\times(1+g)}{0.10-g}`)}.`,
      price,
      [d0 / (r - consistentG), d1 / r],
      (value) => usd(value, 2),
      (formatted) =>
        `Retention is 50% and ROE is 12%, so g is ${pct(consistentG, 2)}. Next year’s dividend is ${usd(d1, 2)}. ${inline(String.raw`\frac{2.12}{0.10-0.06}`)} equals ${formatted}. Dividing the dividend just paid by r − g skips a year of growth. Discounting next year’s dividend with no growth uses a 10% perpetuity and ignores the ROE the firm earns on retained earnings. The inputs are internally consistent: the payout, the ROE, and the growth rate describe the same dividend policy.`,
    ),
  ]
}

function multipleUse(): Draft[] {
  return [
    ask(
      'eq-valuation',
      'medium',
      'Trailing earnings at Vale & Copper Insurance include a large one-time gain on a building sale. A leading earnings estimate excludes that gain. Which P/E comparison is most careful?',
      'The trailing P/E looks cheaper than it should because the gain inflated the denominator. The leading P/E is aimed at ongoing earnings, and it is only as good as the forecast.',
      'The trailing P/E is always the better value signal, because reported earnings cannot contain one-time items.',
      'The leading P/E must be higher than the trailing P/E whenever next year’s earnings exclude a gain.',
      'A one-time gain raises trailing earnings and shrinks the trailing multiple, which can make a rich price look ordinary. Leading earnings that strip the gain answer the question a buyer actually has: what is paid for the earnings that can recur. That advantage depends on the analyst’s forecast being honest. There is no rule that the leading multiple is numerically higher; if the gain was large, trailing earnings can exceed next year’s ongoing earnings and the trailing multiple can be the smaller one.',
    ),
    ask(
      'eq-valuation',
      'medium',
      'Brindle Bank’s assets are mostly loans and securities that are marked or closely monitored. A software firm’s assets are mostly unrecognized product-development spending. For which firm is price-to-book more informative, and why?',
      'The bank. Its book value is closer to a current value of separable financial assets, and a higher ROE supports a higher justified price-to-book.',
      'The software firm. Price-to-book is most useful when book value omits the assets that produce the earnings.',
      'Neither. Price-to-book is defined only for industrial firms with plant and equipment.',
      'Book value is a poor anchor when the economic assets never entered the balance sheet. A bank’s equity is closer to the accounting value of financial assets minus obligations, so price-to-book has a long tradition in financials. Justified price-to-book rises with ROE: a firm that earns more on book equity can command a higher multiple of that book. The software firm may be a fine business and a poor P/B comp. The ratio is not restricted to industrials.',
    ),
    ask(
      'eq-valuation',
      'easy',
      'Hearthscript Games is losing money, so its P/E is not meaningful. An analyst switches to price-to-sales. Which caution still applies?',
      'A low price-to-sales ratio is not evidence of cheapness if the firm cannot convert sales into profit. The multiple ignores margins.',
      'Price-to-sales below 1 means the shares are cheap by definition, whatever the margin.',
      'Price-to-sales can be used only when earnings are positive, so the switch is invalid.',
      'Sales are harder to drive negative with accounting than earnings are, which is why P/S is used for unprofitable or differently capitalized firms. The cost of that stability is that the multiple does not contain the margin. A firm can trade at a low multiple of sales and still destroy value if it never keeps any of the sales dollar. P/S does not require positive earnings; that is the situation that makes it useful.',
    ),
    ask(
      'eq-valuation',
      'hard',
      'Two fictional chains report the same P/E. One is financed mostly with equity. The other has large debt, so its net income is after a heavy interest bill and its equity value is a smaller slice of the enterprise. Why can EV/EBITDA rank them differently from P/E?',
      'P/E is an equity multiple after interest. EV/EBITDA capitalizes operating earnings on the value of debt and equity together, so the levered firm is not flattered just because its equity base is small.',
      'EV/EBITDA is an equity multiple, so it always ranks firms in the same order as P/E.',
      'P/E removes leverage by adding after-tax interest back to net income, so the two multiples cannot disagree.',
      'Net income belongs to common equity and has already paid interest. A levered firm can have a small equity value and a modest earnings number for reasons that are capital structure, not operations. Enterprise value puts the debt back in, and EBITDA takes the interest back out. The ranking can change. P/E does not add interest back; that add-back is closer to an enterprise-earnings idea. The two multiples answer related but different questions.',
    ),
  ]
}

function modelLimits(): Draft[] {
  return [
    ask(
      'eq-valuation',
      'medium',
      'Kindling Software pays no dividend and has said it will not start one. Free cash flow to equity is positive. Why is a Gordon model a poor tool here?',
      'A zero dividend produces a zero Gordon value and ignores cash the firm could pay. FCFE or a price multiple is a better fit when dividends do not measure earning power.',
      'The Gordon model is required for non-dividend payers, and the value equals the most recent free cash flow.',
      'A zero dividend means the shares are worthless, so the Gordon value of zero is the correct conclusion.',
      'Dividend discount models need a dividend stream that reflects the cash owners can claim. If the firm will not pay one, the model prices the policy rather than the earning power. Free cash flow to equity estimates what could be paid after reinvestment and debt flows. A price multiple can be used when a cash-flow forecast is too thin. Zero is the model’s output, not evidence that the business has no value.',
    ),
    ask(
      'eq-valuation',
      'easy',
      'An analyst values a fictional regional grocer on the median P/E of a set of global software firms because both groups are listed. What is wrong with the comparable set?',
      'Comparables should share industry economics, growth, risk, and accounting. A software median is a weak benchmark for a grocer.',
      'Any listed firm is a valid comparable, because the multiple is a market fact and the industry does not matter.',
      'Grocers can be compared only with firms that have the same trailing earnings per share in currency units.',
      'A multiple is a price for a set of fundamentals. Software and grocery firms do not share growth, margins, capital intensity, or risk, so the software median does not tell you what the grocer’s earnings are worth. Listing on an exchange is not a comparable-company screen. Matching earnings per share in currency units is neither necessary nor sufficient; a firm with the same EPS and a different business can deserve a very different multiple.',
    ),
    ask(
      'eq-valuation',
      'medium',
      'Liquidation value is being used as the main estimate for a fictional consulting partnership whose assets are laptops and whose value is the staff. Which critique is most accurate?',
      'Asset-based liquidation value fits separable, marketable assets. It misses human capital and is a poor going-concern value for a people business.',
      'Liquidation value is the preferred value for any firm with positive earnings, because assets are easier to audit than cash flows.',
      'A people business has a liquidation value equal to next year’s payroll, so the laptop balance is irrelevant and the method works.',
      'Selling the laptops tells you what a breakup would raise, not what the clients and the staff are worth as a going concern. Asset-based valuation is more at home with banks, insurers, resource firms, or a firm that is actually being liquidated. Payroll is a cost, not a liquidation proceeds figure. Choosing the method because earnings exist reverses the usual reason to abandon a dividend model: you use assets when earnings are not the point, and you do not ignore earnings when they are the point.',
    ),
    ask(
      'eq-valuation',
      'hard',
      'For the same payout, required return, and growth rate, how do justified leading and trailing P/E multiples compare, and why does the choice matter?',
      'The justified leading multiple is lower. It is price divided by next year’s larger earnings, while the trailing multiple uses last year’s earnings and grosses the payout up by growth.',
      'They are equal whenever growth is positive, because both contain the payout ratio.',
      'The justified leading multiple is higher, because forecasts are less reliable than reported earnings.',
      'Justified trailing P/E is payout times (1 + g) over (r − g). Justified leading P/E is payout over (r − g). With positive growth the trailing multiple is larger, since last year’s earnings are the smaller base. Reliability is a reason to be humble about the leading earnings forecast; it does not flip the algebra. Mixing a trailing price with a leading multiple, or the reverse, misstates how expensive the share is.',
    ),
  ]
}

function otherValuation(): Draft[] {
  return [
    ask(
      'eq-valuation',
      'medium',
      'A fictional conglomerate has a cement plant, a software subscription, and a clinic chain. One blended P/E is hard to defend. Which approach fits the structure?',
      'Sum of the parts: value each segment on the drivers and multiples of its own industry, then subtract net debt and other claims.',
      'Use the cement industry P/E on the conglomerate’s total earnings, because the largest segment sets every other segment’s multiple.',
      'Sum of the parts adds the three enterprise values and then adds net debt again so the equity value is conservative.',
      'Different businesses do not deserve one multiple just because they share a parent. Segment revenue, margins, and capital intensity support separate values. Equity value is the sum of the parts minus net debt and minus other claims that are not common equity. Adding debt instead of subtracting it leaves the lenders’ claim inside the equity value. Using the cement multiple on software earnings imports the wrong industry.',
    ),
    ask(
      'eq-valuation',
      'hard',
      'A controlling shareholder is negotiating to buy the rest of Lowmarsh Ferries. The shares already trade, and the public price reflects small trades by minority holders. How can the negotiated value differ from that price?',
      'The buyer may pay a control premium over the minority trading price, because control includes decisions the public shareholder does not have.',
      'Control must be priced at a discount to the minority price, because a buyer of the whole firm takes less risk.',
      'A listed price is always a control value, so a negotiated purchase at any other price is an accounting error.',
      'The exchange price is typically a minority, marketable price for a small lot. Control can be worth more because the buyer can change capital structure, operations, and dividends. A control premium is that difference. It is not a discount for taking “less risk,” and the listed price does not automatically include it. Fairness analysis often starts from the market price and then asks whether control, synergies, or illiquidity explain a gap.',
    ),
    ask(
      'eq-valuation',
      'easy',
      'A healthy fictional insurer is expected to keep writing policies. An analyst values it by assuming every asset is sold this afternoon at a distressed price. Which conceptual mistake is that?',
      'Using a liquidation premise for a going concern. Distressed exit prices are not the value of assets that will be held and used.',
      'Using a going-concern premise, because any use of asset values is a liquidation model.',
      'No mistake. Insurance assets are always valued at a same-day distressed sale price under the valuation standards.',
      'Going-concern value assumes the business continues and its assets earn returns in place. Liquidation value assumes they are sold, often quickly and below ongoing value. Applying distressed exit prices to a healthy insurer understates the franchise and misreads assets that will not be sold this afternoon. Asset-based valuation can still be appropriate for an insurer; the error is the distressed premise, not the use of the balance sheet.',
    ),
  ]
}

function valuation(): Draft[] {
  return [
    ...gordonPrices(),
    ...leadingMultiples(),
    ...trailingMultiples(),
    ...twoStageValues(),
    ...preferredStock(),
    ...enterpriseValues(),
    ...mispricing(),
    ...growthLink(),
    ...multipleUse(),
    ...modelLimits(),
    ...otherValuation(),
  ]
}

export function buildEquity(): Draft[] {
  return unique([
    ...take('eq-markets', 16, markets()),
    ...take('eq-indexes', 16, indexes()),
    ...take('eq-efficiency', 14, efficiency()),
    ...take('eq-overview', 12, overview()),
    ...take('eq-past', 12, past()),
    ...take('eq-industry', 12, industry()),
    ...take('eq-forecast', 10, forecast()),
    ...take('eq-valuation', 53, valuation()),
  ])
}

function main(): void {
  const drafts = buildEquity()
  const questions = finalizeTopic('equity', drafts)
  console.log(questions.length)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
