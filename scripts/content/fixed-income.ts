import { pathToFileURL } from 'node:url'
import { exactly, finalizeTopic, numeric, q, type Draft } from '../author.ts'
import { block, inline, num, pct } from '../../src/lib/format.ts'
import * as math from '../../src/lib/formulas.ts'

const topicId = 'fixed-income' as const
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
        throw new Error(`Missing KaTeX for ${losId}: ${stem.slice(0, 100)}`)
      }
      return text
    },
  })
}

const px = (value: number) => num(value, 2)
const rate = (value: number) => pct(value, 2)
const yearsFmt = (value: number) => num(value, 2)

function cash(value: number): string {
  const negative = value < 0
  const [whole, frac] = Math.abs(value).toFixed(2).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}${grouped}.${frac}`
}

function bondPriceQuestion(args: {
  difficulty: Level
  issuer: string
  coupon: number
  ytm: number
  years: number
  frequency: 1 | 2
}): Draft {
  const face = 100
  const price = math.bondPrice(face, args.coupon, args.ytm, args.years, args.frequency)
  const periods = args.years * args.frequency
  const payment = (face * args.coupon) / args.frequency
  const periodRate = args.ytm / args.frequency
  const payLabel = args.frequency === 1 ? 'annual-pay' : 'semiannual-pay'
  const relation =
    args.coupon > args.ytm + 1e-12
      ? 'above the yield, so the bond is a premium bond'
      : args.coupon < args.ytm - 1e-12
        ? 'below the yield, so the bond is a discount bond'
        : 'equal to the yield, so the bond is priced at par'
  const stem =
    `${args.issuer} has a ${args.years}-year ${payLabel} bond with a coupon rate of ${pct(args.coupon)} and a yield to maturity of ${pct(args.ytm)}. ` +
    `On a coupon date, the full price per 100 of face, ${inline(String.raw`P=\sum_{t=1}^{${periods}}\frac{C/k}{(1+y/k)^{t}}+\frac{100}{(1+y/k)^{${periods}}}`)}, is closest to:`
  return numQ(
    'fi-price',
    args.difficulty,
    stem,
    price,
    [
      math.bondPrice(face, args.coupon, args.ytm, args.years, args.frequency === 1 ? 2 : 1),
      math.bondPrice(face, 0, args.ytm, args.years, args.frequency),
      math.bondPrice(face, args.coupon, args.ytm + 0.01, args.years, args.frequency),
      math.bondPrice(face, args.coupon, Math.max(args.ytm - 0.015, 0.005), args.years, args.frequency),
      face * (1 + args.coupon),
      face * (args.coupon / args.ytm),
    ],
    px,
    (shown) =>
      `Discount every promised coupon and the principal at the bond's yield. There are ${periods} periods, each coupon is ${num(payment, 2)}, and the discount rate per period is ${num(periodRate, 4)}. ` +
      `${block(String.raw`P=\sum_{t=1}^{${periods}}\frac{${num(payment, 2)}}{(1+${num(periodRate, 4)})^{t}}+\frac{100}{(1+${num(periodRate, 4)})^{${periods}}}`)} ` +
      `The expression equals ${num(price, 4)}. The coupon of ${pct(args.coupon)} is ${relation}. Accrued interest is zero on a coupon date, so the full price is closest to ${shown}.`,
  )
}

function zeroPriceQuestion(issuer: string, ytm: number, years: number, difficulty: Level): Draft {
  const price = math.bondPrice(100, 0, ytm, years, 1)
  const stem =
    `${issuer} issues a ${years}-year zero-coupon bond at a yield of ${pct(ytm)}. ` +
    `The price per 100 of face, ${inline(String.raw`P=\frac{100}{(1+y)^{${years}}}`)}, is closest to:`
  return numQ(
    'fi-price',
    difficulty,
    stem,
    price,
    [100, 100 / (1 + ytm), 100 * (1 - ytm * years), math.bondPrice(100, ytm, ytm, years, 1), price + 5, price - 4],
    px,
    (shown) =>
      `A zero pays no coupon, so the only cash flow is the face amount at maturity. ${block(String.raw`P=\frac{100}{(1+${num(ytm, 4)})^{${years}}}=${num(price, 4)}`)} ` +
      `There is nothing to add for accrued interest. The discount price is closest to ${shown}.`,
  )
}

function spotPriceQuestion(args: {
  difficulty: Level
  issuer: string
  coupon: number
  spots: number[]
}): Draft {
  const face = 100
  const payment = face * args.coupon
  const n = args.spots.length
  let price = 0
  const parts: string[] = []
  for (let t = 1; t <= n; t += 1) {
    const cashFlow = t === n ? payment + face : payment
    const spot = args.spots[t - 1] ?? 0
    price += cashFlow / (1 + spot) ** t
    parts.push(String.raw`\frac{${num(cashFlow, 2)}}{(1+${num(spot, 4)})^{${t}}}`)
  }
  const longest = args.spots[n - 1] ?? 0
  const shortest = args.spots[0] ?? 0
  const stem =
    `${args.issuer} values a ${n}-year annual-pay bond with a ${pct(args.coupon)} coupon by discounting each cash flow at its own spot rate. ` +
    `The spots are ${args.spots.map((spot) => pct(spot)).join(', ')}. The price per 100 of face, ${inline(String.raw`P=\sum_{t=1}^{${n}}\frac{CF_t}{(1+z_t)^{t}}`)}, is closest to:`
  return numQ(
    'fi-price',
    args.difficulty,
    stem,
    price,
    [
      math.bondPrice(face, args.coupon, longest, n, 1),
      math.bondPrice(face, args.coupon, shortest, n, 1),
      math.bondPrice(face, args.coupon, args.spots.reduce((sum, spot) => sum + spot, 0) / n, n, 1),
      price + 1.75,
      price - 1.65,
    ],
    px,
    (shown) =>
      `A spot rate discounts a single payment. Using a different spot for each maturity gives ${block(`${parts.join('+')}`)} ` +
      `which sums to ${num(price, 4)}. Discounting every cash flow at the longest spot, or at the shortest spot, answers a different question. The spot-rate price is closest to ${shown}.`,
  )
}

function features(): Draft[] {
  return rows('fi-features', [
    [
      'easy',
      'Harborline Holdings sells a new senior note to investors. Which document is the bond contract that states the coupon, the maturity, the seniority, and the covenants?',
      'The indenture',
      'The secondary-market trade confirmation, which replaces the contract after issuance',
      'The dealer inventory report, which sets the legal coupon',
      'The indenture is the contract between the issuer and the bondholders. It states what Harborline Holdings must pay and which promises protect the lenders. A trade confirmation records a secondary purchase, and a dealer report is not the legal contract.',
    ],
    [
      'medium',
      'The notes of Bramble and Co. require the issuer to keep EBIT coverage of interest at or above 3 times and to send audited financial statements to the trustee. Those promises are best described as:',
      'Affirmative covenants',
      'Negative covenants that forbid the coverage ratio from being calculated',
      'Embedded call options that let investors change the coupon',
      'An affirmative covenant requires the issuer to do something, such as maintain a coverage ratio or report results. A negative covenant forbids an action, such as adding secured debt. A coverage promise is a lender protection in the indenture, not an option that resets the coupon.',
    ],
    [
      'medium',
      'Northveil Industrials bond indenture forbids the company from pledging assets to new lenders unless the existing notes are secured equally and ratably. This clause is best described as:',
      'A negative pledge, which is a negative covenant',
      'An affirmative covenant requiring Northveil Industrials to pledge the assets immediately',
      'A conversion option that turns the notes into common equity',
      'A negative covenant limits what the issuer may do. A negative pledge stops the company from giving a new lender a senior claim on assets unless existing bondholders share that security. It does not force an immediate pledge, and it is not an equity conversion.',
    ],
    [
      'easy',
      'Cinderwell Utilities issues a five-year note that pays no periodic coupon and is sold below face value. Which statement about the note is most accurate?',
      'The only promised cash flow is the face amount at maturity',
      'The issuer pays a cash coupon each year equal to the original discount',
      'The investor receives interest semiannually and principal in five equal parts',
      'A zero-coupon bond is issued at a discount and pays no periodic coupon. The investor is promised the face amount at maturity. The discount is the economic interest, but it is not paid as a cash coupon and the principal is not amortized.',
    ],
    [
      'hard',
      'Larkspur Foods has both first-lien notes and senior unsecured notes outstanding. If the company is reorganized, the first-lien notes most likely have:',
      'A priority claim on the pledged collateral ahead of the senior unsecured notes',
      'The same recovery rank as the senior unsecured notes because both are labeled senior',
      'A claim junior to the senior unsecured notes because a lien reduces the coupon',
      'Secured status gives the first-lien holders a priority claim on the pledged assets. The word senior describes rank, but it does not erase the lien. Senior unsecured creditors share what remains after the collateral claim is satisfied, so their expected recovery on those assets is lower.',
    ],
    [
      'medium',
      'Vellum Rail issues a bond whose coupon resets each quarter to a reference rate plus 1.20%. Relative to an otherwise identical fixed-coupon bond, this instrument most likely:',
      'Keeps its price nearer to par when the reference rate changes, but can still fall if the credit spread widens',
      'Eliminates credit-spread risk because the quoted margin is written in the indenture',
      'Pays a coupon that is fixed on the pricing date and never resets',
      'A floating-rate note passes reference-rate changes through to the coupon, so interest-rate moves leave the price closer to par than on a fixed-rate bond. The quoted margin does not update when the issuer credit spread changes, so spread widening can still push the price below par.',
    ],
  ])
}

function cashflows(): Draft[] {
  return rows('fi-cashflows', [
    [
      'easy',
      'Pebbleford Mining seven-year notes pay interest once a year and repay the entire principal on the final maturity date. The principal structure is best described as:',
      'A bullet structure',
      'A fully amortizing structure',
      'A pass-through structure that distributes principal whenever any investor asks',
      'A bullet bond pays coupons during its life and repays the entire principal at maturity. An amortizing bond returns principal over time. A pass-through is a securitization structure, not the name for this single corporate note.',
    ],
    [
      'medium',
      'Quill and Oak Retail can fund a store with a 10-year bullet bond or a 10-year fully amortizing bond, both carrying the same coupon rate and yield. The amortizing bond most likely has:',
      'Less price sensitivity to a yield change because principal is received earlier',
      'More price sensitivity because every payment includes interest',
      'The same Macaulay duration as the bullet because both contracts end in 10 years',
      'An amortizing bond pays principal along the way, so the present-value-weighted time to receive cash is shorter than on a bullet bond with the same final date. A shorter Macaulay duration means a smaller price change for a given yield move. Matching the final maturity does not match the timing of principal.',
    ],
    [
      'easy',
      'Ironwharf Logistics issues a bond that the company may redeem at a stated price after year three. That embedded call most likely:',
      'Benefits the issuer, so investors demand a higher yield than on an option-free bond',
      'Benefits the investor, who can force repayment when rates rise',
      'Has no effect on the required yield because the redemption price equals par',
      'A call lets the issuer redeem the bond when refunding is attractive, usually after yields fall. Investors bear reinvestment risk and a cap on price appreciation, so they demand compensation in a higher yield or a call premium. A put, not a call, benefits the investor.',
    ],
    [
      'easy',
      'Redcedar Paper bonds allow each holder to put the bond back to the issuer at par if a stated leverage ratio is breached. That put most likely:',
      'Benefits the investor and can justify a lower yield than an option-free bond',
      'Benefits the issuer by forcing investors to extend maturity when leverage rises',
      'Is a negative covenant rather than an embedded option',
      'A put gives the bondholder the right to sell the bond back, typically when credit or rates move against the holder. That right has value, so investors can accept a lower yield than on an otherwise identical option-free bond. The issuer is the party who must pay if the put is exercised.',
    ],
    [
      'medium',
      'Marlowe Glass issues a convertible bond with a lower coupon than its option-free senior notes of the same maturity. The lower coupon is most likely compensation for:',
      'The investor option to convert the bond into common equity',
      'An issuer call that investors would otherwise refuse',
      'A higher ranking in bankruptcy than the senior notes',
      'Conversion is an option granted to the investor. Buyers pay for that equity upside by accepting a lower coupon. An issuer call would push the coupon up, not down. Conversion does not give the bond a better bankruptcy rank than senior notes; it adds an equity option to a debt claim.',
    ],
    [
      'hard',
      'Which feature of a Thistlegate Insurance subordinated bond can, by itself, change the timing of the promised cash flows when the holder or the issuer exercises it?',
      'An embedded call option',
      'A negative pledge covenant',
      'An affirmative promise to publish audited statements within 90 days',
      'Contingency provisions such as calls, puts, and conversion rights change the amount or timing of cash flows when they are exercised. Covenants are promises. A negative pledge or a reporting promise protects lenders, but neither is an option that the issuer or the investor exercises to reshape the coupon schedule.',
    ],
  ])
}

function issuance(): Draft[] {
  return rows('fi-issuance', [
    [
      'easy',
      'Copperlane Transit sells a new 10-year note through a dealer syndicate and receives the proceeds. That sale takes place in:',
      'The primary market',
      'The secondary market',
      'The futures market, because the first coupon has not yet been paid',
      'The primary market is where the issuer raises new cash. After the notes are outstanding, trades among investors occur in the secondary market and do not send proceeds to Copperlane Transit. An unpaid first coupon does not turn the new issue into a futures contract.',
    ],
    [
      'medium',
      'A syndicate agrees to purchase the entire new bond issue of Fennelbrook Agriculture and then resell it. The syndicate bears the risk that investors will not take the bonds at the agreed price. This arrangement is:',
      'An underwritten, or firm-commitment, offering',
      'A best-efforts offering',
      'A private placement in which the syndicate only advises and never takes the bonds',
      'In an underwritten offering the intermediaries buy the issue and take placement risk. In a best-efforts offering they attempt to sell the bonds but do not guarantee the proceeds. A private placement is a direct sale to a limited group of investors, not a syndicate purchase.',
    ],
    [
      'medium',
      'Glasswater Hotels registers a maximum amount of bonds that dealers may sell from time to time over two years when the company wants funding. This issuance method is best described as:',
      'A shelf registration, with later takedowns',
      'A single firm-commitment underwriting of the entire two-year amount on the registration date',
      'A sovereign auction in which a central bank sets the coupon',
      'A shelf registration lets an issuer register a maximum amount and issue portions later, often as medium-term notes, when funding is needed. The full amount is not necessarily purchased by a syndicate on day one. A central-bank auction is a government technique, not the corporate shelf described here.',
    ],
    [
      'hard',
      'Compared with listed equity of a large public company, secondary trading in the corporate bonds of Tinderbox Media is most likely:',
      'More dealer-driven, with prices negotiated rather than matched on one central limit-order book',
      'Conducted only on a central limit-order book, with dealers prohibited from holding inventory',
      'Closed once the primary syndicate disbands, because secondary bond trades are not allowed',
      'Corporate bond secondary markets remain largely over-the-counter dealer markets. Dealers hold inventory and negotiate bids and offers. That structure differs from a central equity order book. Secondary trading is what provides liquidity after the primary sale; it does not become illegal when the syndicate closes.',
    ],
    [
      'medium',
      'Whitecap Marine hires dealers to find buyers for a new bond issue, but the dealers do not guarantee that the company will receive a fixed amount of proceeds. This arrangement is best described as:',
      'A best-efforts offering',
      'A firm-commitment underwriting',
      'A repurchase agreement secured by the new bonds',
      'Best efforts means the intermediary tries to place the bonds and is not obligated to buy the unsold amount. A firm-commitment underwriting transfers that placement risk to the syndicate. A repurchase agreement is a secured cash loan, not a method of distributing a new long-term issue.',
    ],
  ])
}

function corpMarkets(): Draft[] {
  return rows('fi-corpmarkets', [
    [
      'easy',
      'Amberfield Dairy funds inventory with 90-day commercial paper. That paper is most likely:',
      'Short-term unsecured borrowing that the company expects to roll over at maturity',
      'A secured bond with a 90-year final legal maturity',
      'An equity warrant that must be converted into common shares after 90 days',
      'Commercial paper is short-dated unsecured funding, and issuers commonly roll it over. Because repayment depends on issuing new paper or drawing backup credit, investors care about the issuer credit standing. It is not a long secured bond and it is not an equity warrant.',
    ],
    [
      'medium',
      'Southpier Ports commercial paper program is supported by a committed revolving credit facility. The facility most likely exists to:',
      'Provide cash if the paper cannot be rolled over in the market',
      'Convert each maturing note into perpetual preferred equity',
      'Remove any need for investors to consider the issuer credit quality',
      'Commercial paper is usually refinanced at maturity. A committed backup line covers the risk that the market will refuse new paper, for example during a stress period. The line does not turn the paper into equity, and it does not make the issuer credit standing irrelevant.',
    ],
    [
      'medium',
      'Kindling Energy borrows cash for one week, delivers government bonds as collateral, and agrees to repurchase those bonds at a slightly higher price. This transaction is:',
      'A repurchase agreement in which the cash lender holds collateral',
      'An issuance of unsecured commercial paper',
      'An outright sale of the bonds with no obligation to take them back',
      'In a repo the cash borrower sells securities and agrees to repurchase them. The cash lender holds collateral and earns the repo rate through the higher repurchase price. The coupon on the collateral is not the repo rate. The trade is secured funding, not commercial paper and not a permanent sale.',
    ],
    [
      'hard',
      'Mossbank Textiles pledges bonds with a market value of 102 and receives 100 of cash in a repo. The difference of 2 most likely:',
      'Is a haircut that protects the cash lender if the collateral value falls',
      'Is prepaid coupon income that reduces the repo rate to zero',
      'Means the cash lender has an unsecured exposure of 102',
      'The haircut is the excess of collateral value over cash lent. Here the lender advances 100 against 102 of bonds, so a small price decline can still leave the loan covered. The difference is not a coupon payment. The cash lender is secured by the bonds; the cash borrower is the party posting collateral.',
    ],
    [
      'medium',
      'Relative to a typical investment-grade issuer, a high-yield issuer such as Halcyon Instruments most likely:',
      'Faces a more credit-sensitive buyer base and a tighter covenant package',
      'Can issue commercial paper with no backup liquidity because the coupon is high',
      'Sells only bonds that carry a government guarantee',
      'High-yield bonds are bought by investors who focus on default and recovery, and the indentures often contain more restrictive covenants than investment-grade deals. A high coupon does not remove rollover risk on commercial paper. High-yield status is not a government guarantee.',
    ],
    [
      'hard',
      'In a tri-party repo used by the treasury of Dovetail Furniture, a third-party agent most likely:',
      'Handles collateral custody, pricing, and substitution between the two parties',
      'Becomes the unsecured lender and cancels the collateral requirement',
      'Sets the coupon on the company long-term bonds',
      'Tri-party repo uses an agent, often a custodian, to manage collateral movements, values, and substitutions. The economic loan remains between the cash lender and the cash borrower, and the collateral still secures it. The agent does not set the coupon on the firm long-term bonds.',
    ],
  ])
}

function govMarkets(): Draft[] {
  return rows('fi-govmarkets', [
    [
      'easy',
      'The Republic of Valden issues bonds in its own currency. Compared with a private corporate issuer, Valden local-currency debt most likely reflects:',
      'The sovereign ability to tax and to influence the supply of its own currency',
      'A promise that is free of inflation risk for every foreign investor',
      'The same instrument as 90-day commercial paper of a private company',
      'A sovereign can tax and, in its own currency, influence the money supply. That supports the capacity to pay local-currency debt. It does not remove inflation risk or currency risk for an investor who cares about real value or a foreign currency. The bond is not private commercial paper.',
    ],
    [
      'medium',
      'The Commonwealth of Ostmark borrows in a foreign currency. Relative to its local-currency bonds, the foreign-currency bonds most likely:',
      'Add the risk that Ostmark cannot create the currency it has promised to pay',
      'Are automatically risk-free because every sovereign bond is risk-free',
      'Must yield less because foreign-currency debt has no credit risk',
      'A sovereign that owes a foreign currency cannot print that currency. Repayment depends on reserves, the external balance, and access to foreign funding. Local-currency debt has a different risk. Neither promise is automatically risk-free, and foreign-currency bonds often yield more when that risk is material.',
    ],
    [
      'medium',
      'The newest 10-year note of the Federation of Calden is described as on-the-run. Compared with an older Calden note of similar remaining maturity, the on-the-run note most likely:',
      'Serves as the benchmark and usually trades with greater liquidity',
      'Has a longer original maturity than every older note by definition',
      'Cannot be used to price other bonds because it is still new',
      'On-the-run government securities are the most recently issued bonds of a given original maturity. They usually have the tightest trading spreads and are the reference for other yields. An older off-the-run note can have a similar remaining life but is typically less liquid.',
    ],
    [
      'easy',
      'The Province of Lirren issues bonds to fund a toll road, and repayment depends on provincial revenues rather than a guarantee from the national government. These bonds are best described as:',
      'Non-sovereign government debt',
      'Supranational debt',
      'Commercial paper of a private manufacturing company',
      'Provinces, states, and cities are non-sovereign government issuers. Their bonds are government debt but not a national sovereign promise. A supranational is owned by several countries and is a different issuer. Lirren is a government, not a private commercial-paper issuer.',
    ],
    [
      'hard',
      'Meridian Development Bank is owned by several member countries and issues bonds to fund loans to those members for infrastructure. Its bonds are best classified as:',
      'Supranational debt issued to fund development lending rather than one national deficit',
      'Sovereign debt of whichever member has the largest equity stake',
      'Equity capital calls that member governments must pay on demand',
      'Supranationals borrow in bond markets to finance development or policy loans. They are not the sovereign of any single member, even if members provide callable capital support. Investors in these bonds hold debt of the institution. Credit analysis looks at the mandate, member support, and the loan book.',
    ],
  ])
}

function priceConcept(): Draft[] {
  return rows('fi-price', [
    [
      'easy',
      'When the yield required on an option-free bond of Redcedar Paper rises, and the promised coupons and principal stay the same, the full price of the bond most likely:',
      'Falls, because the cash flows are discounted at a higher rate',
      'Rises, because investors immediately receive a larger coupon',
      'Stays constant, because a fixed coupon cannot change value',
      'Price and yield move inversely. Raising the discount rate lowers the present value of the same coupons and principal. The coupon written in the indenture does not increase just because the market yield increases. The cash flows are fixed, and their present value is not.',
    ],
    [
      'easy',
      'Sablemere Chemicals annual-pay bond has a coupon rate above its yield to maturity. The bond is most likely priced:',
      'At a premium to par',
      'At a discount to par',
      'At par, because principal is repaid at face value regardless of the coupon',
      'If the coupon rate is above the yield required by the market, investors pay more than face value. The extra coupon compensates them for amortizing that premium if they hold the bond to maturity. Repayment of principal at par does not force the current price to equal par.',
    ],
    [
      'medium',
      'A discount bond of Mossbank Textiles is held to maturity and its yield to maturity stays constant. On successive coupon dates, the full price most likely:',
      'Rises toward par',
      'Falls toward zero as the original discount is written off as a loss',
      'Remains at the original discounted price until the final day',
      'With a constant yield, a discount bond is pulled to par. Each coupon date the remaining cash flows are discounted for one less period, and the price rises toward face value. The accretion is income to the holder, not a decline toward zero. The price does not sit still while maturity approaches.',
    ],
    [
      'medium',
      'A premium bond of Dovetail Furniture is held to maturity and its yield stays constant. On successive coupon dates, the full price most likely:',
      'Falls toward par',
      'Rises further above par as the high coupons are reinvested inside the bond',
      'Drops to par on the next coupon date and then starts to rise',
      'A premium bond pulled to par loses a slice of its premium as each coupon date passes, assuming the yield does not change. The high coupon is cash paid to the holder; it is not added to the clean price. The price approaches par over the remaining life rather than jumping to par on the next coupon date.',
    ],
    [
      'medium',
      'Between coupon dates, dealers quote a clean price for a Lowridge Cement bond. The invoice amount the buyer pays to the seller is most likely:',
      'The clean price plus accrued interest',
      'The clean price minus accrued interest',
      'The clean price alone, because accrued interest is paid only at maturity',
      'The quoted, or clean, price excludes accrued interest. The invoice, or full, price adds accrued interest so the seller is compensated for the portion of the coupon period that has already passed. Accrued interest is settled at the trade, not deferred until maturity.',
    ],
  ])
}

function priceCalcs(): Draft[] {
  const fullAccruedClean = 101.25
  const accrued = 5 * (73 / 365)
  const fullInvoice = fullAccruedClean + accrued
  const halfwayFull = 106 / (1.08) ** 0.5
  return [
    bondPriceQuestion({
      difficulty: 'easy',
      issuer: 'Harborline Holdings',
      coupon: 0.05,
      ytm: 0.06,
      years: 4,
      frequency: 1,
    }),
    bondPriceQuestion({
      difficulty: 'easy',
      issuer: 'Bramble and Co.',
      coupon: 0.07,
      ytm: 0.05,
      years: 6,
      frequency: 1,
    }),
    bondPriceQuestion({
      difficulty: 'easy',
      issuer: 'Northveil Industrials',
      coupon: 0.04,
      ytm: 0.04,
      years: 5,
      frequency: 1,
    }),
    bondPriceQuestion({
      difficulty: 'medium',
      issuer: 'Cinderwell Utilities',
      coupon: 0.045,
      ytm: 0.052,
      years: 5,
      frequency: 2,
    }),
    zeroPriceQuestion('Larkspur Foods', 0.048, 8, 'medium'),
    bondPriceQuestion({
      difficulty: 'medium',
      issuer: 'Vellum Rail',
      coupon: 0.06,
      ytm: 0.035,
      years: 3,
      frequency: 2,
    }),
    bondPriceQuestion({
      difficulty: 'hard',
      issuer: 'Pebbleford Mining',
      coupon: 0.03,
      ytm: 0.065,
      years: 12,
      frequency: 1,
    }),
    spotPriceQuestion({
      difficulty: 'hard',
      issuer: 'The treasury of Quill and Oak Retail',
      coupon: 0.06,
      spots: [0.025, 0.035],
    }),
    spotPriceQuestion({
      difficulty: 'hard',
      issuer: 'Ironwharf Logistics',
      coupon: 0.05,
      spots: [0.02, 0.03, 0.04],
    }),
    numQ(
      'fi-price',
      'medium',
      `A Lowridge Cement bond is quoted at a clean price of 101.25 per 100 of face. The annual coupon is 5 per 100, 73 days have passed in a 365-day coupon year, and the day count is actual/actual. The full invoice price, ${inline(String.raw`Full=Clean+5\times\frac{73}{365}`)}, is closest to:`,
      fullInvoice,
      [fullAccruedClean, fullAccruedClean - accrued, fullAccruedClean + 5, 100],
      px,
      (shown) =>
        `Accrued interest is the coupon earned by the seller since the last coupon date. ${block(String.raw`AI=5\times\frac{73}{365}=${num(accrued, 4)}`)} ` +
        `Because 5 times 73 equals 365, accrued interest is exactly 1 per 100 of face. ${inline(String.raw`Full=101.25+1.00=${shown}`)} The buyer pays the clean price plus accrued interest, not the clean price alone and not the clean price minus accrued interest.`,
    ),
    numQ(
      'fi-price',
      'hard',
      `Marlowe Glass has an annual-pay bond with exactly one coupon remaining. The bond will pay 106 per 100 of face in one-half year. The yield is 8% with annual compounding. The full price, ${inline(String.raw`Full=\frac{106}{(1.08)^{0.5}}`)}, is closest to:`,
      halfwayFull,
      [106 / 1.08, halfwayFull - 3, 106, 100],
      px,
      (shown) =>
        `With half a year left, discount the final coupon and principal for half a period. ${block(String.raw`Full=\frac{106}{(1.08)^{0.5}}=${num(halfwayFull, 4)}`)} ` +
        `Dividing by 1.08 would discount a full year that the investor does not have to wait. Accrued interest is 3 because half of the 6 coupon has been earned, so the clean price is the full price minus 3, which is not the invoice price. The full price is closest to ${shown}.`,
    ),
  ]
}

function yieldsConcept(): Draft[] {
  return rows('fi-yields', [
    [
      'medium',
      'An investor buys a coupon bond of Fennelbrook Agriculture at its yield to maturity and wants that yield to equal the realized compound return. Which set of assumptions is required, assuming the issuer does not default?',
      'The bond is held to maturity and every coupon is reinvested at the original yield to maturity',
      'The bond is sold after one coupon and the sale price equals the purchase price',
      'Coupons are spent when received, and the bond is held to maturity',
      'Yield to maturity is the internal rate of return of the promised cash flows. It is the realized compound return only if the investor holds to maturity, so there is no sale at a different yield, and every coupon is reinvested at that same yield. Spending the coupons, or selling early, removes one of those assumptions.',
    ],
    [
      'medium',
      'A premium bond of Glasswater Hotels has a coupon rate above its yield to maturity. Ignoring taxes and accrued interest, the ordering of the coupon rate, the current yield, and the yield to maturity is most likely:',
      'Coupon rate greater than current yield greater than yield to maturity',
      'Yield to maturity greater than current yield greater than coupon rate',
      'Coupon rate greater than yield to maturity greater than current yield',
      'Current yield is the annual coupon divided by price. Because a premium bond is priced above par, current yield is below the coupon rate. Yield to maturity is below current yield because the investor also amortizes the premium as a reduction of return. So the coupon rate is highest and the yield to maturity is lowest.',
    ],
    [
      'easy',
      'A discount bond of Tinderbox Media has a coupon rate below its yield to maturity. The ordering of the coupon rate, the current yield, and the yield to maturity is most likely:',
      'Coupon rate less than current yield less than yield to maturity',
      'Coupon rate greater than current yield greater than yield to maturity',
      'Current yield less than coupon rate less than yield to maturity',
      'On a discount bond the price is below par, so the annual coupon divided by price exceeds the coupon rate. Yield to maturity is higher still because the pull to par is an additional gain. The discount ordering is the reverse of the premium ordering.',
    ],
    [
      'hard',
      'An analyst compares an option-free corporate bond of Whitecap Marine with government spot rates. The constant spread that must be added to each spot rate so that the discounted cash flows equal the bond price is the:',
      'Z-spread',
      'G-spread',
      'I-spread',
      'The Z-spread is a constant add-on to every benchmark spot rate that equates the present value of the bond cash flows to its price. A G-spread is the bond yield minus a government yield. An I-spread is the bond yield minus a swap rate. Neither of those yield differences is added period by period to the spot curve.',
    ],
    [
      'hard',
      'A callable bond of Halcyon Instruments has a Z-spread of 180 basis points and an option-adjusted spread of 125 basis points. The 55 basis point difference most likely represents:',
      'The option cost embedded in the Z-spread',
      'The G-spread over the government yield',
      'Accrued interest that dealers forgot to add to the clean price',
      'For a bond with an embedded option, the Z-spread still includes compensation for the option the investor is short. The option-adjusted spread removes that option cost: OAS equals the Z-spread minus the option cost. Here the option cost is 180 minus 125, or 55 basis points. It is not a G-spread and it is not accrued interest.',
    ],
    [
      'medium',
      'Dovetail Furniture has a premium bond that is callable at par in two years and matures in eight years. An investor who uses only the yield to maturity most likely ignores the chance that:',
      'The issuer will call the bond, so yield to call and yield to worst can be the more relevant measures',
      'The coupon will reset to the call price on the next payment date',
      'A put will force the investor to extend the bond for eight more years',
      'Yield to maturity assumes the bond pays every remaining coupon and the principal at final maturity. A premium callable bond is a candidate for redemption if the issuer can refinance. Yield to call uses the call date and call price, and yield to worst is the lowest of those yields. The coupon does not reset to the call price, and this bond is a call, not a put.',
    ],
  ])
}

function yieldsCalcs(): Draft[] {
  const statedPrice = 97.2
  const currentYield = 4 / statedPrice
  const effective = math.ear(0.058, 2)
  const gSpread = 0.054 - 0.038
  const iSpread = 0.049 - 0.0355
  const annualYtm = math.irr([-98.4, 5, 5, 105])
  const semiRate = math.irr([-101.5, 3, 3, 3, 103])
  const bey = semiRate * 2
  const effectiveFromSemi = (1 + semiRate) ** 2 - 1
  return [
    numQ(
      'fi-yields',
      'easy',
      `Quill and Oak Retail annual-pay bond pays a coupon of 4 per 100 of face and trades at 97.20. An analyst also quotes a yield to maturity of 4.80%. The current yield, ${inline(String.raw`CY=\frac{4}{97.20}`)}, is closest to:`,
      currentYield,
      [0.04, 0.048, 4 / 100],
      rate,
      (shown) =>
        `Current yield uses the annual coupon and the price, and it ignores pull to par. ${block(String.raw`CY=\frac{4.00}{97.20}=${num(currentYield, 6)}`)} ` +
        `That is below the 4.80% yield to maturity because the bond is priced at a discount, and it is above the 4% coupon rate. The current yield is closest to ${shown}.`,
    ),
    numQ(
      'fi-yields',
      'medium',
      `A bond yield is quoted at 5.80% on a semiannual bond basis. The effective annual yield, ${inline(String.raw`EAY=(1+\frac{0.058}{2})^{2}-1`)}, is closest to:`,
      effective,
      [0.058, 0.058 / 2, math.ear(0.058, 4)],
      rate,
      (shown) =>
        `A semiannual bond basis quote of 5.80% means 2.90% per half year, not 5.80% per year compounded once. ${block(String.raw`EAY=(1.029)^{2}-1=${num(effective, 6)}`)} ` +
        `Compounding makes the effective annual yield a little higher than the bond-basis quote. Using quarterly compounding, or reporting the 5.80% quote itself, answers a different question. The effective annual yield is closest to ${shown}.`,
    ),
    numQ(
      'fi-yields',
      'easy',
      `Harborline Holdings bond has a yield to maturity of 5.40%. A government benchmark of the same maturity yields 3.80%, and the matched-maturity swap rate is 4.05%. The G-spread, ${inline(String.raw`G=y_{bond}-y_{gov}`)}, is closest to:`,
      gSpread,
      [0.054 - 0.0405, 0.0405 - 0.038, 0.054],
      rate,
      (shown) =>
        `The G-spread is the bond yield minus the government benchmark yield. ${block(String.raw`G=0.0540-0.0380=0.0160`)} ` +
        `Subtracting the swap rate instead would produce the I-spread, and subtracting the government yield from the swap rate would produce a swap spread. The G-spread is closest to ${shown}.`,
    ),
    numQ(
      'fi-yields',
      'medium',
      `Option-free notes of Amberfield Dairy yield 4.90%. A comparable government bond yields 3.30%, and the swap rate of the same maturity is 3.55%. The I-spread, ${inline(String.raw`I=y_{bond}-y_{swap}`)}, is closest to:`,
      iSpread,
      [0.049 - 0.033, 0.0355 - 0.033, 0.049],
      rate,
      (shown) =>
        `The I-spread, or interpolated spread, is the bond yield minus the swap rate for the same maturity. ${block(String.raw`I=0.0490-0.0355=0.0135`)} ` +
        `The G-spread would subtract the 3.30% government yield instead. The gap between the swap rate and the government yield is the swap spread, not the I-spread. The I-spread is closest to ${shown}.`,
    ),
    numQ(
      'fi-yields',
      'hard',
      `A three-year annual-pay bond of Southpier Ports has a coupon of 5 per 100 of face and a full price of 98.40 on a coupon date. The yield to maturity, defined by ${inline(String.raw`98.40=\frac{5}{1+y}+\frac{5}{(1+y)^{2}}+\frac{105}{(1+y)^{3}}`)}, is closest to:`,
      annualYtm,
      [5 / 98.4, 0.05, ((100 - 98.4) / 3 + 5) / 98.4],
      rate,
      (shown) =>
        `Yield to maturity is the single annual rate that sets the present value of the promised cash flows equal to the price. ${block(String.raw`98.40=\frac{5}{1+y}+\frac{5}{(1+y)^{2}}+\frac{105}{(1+y)^{3}}`)} ` +
        `Solving gives ${num(annualYtm, 6)}, which is above the current yield of ${pct(5 / 98.4)} because the discount must also accrete to par. The coupon rate of 5% is not the market yield. The yield to maturity is closest to ${shown}.`,
    ),
    numQ(
      'fi-yields',
      'hard',
      `A two-year semiannual-pay bond of Kindling Energy has a 6% annual coupon, so each period it pays 3, and the last payment includes 100 of principal. The full price on a coupon date is 101.50. The semiannual-bond-basis yield to maturity, ${inline(String.raw`BEY=2r`)}, is closest to:`,
      bey,
      [semiRate, effectiveFromSemi, 0.06],
      rate,
      (shown) =>
        `The internal rate of return of the four semiannual cash flows is the rate per half year. ${block(String.raw`101.50=\frac{3}{1+r}+\frac{3}{(1+r)^{2}}+\frac{3}{(1+r)^{3}}+\frac{103}{(1+r)^{4}}`)} ` +
        `That periodic rate is ${num(semiRate, 6)}. The street, or semiannual bond basis, convention doubles it: ${inline(String.raw`BEY=2\times ${num(semiRate, 6)}=${num(bey, 6)}`)}. The effective annual yield would square the periodic growth instead, and the 6% coupon is not the yield. The bond-basis yield is closest to ${shown}.`,
    ),
  ]
}

function floaters(): Draft[] {
  const discountMargin = 105 / 99 - 1 - 0.042
  const discountYield = (360 / 90) * ((100 - 97.75) / 100)
  const addOn = (360 / 90) * ((100 - 97.75) / 97.75)
  const holding = (100 - 97.75) / 97.75
  return [
    ...rows('fi-floaters', [
      [
        'easy',
        'A floating-rate note of Nettle and Pine Packaging pays a reference rate plus 0.90%. In the indenture, that 0.90% is best described as the:',
        'Quoted margin',
        'Discount margin, which is always equal to the quoted margin',
        'Z-spread over the government spot curve',
        'The quoted margin is the contractual spread added to the reference rate to set the coupon. The discount margin is the spread the market requires in the discount rate, and it equals the quoted margin only when the floater is priced at par on a reset date. The quoted margin is not a Z-spread.',
      ],
      [
        'medium',
        'On a reset date, the market discount margin demanded on a floater of Mossbank Textiles is wider than the note quoted margin. The floater full price is most likely:',
        'Below par',
        'Above par',
        'Exactly par, because a floater is repriced every reset date regardless of the margin',
        'If investors demand a wider spread than the quoted margin, they will not pay par for the future coupons. The price drops below par until the yield implied by the discount margin fits the cash flows. A reset aligns the next coupon with the current reference rate plus the quoted margin; it does not repair a quoted margin that is too small.',
      ],
      [
        'medium',
        'A floater of Halcyon Instruments is exactly on a reset date, and the quoted margin equals the discount margin the market requires. The floater is most likely priced:',
        'At par',
        'At a premium equal to the quoted margin times the face value',
        'At a discount equal to one coupon period of interest',
        'When the margin in the coupon equals the margin used to discount the floater, the present value of the remaining payments is par on a reset date. A premium would require the quoted margin to exceed the required discount margin. Accrued interest from a prior period is not the reason for a discount on the reset date itself.',
      ],
      [
        'hard',
        'Compared with a fixed-rate bullet bond of the same issuer and the same final maturity, a floating-rate note of Vellum Rail most likely has:',
        'Less price sensitivity to a change in the reference interest rate',
        'More price sensitivity to a change in the reference interest rate',
        'No sensitivity to a change in the issuer credit spread',
        'Because the coupon resets with the reference rate, a floater Macaulay duration is close to the time until the next reset, not the time until final maturity. Reference-rate moves therefore move the price less than they move a long fixed-rate bond. Credit-spread changes still affect the price when the quoted margin is fixed.',
      ],
    ]),
    numQ(
      'fi-floaters',
      'hard',
      `A one-year floating-rate note of Nettle and Pine Packaging will pay 105 per 100 of face in one year. That payment includes a 4.20% reference rate and a 0.80% quoted margin. The note is priced at 99. The discount margin, ${inline(String.raw`99=\frac{105}{1+0.042+DM}`)}, is closest to:`,
      discountMargin,
      [0.008, 105 / 99 - 1, (100 - 99) / 99],
      rate,
      (shown) =>
        `For this single remaining period the discount margin is the spread over the reference rate that equates the promised payment to the price. ${block(String.raw`DM=\frac{105}{99}-1-0.042=${num(discountMargin, 6)}`)} ` +
        `The quoted margin is only 0.80%, so the required margin is wider and the note is below par. The total yield of the note is 105/99 minus 1, which still includes the reference rate. The discount margin is closest to ${shown}.`,
    ),
    numQ(
      'fi-floaters',
      'medium',
      `A 90-day money-market bill of the Republic of Valden is priced at 97.75 per 100 of face. Using a 360-day year, the discount yield, ${inline(String.raw`DR=\frac{360}{90}\times\frac{100-97.75}{100}`)}, is closest to:`,
      discountYield,
      [addOn, holding, (100 - 97.75) / 100],
      rate,
      (shown) =>
        `A money-market discount yield puts face value, not price, in the denominator and annualizes with the stated year fraction. ${block(String.raw`DR=\frac{360}{90}\times\frac{2.25}{100}=0.0900`)} ` +
        `The add-on yield uses the 97.75 price in the denominator, so it is higher: ${block(String.raw`AOR=\frac{360}{90}\times\frac{2.25}{97.75}=${num(addOn, 6)}`)} ` +
        `The unannualized gain is only 2.25/97.75. The discount yield is closest to ${shown}.`,
    ),
  ]
}

function curveConcept(): Draft[] {
  return rows('fi-curve', [
    [
      'easy',
      'A spot rate on the Calden government curve is best described as the rate that:',
      'Discounts a single future payment to today',
      'Is the coupon on a bond priced at par for every maturity at once',
      'Is an investor forecast of the policy rate, with no link to current prices',
      'Each spot rate discounts one cash flow of a given maturity. A par rate is the coupon that prices a coupon bond at par, and it is a blend of spots. A forward rate is implied by two spots. None of these no-arbitrage rates is simply an analyst forecast.',
    ],
    [
      'easy',
      'The two-year par rate is best described as:',
      'The coupon rate that prices a two-year coupon bond at par',
      'The rate that discounts only the final principal payment',
      'The one-year forward rate one year from now',
      'By definition the par rate is the coupon that makes the present value of a bond cash flows equal its face value. It is not the spot rate on the final payment alone, and it is not the forward rate, although all three are linked by the same discount factors.',
    ],
    [
      'medium',
      'When the spot curve is upward sloping, the one-year forward rate one year from now is most likely:',
      'Higher than the two-year spot rate',
      'Lower than the one-year spot rate',
      'Equal to the two-year par rate by definition',
      'The no-arbitrage link is (1+z2)^2 = (1+z1) times (1+f). If z2 exceeds z1, then (1+z2)^2 exceeds (1+z1) times (1+z2), so 1+f exceeds 1+z2. The forward therefore sits above both spot rates. It is a break-even future rate, not another name for the par rate.',
    ],
    [
      'hard',
      'A portfolio manager at Thistlegate Insurance believes the one-year spot rate next year will be higher than the one-year forward rate implied by today\'s curve. If that view is correct, the two-year bond is most likely to:',
      'Underperform a strategy of rolling one-year bonds over the two-year horizon',
      'Outperform the rollover strategy by the full amount of the forward premium',
      'Match the rollover strategy because a forward rate is only a forecast and cannot be a break-even rate',
      'The implied forward is the future spot that equates the two-year investment with rolling one-year bonds. If the realized one-year rate next year is higher than that forward, the rollover strategy earns more than the break-even rate and beats the two-year bond over the horizon. The forward is a break-even rate derived from prices, not a forecast.',
    ],
    [
      'medium',
      'If the spot curve is upward sloping, the two-year annual par rate most likely lies:',
      'Between the one-year spot rate and the two-year spot rate',
      'Above the one-year forward rate one year from now',
      'Below the one-year spot rate',
      'The par rate is a weighted average of the spot rates used to discount the coupon bond. With an upward curve the one-year spot is the lowest of the three, the forward is the highest, and the two-year par rate sits between the one-year spot and the two-year spot. It does not sit above the forward.',
    ],
    [
      'medium',
      'An investor rides an upward-sloping yield curve by buying a bond longer than the investment horizon and selling it before maturity, and the curve stays unchanged. That strategy most likely:',
      'Can earn more than the short-term rate because the bond rolls down to a lower yield',
      'Is riskless and must earn the overnight rate with no exposure to a rise in yields',
      'Works only when the spot curve is inverted',
      'If an upward curve is unchanged, a bond ages into a shorter maturity with a lower yield, so its price rises relative to a constant-yield path. That roll-down can lift the horizon return above the rate available on a maturity-matched bill. The position still loses if yields rise. The strategy uses the upward slope; an inverted curve rolls the bond toward a higher yield.',
    ],
    [
      'hard',
      'For a single annual period, the one-year par rate and the one-year spot rate on the same curve are most likely:',
      'Equal, because a one-year coupon bond has only one cash flow',
      'Different, because a par rate never equals a spot rate',
      'Related by squaring, because every par rate is a two-year forward',
      'A one-year bond pays coupon plus principal once. Setting that price equal to par forces the coupon rate to equal the one-year discount rate. So the one-year par rate is the one-year spot. The squared relationship appears when a second period is introduced, not for the first spot itself.',
    ],
  ])
}

function curveCalcs(): Draft[] {
  const forwardUp = math.oneYearForwardRate(0.024, 0.031)
  const forwardDown = math.oneYearForwardRate(0.05, 0.04)
  const parUp = math.parRateTwoYear(0.024, 0.031)
  const parDown = math.parRateTwoYear(0.018, 0.027)
  const spot1 = 0.03
  const couponRate = 0.042
  const couponCash = 4.2
  const pv1 = couponCash / (1 + spot1)
  const pv2 = 100 - pv1
  const spot2 = Math.sqrt((100 + couponCash) / pv2) - 1
  if (Math.abs(math.parRateTwoYear(spot1, spot2) - couponRate) > 1e-9) {
    throw new Error('Bootstrap is inconsistent with the par rate')
  }
  const forwardFromBootstrap = math.oneYearForwardRate(spot1, spot2)
  return [
    numQ(
      'fi-curve',
      'medium',
      `The debt desk at Meridian Development Bank observes a one-year spot rate of 2.40% and a two-year spot rate of 3.10%. The one-year forward rate one year from now, ${inline(String.raw`f=\frac{(1+z_2)^2}{1+z_1}-1`)}, is closest to:`,
      forwardUp,
      [0.024, 0.031, (0.024 + 0.031) / 2, (1.031) / 1.024 - 1, parUp],
      rate,
      (shown) =>
        `No arbitrage requires the two-year spot to equal rolling the one-year spot into the forward. ${block(String.raw`1+f=\frac{(1.031)^2}{1.024}`)} ` +
        `so f equals ${num(forwardUp, 6)}. The forward is above both spots because the curve is upward sloping. Forgetting to square the two-year growth, or averaging the spots, does not satisfy the compounding identity. The forward rate is closest to ${shown}.`,
    ),
    numQ(
      'fi-curve',
      'hard',
      `A downward-sloping curve shows a one-year spot of 5.00% and a two-year spot of 4.00%. The one-year forward rate one year from now, ${inline(String.raw`f=\frac{(1.04)^2}{1.05}-1`)}, is closest to:`,
      forwardDown,
      [0.05, 0.04, (0.05 + 0.04) / 2, 1.04 / 1.05 - 1],
      rate,
      (shown) =>
        `With the curve inverted, the break-even future one-year rate is below the shorter spot. ${block(String.raw`f=\frac{(1.04)^2}{1.05}-1=${num(forwardDown, 6)}`)} ` +
        `The forward is also below the two-year spot. Using either spot by itself, or their average, ignores the compounding link. The implied forward is closest to ${shown}.`,
    ),
    numQ(
      'fi-curve',
      'medium',
      `Using a one-year spot of 2.40% and a two-year spot of 3.10%, the two-year annual par rate, ${inline(String.raw`c=\frac{100-PV(100)}{\sum DF_t}`)}, is closest to:`,
      parUp,
      [0.024, 0.031, (0.024 + 0.031) / 2, forwardUp],
      rate,
      (shown) => {
        const pvFace = 100 / 1.031 ** 2
        const denom = 1 / 1.024 + 1 / 1.031 ** 2
        return (
          `The par rate is the coupon that prices a two-year annual bond at 100. ${block(String.raw`c\left(\frac{1}{1.024}+\frac{1}{(1.031)^2}\right)=100-\frac{100}{(1.031)^2}`)} ` +
          `The principal present value is ${num(pvFace, 4)} and the sum of discount factors is ${num(denom, 4)}, so the coupon per 100 of face is ${num((100 - pvFace) / denom, 4)}. That par rate lies between the two spots and below the forward. It is closest to ${shown}.`
        )
      },
    ),
    numQ(
      'fi-curve',
      'hard',
      `Spots are 1.80% for one year and 2.70% for two years. The annual coupon that prices a two-year bond at par, ${inline(String.raw`P_{par}=\frac{c}{1+z_1}+\frac{100+c}{(1+z_2)^2}`)}, is closest to:`,
      parDown,
      [0.018, 0.027, math.oneYearForwardRate(0.018, 0.027), (0.018 + 0.027) / 2],
      rate,
      (shown) => {
        const pvFace = 100 / 1.027 ** 2
        const denom = 1 / 1.018 + 1 / 1.027 ** 2
        return (
          `Set the price equal to 100 and solve for the coupon. ${block(String.raw`c=\frac{100-\frac{100}{(1.027)^2}}{\frac{1}{1.018}+\frac{1}{(1.027)^2}}`)} ` +
          `The numerator is ${num(100 - pvFace, 4)} and the denominator is ${num(denom, 4)}. Dividing and scaling by face gives a par rate of ${num(parDown, 6)}. The one-year spot, the two-year spot, and the forward are different points on the curve. The par rate is closest to ${shown}.`
        )
      },
    ),
    numQ(
      'fi-curve',
      'hard',
      `A two-year annual par bond of the Federation of Calden has a coupon of 4.20% and is priced at 100. The one-year spot rate is 3.00%. The two-year spot rate, ${inline(String.raw`100=\frac{4.20}{1.03}+\frac{104.20}{(1+z_2)^2}`)}, is closest to:`,
      spot2,
      [couponRate, spot1, forwardFromBootstrap, (spot1 + couponRate) / 2],
      rate,
      (shown) =>
        `Strip the first coupon at the known one-year spot, then solve for the second spot. ${block(String.raw`PV_1=\frac{4.20}{1.03}=${num(pv1, 4)}`)} ` +
        `${block(String.raw`100-${num(pv1, 4)}=\frac{104.20}{(1+z_2)^2}`)} ` +
        `${inline(String.raw`z_2=\sqrt{\frac{104.20}{${num(pv2, 4)}}}-1=${num(spot2, 6)}`)} The par coupon is 4.20%, which is below this spot because the curve is upward sloping. The implied forward is higher still. The two-year spot is closest to ${shown}.`,
    ),
  ]
}

function returns(): Draft[] {
  const hprGain = math.hpr(95, 97.5, 3.5)
  const hprMixed = math.hpr(101.25, 100.1, 4.5)
  const couponFv = 6 * 1.04 ** 2 + 6 * 1.04 + 6
  const noReinvest = 18
  const extraYear = 6 * 1.04 ** 3 + 6 * 1.04 ** 2 + 6 * 1.04
  return [
    ...rows('fi-return', [
      [
        'easy',
        'Over a one-year horizon, the return on a coupon bond of Copperlane Transit comes from three sources. Those sources are most likely:',
        'Coupon income, reinvestment of coupons, and the price change over the horizon',
        'Only the change in the clean price, because coupons are not part of return',
        'Only the original yield to maturity, which cannot differ from the horizon return',
        'A holding-period return adds the coupons received and any income earned by reinvesting them, then adds the ending price and divides by the beginning price. The price can change when yields change. Yield to maturity equals that realized return only under extra assumptions, so it is not itself the third cash source.',
      ],
      [
        'medium',
        'A manager matches the investment horizon to the Macaulay duration of an option-free bond. The yield then changes once, immediately, by a small amount and stays at the new level. The price effect and the reinvestment effect most likely:',
        'Approximately offset, so the horizon return stays near the original yield',
        'Both reduce the horizon return whenever the yield rises',
        'Both increase the horizon return whenever the yield falls',
        'Near the Macaulay duration, an immediate yield increase lowers the sale price but raises income earned by reinvesting coupons, and a yield decrease does the opposite. For a small one-time move those effects approximately cancel, which is the idea behind immunization. Convexity makes the offset approximate rather than exact, and the result is not that both effects have the same sign.',
      ],
      [
        'hard',
        'An investor horizon is much shorter than the Macaulay duration of a fixed-rate bond. An immediate rise in yield, which then stays at the higher level, most likely:',
        'Reduces the horizon return, because the price loss dominates the extra reinvestment income',
        'Raises the horizon return, because the investor reinvests coupons at the higher yield for longer than the duration',
        'Leaves the horizon return unchanged for every horizon, because duration immunizes all of them',
        'The canceling point of price risk and reinvestment risk is about the Macaulay duration. Before that horizon, the investor sells too soon for the extra reinvestment income to offset the price decline, so a higher yield hurts. A lower yield would help this short-horizon investor. Duration does not immunize a horizon that is far from the duration statistic.',
      ],
      [
        'medium',
        'An investor holds a coupon bond of Brightloom Components to maturity, and the issuer pays every contractual amount. Every coupon is reinvested at a rate below the original yield to maturity. The realized compound return most likely:',
        'Falls short of the original yield to maturity',
        'Equals the original yield to maturity because principal is repaid at par',
        'Exceeds the original yield to maturity because the bond was not sold early',
        'Yield to maturity assumes coupons are reinvested at that yield. Reinvesting at a lower rate produces a smaller accumulation at maturity, so the realized compound return is below the original yield even though the issuer did not default and the principal arrived at par. Holding to maturity removes price risk but not reinvestment risk.',
      ],
      [
        'easy',
        'Which outcome can make an investor\'s realized return differ from the original yield to maturity even though the issuer of an option-free bond does not default?',
        'Selling the bond before maturity after the yield has changed',
        'Holding a zero-coupon bond to maturity and receiving the face amount',
        'Buying a par bond and receiving every coupon while the yield remains equal to the coupon',
        'Selling before maturity exposes the investor to a price that reflects the new yield, so the horizon return can differ from the original yield to maturity. A zero held to maturity has no coupons to reinvest, so its compound return equals its yield if it does not default. A par bond held to maturity with coupons reinvested at an unchanged yield also realizes that yield.',
      ],
    ]),
    numQ(
      'fi-return',
      'easy',
      `An investor buys a bond of Westmere Steel at 95.00 per 100 of face, receives a coupon of 3.50, and sells it one year later at 97.50. The holding-period return, ${inline(String.raw`HPR=\frac{97.50-95.00+3.50}{95.00}`)}, is closest to:`,
      hprGain,
      [(97.5 - 95) / 95, 3.5 / 95, (97.5 - 95 + 3.5) / 97.5],
      rate,
      (shown) =>
        `The holding-period return credits both the coupon and the price increase, measured against the purchase price. ${block(String.raw`HPR=\frac{97.50-95.00+3.50}{95.00}=\frac{6.00}{95.00}=${num(hprGain, 6)}`)} ` +
        `Using only the price change drops the coupon. Dividing by the ending price, or using only the coupon, changes the denominator or the numerator. The holding-period return is closest to ${shown}.`,
    ),
    numQ(
      'fi-return',
      'medium',
      `An investor buys a bond of Orchard and Anvil at 101.25, receives a coupon of 4.50, and sells it one year later at 100.10. The holding-period return, ${inline(String.raw`HPR=\frac{100.10-101.25+4.50}{101.25}`)}, is closest to:`,
      hprMixed,
      [(100.1 - 101.25) / 101.25, 4.5 / 101.25, (100.1 - 101.25 + 4.5) / 100.1],
      rate,
      (shown) =>
        `The coupon more than offsets the small price decline. ${block(String.raw`HPR=\frac{100.10-101.25+4.50}{101.25}=\frac{3.35}{101.25}=${num(hprMixed, 6)}`)} ` +
        `The price change alone is negative, and the current-yield piece 4.50/101.25 ignores that price change. The sum of coupon and price change must be divided by the beginning price of 101.25. The holding-period return is closest to ${shown}.`,
    ),
    numQ(
      'fi-return',
      'hard',
      `A bond of Kestrel Aviation pays an annual coupon of 6 at the end of each of the next three years. The investor reinvests coupons at 4% and holds the bond to maturity. The accumulated value of the coupons on the maturity date, ${inline(String.raw`6(1.04)^2+6(1.04)+6`)}, is closest to:`,
      couponFv,
      [noReinvest, extraYear, 6 * 1.04 ** 3],
      px,
      (shown) =>
        `The first coupon is reinvested for two years, the second for one year, and the last coupon is received on the horizon so it is not reinvested. ${block(String.raw`FV=6(1.04)^2+6(1.04)+6=${num(couponFv, 4)}`)} ` +
        `Adding 6 three times, without interest, gives 18 and ignores reinvestment income. Compounding every coupon for one extra year double-counts time the investor does not have. The accumulated coupon value is closest to ${shown}.`,
    ),
  ]
}

function durationConcept(): Draft[] {
  const lowCoupon = math.macaulayDuration(100, 0.02, 0.06, 3, 1)
  const highCoupon = math.macaulayDuration(100, 0.09, 0.06, 3, 1)
  return rows('fi-duration', [
    [
      'easy',
      'A seven-year zero-coupon bond of Kindling Energy has a Macaulay duration that is most likely:',
      'Equal to seven years',
      'Equal to seven divided by one plus the yield',
      'Equal to one year, because a zero recognizes interest annually',
      'Macaulay duration is the present-value-weighted average time until cash is received. A zero has one cash flow, at maturity, so the entire weight sits at year seven and Macaulay duration equals maturity. Dividing by one plus the yield converts Macaulay duration into modified duration. It does not change the fact that the cash arrives in seven years.',
    ],
    [
      'medium',
      `Westmere Steel and Halcyon Instruments each have an option-free three-year annual-pay bond yielding 6%. Westmere coupon is 2% and Halcyon coupon is 9%. Which bond has the higher Macaulay duration?`,
      'The Westmere Steel 2% bond',
      'The Halcyon Instruments 9% bond',
      'Neither, because Macaulay duration depends only on maturity when the yield is the same',
      `A lower coupon puts more of the bond value in the final principal, so the weighted time until cash arrives is longer. At a 6% yield the 2% bond has Macaulay duration ${num(lowCoupon, 2)} years and the 9% bond has Macaulay duration ${num(highCoupon, 2)} years. The Westmere Steel 2% bond is therefore longer. Equal maturity and yield do not force equal duration when the coupons differ.`,
    ],
    [
      'medium',
      'Two option-free bonds are identical in coupon and maturity, but one is priced at a higher yield to maturity. The bond with the higher yield most likely has:',
      'A lower Macaulay duration, because later cash flows are discounted more heavily',
      'A higher Macaulay duration, because the price discount adds extra years',
      'The same Macaulay duration, because the payment dates did not change',
      'Macaulay duration weights each payment date by the present value of that payment. A higher yield shrinks the present value of distant payments more than the present value of near payments, so the weights shift forward and duration falls. The calendar of payment dates is unchanged, but the present-value weights are not.',
    ],
    [
      'easy',
      'For an option-free fixed-rate bond, modified duration is best described as:',
      'Macaulay duration divided by one plus the periodic yield, used to estimate percent price change',
      'The number of years until the issuer is allowed to call the bond',
      'The currency price change for a one-point move in the issuer credit rating',
      'Modified duration equals Macaulay duration divided by one plus the periodic yield. For an option-free bond, the approximate percent price change is minus modified duration times the change in the annual yield. It is not a call date, and it is not a rating statistic. Money duration, not modified duration, is the currency companion of that percent estimate.',
    ],
    [
      'hard',
      'Compared with an option-free coupon bond of the same maturity and yield, a zero-coupon bond most likely has:',
      'A higher Macaulay duration, equal to its time to maturity',
      'A lower Macaulay duration, because it pays no coupons that can be weighted',
      'A Macaulay duration below one year whenever the yield is positive',
      'Coupons pull Macaulay duration below maturity because some cash arrives early. A zero has no coupons, so none of its present value arrives early and its Macaulay duration equals maturity. That is longer than the duration of a coupon bond with the same maturity and yield. A positive yield does not pull a zero duration below maturity.',
    ],
    [
      'medium',
      'Money duration converts a percent price estimate into a currency estimate. For a given modified duration and a given yield change, a bond with a higher full price most likely has:',
      'A larger money duration and a larger currency price change',
      'A smaller money duration, because price and yield move inversely',
      'The same money duration, because modified duration already contains the price',
      'Money duration is modified duration times full price. The approximate price change is minus that product times the yield change. A larger full price therefore scales the same percent move into more currency. Modified duration itself is a percent sensitivity and does not already multiply by price. The inverse price-yield relation is already captured by the minus sign.',
    ],
  ])
}

function durationCalcs(): Draft[] {
  const face = 100
  const macAnnual = math.macaulayDuration(face, 0.05, 0.06, 4, 1)
  const modAnnual = math.modifiedDuration(macAnnual, 0.06, 1)
  const priceAnnual = math.bondPrice(face, 0.05, 0.06, 4, 1)
  const macSemi = math.macaulayDuration(face, 0.04, 0.05, 5, 2)
  const modSemi = math.modifiedDuration(macSemi, 0.05, 2)
  const p0 = Number(math.bondPrice(face, 0.045, 0.05, 6, 2).toFixed(2))
  const pDown = Number(math.bondPrice(face, 0.045, 0.0475, 6, 2).toFixed(2))
  const pUp = Number(math.bondPrice(face, 0.045, 0.0525, 6, 2).toFixed(2))
  const shock = 0.0025
  const approxMod = math.approxModifiedDuration(pDown, pUp, p0, shock)
  const modRounded = Number(modAnnual.toFixed(4))
  const priceRounded = Number(priceAnnual.toFixed(2))
  const pvbp = modRounded * priceRounded * 0.0001
  const dy = 0.004
  const newPrice = priceRounded * (1 - modRounded * dy)
  const moneyDuration = modRounded * priceRounded
  return [
    numQ(
      'fi-duration',
      'medium',
      `A four-year annual-pay bond of Harborline Holdings has a 5% coupon and a 6% yield. Per 100 of face, Macaulay duration, ${inline(String.raw`Mac=\frac{\sum t\times PV(CF_t)}{P}`)}, is closest to:`,
      macAnnual,
      [4, modAnnual, math.macaulayDuration(face, 0.08, 0.06, 4, 1), 5],
      yearsFmt,
      (shown) => {
        const payment = 5
        const bits = [1, 2, 3, 4].map((t) => {
          const cashFlow = t === 4 ? payment + 100 : payment
          return String.raw`${t}\times\frac{${num(cashFlow, 2)}}{(1.06)^{${t}}}`
        })
        return (
          `Macaulay duration is the present-value-weighted receipt time, in years. ${block(String.raw`Mac=\frac{${bits.join('+')}}{${num(priceAnnual, 4)}}`)} ` +
          `The price of the bond is ${num(priceAnnual, 4)}, and the weighted sum divided by that price equals ${num(macAnnual, 4)} years. Maturity is 4 years, which is longer because coupons arrive earlier. Modified duration is the next rescaling, not this weighted time. Macaulay duration is closest to ${shown} years.`
        )
      },
    ),
    numQ(
      'fi-duration',
      'medium',
      `The same Harborline Holdings four-year annual-pay 5% bond yields 6%. Its Macaulay duration is ${num(macAnnual, 4)} years. Modified duration, ${inline(String.raw`Mod=\frac{Mac}{1+y}`)}, is closest to:`,
      modAnnual,
      [macAnnual, macAnnual * (1.06), macAnnual / 1.03, 4],
      yearsFmt,
      (shown) =>
        `With annual payments the periodic yield is the annual yield. ${block(String.raw`Mod=\frac{${num(macAnnual, 4)}}{1.06}=${num(modAnnual, 4)}`)} ` +
        `The percent price change for a small yield move is approximately minus this modified duration times the annual yield change. Multiplying by 1.06 goes in the wrong direction, and dividing by 1.03 would invent a semiannual conversion the bond does not use. Modified duration is closest to ${shown}.`,
    ),
    numQ(
      'fi-duration',
      'hard',
      `A five-year semiannual-pay bond of Cinderwell Utilities has a 4% annual coupon and a 5% annual yield. Macaulay duration in years, ${inline(String.raw`Mac=\frac{\sum (t/k)PV_t}{P}`)}, is closest to:`,
      macSemi,
      [5, modSemi, math.macaulayDuration(face, 0.04, 0.05, 5, 1), macSemi * 2],
      yearsFmt,
      (shown) =>
        `Semiannual payments use ten periods, but time is measured in years, so each period weight is t/2. The periodic coupon is 2 and the periodic discount rate is 2.50%. ${block(String.raw`Mac=\frac{1}{P}\sum_{t=1}^{10}\frac{t}{2}\times PV_t=${num(macSemi, 4)}`)} ` +
        `The result is below the five-year maturity. An annual-pay version of the same coupon and yield has a different duration because the cash arrives later. Doubling the annual Macaulay figure would turn years into something else. Macaulay duration is closest to ${shown} years.`,
    ),
    numQ(
      'fi-duration',
      'hard',
      `That Cinderwell Utilities semiannual bond has Macaulay duration of ${num(macSemi, 4)} years and a 5% annual yield. Modified duration, ${inline(String.raw`Mod=\frac{Mac}{1+y/2}`)}, is closest to:`,
      modSemi,
      [macSemi, macSemi / 1.05, macSemi * 1.025, 5],
      yearsFmt,
      (shown) =>
        `Frequency is 2, so the adjustment uses the semiannual periodic yield. ${block(String.raw`Mod=\frac{${num(macSemi, 4)}}{1+0.05/2}=\frac{${num(macSemi, 4)}}{1.025}=${num(modSemi, 4)}`)} ` +
        `Dividing by 1.05 would treat the bond as annual-pay. Multiplying by 1.025 increases duration instead of converting it. Modified duration is closest to ${shown}.`,
    ),
    numQ(
      'fi-duration',
      'medium',
      `An option-free bond of Westmere Steel is priced at ${num(p0, 2)}. If its own yield falls by 25 basis points the price is ${num(pDown, 2)}, and if the yield rises by 25 basis points the price is ${num(pUp, 2)}. Approximate modified duration, ${inline(String.raw`\frac{P_{-}-P_{+}}{2P_0\Delta y}`)}, is closest to:`,
      approxMod,
      [(pDown - p0) / (p0 * shock), (p0 - pUp) / (p0 * shock), (pDown - pUp) / (p0 * shock)],
      yearsFmt,
      (shown) =>
        `The central difference uses both the price increase and the price decrease. ${block(String.raw`ApproxMod=\frac{${num(pDown, 2)}-${num(pUp, 2)}}{2\times ${num(p0, 2)}\times 0.0025}=${num(approxMod, 4)}`)} ` +
        `Using only the down move, or only the up move, is a one-sided estimate. Omitting the 2 in the denominator doubles the statistic. Because the bond is option-free, this yield-based approximate modified duration is an appropriate price sensitivity. It is closest to ${shown}.`,
    ),
    numQ(
      'fi-duration',
      'medium',
      `Harborline Holdings annual-pay bond has modified duration ${num(modRounded, 4)} and a full price of ${num(priceRounded, 2)} per 100 of face. The price value of a basis point, ${inline(String.raw`PVBP\approx Mod\times P\times 0.0001`)}, is closest to:`,
      pvbp,
      [modRounded * priceRounded * 0.01, modRounded * 0.0001, priceRounded * 0.0001],
      (value) => num(value, 4),
      (shown) =>
        `PVBP is the absolute price change for a one basis point move in yield. ${block(String.raw`PVBP\approx ${num(modRounded, 4)}\times ${num(priceRounded, 2)}\times 0.0001=${num(pvbp, 6)}`)} ` +
        `Using 0.01 instead of 0.0001 computes a full percentage-point move. Dropping either duration or price leaves the product incomplete. The price value of one basis point is closest to ${shown}.`,
    ),
    numQ(
      'fi-duration',
      'hard',
      `Using modified duration ${num(modRounded, 4)} and full price ${num(priceRounded, 2)}, estimate the new full price after an immediate 40 basis point increase in yield. Ignore convexity. The estimated price, ${inline(String.raw`P_{new}\approx P(1-Mod\times 0.004)`)}, is closest to:`,
      newPrice,
      [priceRounded * (1 + modRounded * dy), priceRounded - modRounded * dy, priceRounded],
      px,
      (shown) =>
        `The duration line says the percent change is minus modified duration times the yield change. ${block(String.raw`\frac{\Delta P}{P}\approx -${num(modRounded, 4)}\times 0.004`)} ` +
        `${block(String.raw`P_{new}\approx ${num(priceRounded, 2)}\times(1-${num(modRounded * dy, 6)})=${num(newPrice, 4)}`)} ` +
        `A plus sign would raise the price when the yield rises, which reverses the inverse relationship. Subtracting the duration statistic itself, rather than duration times price times the yield change, is not a currency price. Convexity is omitted, as the question asks. The estimated price is closest to ${shown}.`,
    ),
    numQ(
      'fi-duration',
      'easy',
      `Money duration of the Harborline Holdings bond, with modified duration ${num(modRounded, 4)} and full price ${num(priceRounded, 2)}, is ${inline(String.raw`MoneyDur=Mod\times P`)}. That money duration is closest to:`,
      moneyDuration,
      [modRounded, priceRounded, modRounded * priceRounded * 0.0001],
      px,
      (shown) =>
        `Money duration multiplies the percent sensitivity by the full price. ${block(String.raw`MoneyDur=${num(modRounded, 4)}\times ${num(priceRounded, 2)}=${num(moneyDuration, 4)}`)} ` +
        `The approximate currency price change is minus this number times the annual yield change. Modified duration alone is not in currency units, and multiplying again by 0.0001 would produce the price value of a basis point rather than money duration. Money duration is closest to ${shown}.`,
    ),
  ]
}

function convexityConcept(): Draft[] {
  return rows('fi-convexity', [
    [
      'easy',
      'For an option-free bond, the price-yield curve bends in the investor favor relative to the straight duration line. The actual price most likely:',
      'Rises by more than the duration estimate when the yield falls, and falls by less when the yield rises',
      'Rises by less than the duration estimate when the yield falls, and falls by more when the yield rises',
      'Matches the duration line exactly once the yield move exceeds 100 basis points',
      'Positive convexity means the true price lies above the duration tangent. When yields fall, the price increase is larger than duration predicts. When yields rise, the price decline is smaller than duration predicts. The gap grows with the size of the yield move; it does not disappear for large moves.',
    ],
    [
      'medium',
      'A portfolio duration statistic that is meant to describe a parallel yield shift is most likely computed as:',
      'The market-value-weighted average of the individual durations',
      'The equal-weighted average of the individual durations, ignoring position size',
      'The sum of the individual durations, with no weights',
      'Portfolio duration is the sum of each holding duration times that holding share of portfolio market value. A large position therefore matters more than a small one. An equal-weighted average ignores those sizes, and adding durations without weights does not produce a portfolio statistic.',
    ],
    [
      'medium',
      'Yield-based portfolio duration and convexity assume the benchmark move is parallel. They most likely do not capture:',
      'A twist in which short-maturity yields rise while long-maturity yields fall',
      'The direction of the price change when every maturity yield rises by the same amount',
      'The coupon cash the portfolio is scheduled to receive',
      'A single duration and a single convexity describe one yield number moving by the same amount at every maturity. A twist is a non-parallel move and needs key-rate or similar curve exposures. The parallel tool still gets the sign of a uniform yield increase right: prices fall. Coupon cash is a separate source of return, not the curve-shape limitation.',
    ],
    [
      'hard',
      'A callable bond of Marlowe Glass is already priced near the call price. If yields fall further, its effective convexity in that region most likely:',
      'Is negative, because the call caps further price gains',
      'Becomes more positive than the convexity of an option-free bond',
      'Equals the bond Macaulay duration',
      'As the issuer call moves into the money, the price does not keep rising like an option-free bond. The price-yield curve bends the other way and effective convexity can be negative. That is worse for the investor than positive convexity. Convexity is not equal to Macaulay duration; they are different statistics.',
    ],
    [
      'medium',
      'Two option-free bonds have the same modified duration and the same yield. The bond with the larger annual convexity most likely:',
      'Outperforms if the yield moves by a large amount in either direction',
      'Underperforms if the yield moves by a large amount in either direction',
      'Has a different one-basis-point price sensitivity even though the durations match',
      'The convexity adjustment is one-half times convexity times the yield change squared, and that term is positive for a larger convexity whether the yield rises or falls. For a tiny move the duration term dominates, so equal durations mean nearly equal one-basis-point risk. The extra convexity shows up when the move is large. The stem gives both bonds the same yield, so the extra convexity has not been paid for with a lower yield.',
    ],
    [
      'hard',
      'In the percent price-change formula, the convexity term is one-half times annual convexity times the squared yield change. For a yield change of only a few basis points, that term most likely:',
      'Is much smaller than the duration term because it depends on the square of a small number',
      'Dominates the duration term whenever convexity is positive',
      'Is subtracted when yields fall and added when yields rise',
      'A change of 0.0003 squared is a very small number, so the second-order term is tiny next to modified duration times that change. Positive convexity does not overturn the duration estimate for a one-basis-point move. The convexity term is added for both an increase and a decrease in yield, because the squared change is positive either way.',
    ],
  ])
}

function convexityCalcs(): Draft[] {
  const mod = 6.4
  const convexity = 48
  const up = math.percentPriceChange(mod, convexity, 0.005)
  const down = math.percentPriceChange(mod, convexity, -0.005)
  const durationOnlyUp = -mod * 0.005
  const p0 = 98.4
  const pDown = 101.15
  const pUp = 95.85
  const shock = 0.01
  const approxConv = math.approxConvexity(pDown, pUp, p0, shock)
  const w1 = 3.6 / 6
  const w2 = 2.4 / 6
  const portDur = w1 * 5.2 + w2 * 8.5
  const portConv = w1 * 32 + w2 * 80
  const adjustment = 0.5 * convexity * 0.005 ** 2
  return [
    numQ(
      'fi-convexity',
      'medium',
      `An option-free bond has annual modified duration of 6.40 and annual convexity of 48. For an immediate 50 basis point increase in yield, the estimated percentage price change, ${inline(String.raw`\Delta P/P\approx -Mod\Delta y+\frac{1}{2}Conv(\Delta y)^2`)}, is closest to:`,
      up,
      [durationOnlyUp, -mod * 0.005 + convexity * 0.005 ** 2, mod * 0.005],
      rate,
      (shown) =>
        `Use the annual statistics with the annual yield change of 0.005. ${block(String.raw`\frac{\Delta P}{P}\approx -6.40\times 0.005+\frac{1}{2}\times 48\times(0.005)^2`)} ` +
        `${block(String.raw`=-0.0320+0.0006=-0.0314`)} The convexity term is positive, so the price decline is slightly smaller than the duration-only estimate of -3.20%. Dropping the one-half, or flipping the sign of the whole estimate, does not match the formula. The percentage price change is closest to ${shown}.`,
    ),
    numQ(
      'fi-convexity',
      'medium',
      `The same bond has annual modified duration 6.40 and annual convexity 48. For an immediate 50 basis point decrease in yield, the estimated percentage price change, ${inline(String.raw`\Delta P/P\approx -Mod\Delta y+\frac{1}{2}Conv(\Delta y)^2`)}, is closest to:`,
      down,
      [-mod * -0.005, -mod * -0.005 - 0.5 * convexity * 0.005 ** 2, mod * -0.005],
      rate,
      (shown) =>
        `A yield decline makes the duration term positive, and the squared convexity term stays positive. ${block(String.raw`\frac{\Delta P}{P}\approx -6.40\times(-0.005)+\frac{1}{2}\times 48\times(0.005)^2`)} ` +
        `${block(String.raw`=0.0320+0.0006=0.0326`)} The bond price therefore rises by more than the duration-only estimate of 3.20%. Subtracting the convexity adjustment would describe negative convexity, which this option-free bond does not have. The percentage price change is closest to ${shown}.`,
    ),
    numQ(
      'fi-convexity',
      'hard',
      `An option-free bond of Bramble and Co. is priced at 98.40. After a 100 basis point decrease in its yield the price is 101.15, and after a 100 basis point increase the price is 95.85. Annual approximate convexity, ${inline(String.raw`\frac{P_{-}+P_{+}-2P_0}{P_0(\Delta y)^2}`)}, is closest to:`,
      approxConv,
      [(pDown + pUp - 2 * p0) / (p0 * shock), (pDown - pUp) / (2 * p0 * shock), (pDown + pUp - 2 * p0) / p0],
      px,
      (shown) =>
        `Convexity uses the sum of the two shocked prices, not their difference. ${block(String.raw`ApproxConv=\frac{101.15+95.85-2\times 98.40}{98.40\times(0.01)^2}=${num(approxConv, 4)}`)} ` +
        `The numerator is ${num(pDown + pUp - 2 * p0, 2)}, a small positive amount, and dividing by the squared yield shock produces a positive annual convexity. The difference of the prices over 2 P0 dy is approximate duration, not convexity. Approximate convexity is closest to ${shown}.`,
    ),
    numQ(
      'fi-convexity',
      'easy',
      `A portfolio holds 3.60 million market value of a bond with modified duration 5.20 and 2.40 million market value of a bond with modified duration 8.50. Portfolio modified duration for a parallel shift, ${inline(String.raw`D_p=w_1 D_1+w_2 D_2`)}, is closest to:`,
      portDur,
      [(5.2 + 8.5) / 2, 0.4 * 5.2 + 0.6 * 8.5, 5.2 + 8.5],
      yearsFmt,
      (shown) =>
        `Weights are market-value shares. Total value is 6.00 million, so the weights are 0.60 and 0.40. ${block(String.raw`D_p=0.60\times 5.20+0.40\times 8.50=3.12+3.40=6.52`)} ` +
        `An equal-weighted average ignores the larger first position. Swapping the weights gives the other portfolio. Adding the durations without weights is not an average. Portfolio duration is closest to ${shown}.`,
    ),
    numQ(
      'fi-convexity',
      'medium',
      `The same two positions have annual convexities of 32 and 80. Market values remain 3.60 million and 2.40 million. Portfolio convexity, ${inline(String.raw`C_p=w_1 C_1+w_2 C_2`)}, is closest to:`,
      portConv,
      [(32 + 80) / 2, 0.4 * 32 + 0.6 * 80, 32 + 80],
      px,
      (shown) =>
        `Portfolio convexity uses the same market-value weights as portfolio duration. ${block(String.raw`C_p=0.60\times 32+0.40\times 80=19.2+32.0=51.2`)} ` +
        `This statistic, like portfolio duration, assumes a parallel yield move. The equal-weighted average and the swapped-weight average describe different portfolios. Portfolio convexity is closest to ${shown}.`,
    ),
    numQ(
      'fi-convexity',
      'easy',
      `Annual convexity is 48 and the yield change is 50 basis points. The convexity adjustment alone, ${inline(String.raw`\frac{1}{2}\times 48\times(0.005)^2`)}, is closest to:`,
      adjustment,
      [convexity * 0.005 ** 2, 0.5 * convexity * 0.005, 0.5 * convexity * 0.005 ** 2 * 100],
      rate,
      (shown) =>
        `The second-order piece is one-half times annual convexity times the squared yield change. ${block(String.raw`\frac{1}{2}\times 48\times 0.000025=0.0006`)} ` +
        `As a percent of price that is 0.06 percentage points of return, reported as ${shown}. Forgetting the one-half doubles it. Forgetting to square 0.005 makes the term far too large. The adjustment is added to the duration estimate for both a yield increase and a yield decrease. It is closest to ${shown}.`,
    ),
  ]
}

function curveRisk(): Draft[] {
  const p0 = 101
  const pDown = 102.2
  const pUp = 99.4
  const shock = 0.01
  const effective = math.approxModifiedDuration(pDown, pUp, p0, shock)
  const effectiveConv = math.approxConvexity(pDown, pUp, p0, shock)
  return [
    ...rows('fi-curve-risk', [
      [
        'easy',
        'A callable bond of Sablemere Chemicals can be redeemed when yields fall, so its remaining cash flows are not fixed. The appropriate yield-curve sensitivity is most likely:',
        'Effective duration',
        'Modified duration based on the bond own yield to maturity, holding the cash flows fixed',
        'Macaulay duration, because a call does not change the weighted time to cash',
        'Modified and Macaulay duration assume the promised schedule does not change when the benchmark moves. A call lets the issuer change that schedule. Effective duration reprices the bond after a benchmark curve shock, allowing the cash flows to change, and uses those two prices in the central-difference formula.',
      ],
      [
        'medium',
        'Effective duration differs from approximate modified duration in the experiment that produces the two shocked prices. Effective duration most likely shocks:',
        'The benchmark curve, and then reprices the bond, allowing embedded-option cash flows to change',
        'Only the bond coupon rate, leaving the discount rate unchanged',
        'The recovery rate used in a credit-loss model',
        'The effective-duration calculation shifts the benchmark curve up and down, rebuilds the bond value under each curve, and only then applies (P_down - P_up) / (2 P0 dy). For a callable or putable bond the new curve can change the assumed exercise. Shifting the coupon, or a recovery assumption, is a different sensitivity.',
      ],
      [
        'medium',
        'Key-rate duration is best described as the sensitivity of the bond to:',
        'A change in one maturity point on the benchmark curve, with other points held unchanged',
        'A parallel move of the entire curve by the same number of basis points',
        'A change in the issuer rating letter, holding the curve fixed',
        'A key-rate duration isolates one vertex of the curve, such as the 2-year or the 10-year point. Effective duration is closer to the parallel case, in which the whole curve moves. The sum of key-rate durations approximates effective duration for that parallel move. A rating change is credit migration, not a key rate.',
      ],
      [
        'hard',
        'A bullet bond and a barbell portfolio have the same effective duration. Relative to the bullet, the barbell most likely has:',
        'More key-rate exposure at the short and long maturities, and therefore more curve-shaping risk',
        'The same key-rate exposures, because equal effective durations fix every curve exposure',
        'Less convexity, because spreading cash flows across maturities removes the second-order term',
        'Equal effective duration means similar sensitivity to a parallel shift, not identical sensitivity to every vertex. A barbell loads the short and long key rates and has less intermediate exposure, so a twist changes its value differently from a bullet. Spreading the cash flows also gives the barbell more convexity, not less.',
      ],
      [
        'hard',
        'Historical regressions show that credit spreads on notes of Fennelbrook Agriculture often tighten when government yields rise. Compared with analytical duration that holds the credit spread fixed, empirical duration in that sample is most likely:',
        'Smaller, because the spread tightening offsets part of the government-yield increase',
        'Larger, because the spread move adds to the government-yield increase',
        'Equal to Macaulay duration by construction',
        'Analytical duration reprices the bond with the credit spread unchanged, so a rise in the government yield passes fully into the discount rate. If the corporate spread tightens at the same time, the corporate yield rises by less and the price falls by less. A regression of that history therefore fits a smaller empirical duration. It is not forced to equal Macaulay duration.',
      ],
      [
        'medium',
        'A single effective duration for a mortgage-backed security most likely leaves the investor exposed to:',
        'Curve-shaping risk, because prepayments and the cash-flow weights can respond differently at different maturities',
        'No remaining interest-rate risk, because effective duration already includes every twist',
        'Call risk only, with no extension risk if the curve steepens',
        'Effective duration summarizes a parallel benchmark move after the security cash flows are allowed to change. It does not describe a steepening, a flattening, or a butterfly. Mortgage cash flows depend on the level and shape of the curve through prepayments, so shaping risk remains. Extension risk is still present when rates rise.',
      ],
    ]),
    numQ(
      'fi-curve-risk',
      'medium',
      `A callable bond of Marlowe Glass is priced at 101.00. After the benchmark curve falls by 100 basis points the model price is 102.20, and after the curve rises by 100 basis points the model price is 99.40. Cash flows are allowed to change. Effective duration, ${inline(String.raw`EffDur=\frac{P_{-}-P_{+}}{2P_0\Delta y}`)}, is closest to:`,
      effective,
      [(pDown - p0) / (p0 * shock), (p0 - pUp) / (p0 * shock), (pDown - pUp) / (p0 * shock)],
      yearsFmt,
      (shown) =>
        `Effective duration uses the same central difference as approximate modified duration, but the prices come from benchmark-curve shocks that can change the call decision. ${block(String.raw`EffDur=\frac{102.20-99.40}{2\times 101.00\times 0.01}=${num(effective, 4)}`)} ` +
        `The price rise when yields fall is smaller than the price drop when yields rise, which is the callable pattern. A one-sided ratio would not use both model prices. Effective duration is closest to ${shown}.`,
    ),
    numQ(
      'fi-curve-risk',
      'hard',
      `Using the same callable-bond prices of 102.20, 101.00, and 99.40 for a 100 basis point curve shock, effective convexity, ${inline(String.raw`\frac{P_{-}+P_{+}-2P_0}{P_0(\Delta y)^2}`)}, is closest to:`,
      effectiveConv,
      [(pDown - pUp) / (2 * p0 * shock), (pDown + pUp - 2 * p0) / (p0 * shock), Math.abs(effectiveConv)],
      px,
      (shown) =>
        `The numerator is 102.20 + 99.40 - 2 times 101.00, which is negative because the price gain is capped relative to the price loss. ${block(String.raw`EffConv=\frac{102.20+99.40-202.00}{101.00\times(0.01)^2}=${num(effectiveConv, 4)}`)} ` +
        `Negative effective convexity is the curve-risk signature of a call that limits upside. The absolute value would hide that sign, and the difference of the two prices is a duration calculation. Effective convexity is closest to ${shown}.`,
    ),
  ]
}

function credit(): Draft[] {
  const expectedLoss = 0.02 * 0.45 * 25_000_000
  const lossGiven = 12_000_000 * 0.3
  return [
    ...rows('fi-credit', [
      [
        'easy',
        'Expected loss on a corporate bond is best described as:',
        'Default probability times loss given default times exposure at default',
        'The rating-agency letter translated directly into a bond price',
        'The full face value, because every default eliminates the entire position with no recovery',
        'A standard expected-loss identity multiplies the probability of default by the loss given default and by the exposure outstanding at default. Loss given default already reflects one minus the recovery rate, so the face value is not automatically lost. A rating is an ordinal opinion, not this product.',
      ],
      [
        'medium',
        'A credit rating assigned to Bramble and Co. is most accurately described as:',
        'An ordinal opinion about credit risk, not a recommendation to buy or sell the bond',
        'A guarantee that the bond will not default during the next year',
        'A target price published so traders can mark the bond',
        'Ratings rank credit risk. They are not cardinal probabilities, they are not trade recommendations, and they are not guarantees. Two agencies can also disagree. Portfolio decisions still need price, spread, and the investor mandate. The rating does not set a market price target.',
      ],
      [
        'medium',
        'Two agencies rate the same Fennelbrook Agriculture note differently, and both ratings were last affirmed six months ago. An analyst should most likely treat the ratings as:',
        'Opinions that can disagree and that can lag a change in credit conditions',
        'Exact default probabilities that must be identical once the issuer is the same',
        'Irrelevant whenever a yield spread can be observed, because a spread contains only default risk',
        'Agencies use different methods and can update on different schedules, so split ratings and stale ratings both occur. A market spread is useful but mixes default risk, liquidity, and risk premia; it does not make the rating a useless object or convert either measure into a shared exact probability.',
      ],
      [
        'hard',
        'Over a month, a fixed-rate corporate bond of Whitecap Marine falls in price even though the issuer pays the coupon and does not default. The loss is most likely an example of:',
        'Credit-spread risk from a widening spread',
        'A coupon reset, which occurs monthly on every fixed-rate bond',
        'Recovery risk, which is realized only after a default',
        'Spread risk is the risk that the credit spread widens and the price falls while the issuer is still performing. A fixed coupon does not reset monthly. Recovery risk and loss given default become cash outcomes when a default occurs; they are not the name for a mark-to-market spread move on a performing bond.',
      ],
      [
        'easy',
        'If the expected recovery on a senior secured note is 60% of exposure, the loss given default as a fraction of exposure is most likely:',
        '40%',
        '60%',
        'Zero, because a secured note cannot default',
        'Loss given default equals one minus the recovery rate when both are measured against the same exposure. A 60% recovery leaves a 40% loss given default. Security raises expected recovery; it does not prevent default. Quoting the recovery rate itself as the loss reverses the definition.',
      ],
      [
        'hard',
        'Expected loss is a mean used in pricing a credit. Unexpected loss most likely refers to:',
        'The risk that the realized loss is worse than the mean, which is why capital and risk premia exist',
        'Another name for expected loss, expressed as a letter rating',
        'A loss that is excluded from both ratings and spreads by market convention',
        'Expected loss can be charged for in the spread, but the outcome can be much worse than the mean if defaults cluster or recoveries disappoint. That dispersion is unexpected loss. It is not a restatement of the mean, and it is a central reason credit investors and banks hold capital against a portfolio.',
      ],
    ]),
    numQ(
      'fi-credit',
      'medium',
      `Sablemere Chemicals has a 2.00% probability of default, a 45% loss given default, and exposure of 25,000,000. Expected loss, ${inline(String.raw`EL=PD\times LGD\times EAD`)}, is closest to:`,
      expectedLoss,
      [0.02 * 25_000_000, 0.45 * 25_000_000, 0.02 * 0.45],
      cash,
      (shown) =>
        `Multiply the three inputs. ${block(String.raw`EL=0.020\times 0.45\times 25{,}000{,}000=225{,}000`)} ` +
        `Dropping the loss given default treats the entire exposure as lost. Dropping the default probability treats a default as certain. The product of the two rates, without the exposure, is not a currency amount. Expected loss is closest to ${shown}.`,
    ),
    numQ(
      'fi-credit',
      'easy',
      `A note has exposure at default of 12,000,000 and an expected recovery of 70% of exposure. The loss given default in currency units, ${inline(String.raw`LGD_{currency}=EAD\times(1-0.70)`)}, is closest to:`,
      lossGiven,
      [12_000_000 * 0.7, 12_000_000, 12_000_000 * 0.7 * 0.3],
      cash,
      (shown) =>
        `Recovery of 70% means loss severity of 30%. ${block(String.raw`12{,}000{,}000\times 0.30=3{,}600{,}000`)} ` +
        `The 70% figure is what the investor expects to receive, not what the investor expects to lose. The full exposure would be the loss only if recovery were zero. The currency loss given default is closest to ${shown}.`,
    ),
  ]
}

function creditGov(): Draft[] {
  return rows('fi-credit-gov', [
    [
      'easy',
      'Sovereign credit analysis of the Republic of Valden must consider both ability to pay and willingness to pay. Willingness matters most likely because:',
      'A government can sometimes have resources and still choose to restructure for political reasons',
      'A government cannot collect taxes, so ability is never observable',
      'Local-currency debt is legally identical to a household mortgage',
      'Corporate borrowers are forced through a bankruptcy process. A sovereign is not. Ability covers taxing power, the economy, and external resources. Willingness covers institutions and the political choice to honor the debt. Taxes are a central part of ability, and sovereign debt is not a household mortgage.',
    ],
    [
      'medium',
      'Compared with local-currency debt of the Commonwealth of Ostmark, its foreign-currency debt most likely has:',
      'Greater risk that the sovereign cannot obtain the currency it owes, because it cannot create that currency',
      'Less risk, because foreign-currency debt is senior to all local-currency debt by international law',
      'The same risk, because a sovereign can always convert local currency into any foreign currency at a fixed rate',
      'Printing local currency can meet a local-currency coupon, at the cost of inflation and the exchange rate. It cannot directly produce a foreign currency. Foreign-currency repayment depends on reserves, the trade balance, and external financing. There is no general rule that foreign-currency bonds are legally senior, and the exchange rate is not fixed by the mere existence of the debt.',
    ],
    [
      'hard',
      'Two sovereigns have the same government-debt-to-GDP ratio. An analyst at Meridian Development Bank should most likely still distinguish them by:',
      'Institutions, the external balance, and whether the debt is in local or foreign currency',
      'The debt ratio alone, because institutions do not affect willingness or ability to pay',
      'The coupon frequency on the benchmark bond, which determines sovereign default probability',
      'A debt ratio omits growth, interest cost, the currency mix, reserve coverage, and whether the political system will pay. External liabilities and a weak institutional setting can make the same ratio much riskier. Coupon frequency is a cash-flow detail of a bond, not the driver of sovereign default probability.',
    ],
    [
      'medium',
      'A burst of inflation in the Federation of Calden most likely has which effect on its existing fixed-rate local-currency debt?',
      'It reduces the real burden of that debt, while damaging monetary credibility',
      'It increases the real burden one-for-one and leaves the exchange rate unaffected',
      'It converts the local-currency debt into foreign-currency debt',
      'Unexpected inflation helps a borrower with fixed nominal local-currency obligations by eroding the real value of the payments. That relief is not free: it can raise future borrowing costs and weaken the currency. Inflation does not, by itself, redenominate the debt into a foreign currency. The real burden falls rather than rises.',
    ],
    [
      'hard',
      'The Republic of Valden exports one commodity, collects most public revenue from it, and has a large stock of foreign-currency bonds. A sharp fall in the commodity price most likely:',
      'Pressures both the budget and the foreign currency needed to service the external debt',
      'Improves debt service, because a lower export price reduces the foreign-currency amount owed',
      'Affects only local-currency inflation and cannot affect external debt service',
      'Commodity revenue is both fiscal capacity and a source of foreign exchange. A price collapse can widen the deficit and shrink the dollars, or other foreign currency, available to pay external coupons. The contractual foreign-currency amount does not fall just because the export price falls. This is an ability-to-pay shock, not a purely domestic inflation story.',
    ],
  ])
}

function creditCorp(): Draft[] {
  const coverage = 88 / 21.5
  const debtToEbitda = 640 / 160
  return [
    ...rows('fi-credit-corp', [
      [
        'medium',
        'An analyst of Ironwharf Logistics finds interest coverage above the peer median, but also finds that the controlling shareholder uses related-party transactions to extract cash. The weakest credit factor is most likely:',
        'Character, meaning the willingness to direct cash to creditors',
        'Capacity, because a high coverage ratio proves cash generation is inadequate',
        'Collateral, because related-party transactions increase the value of pledged plants',
        'The four Cs separate capacity, collateral, covenants, and character. Coverage is a capacity indicator and here it is strong. Diverting cash through related-party deals is a governance and willingness problem, which is character. Those transactions do not increase collateral value for lenders.',
      ],
      [
        'easy',
        'In a bankruptcy of Quill and Oak Retail, the usual ranking from highest to lowest recovery priority is most likely:',
        'Senior secured, then senior unsecured, then subordinated',
        'Subordinated, then senior unsecured, then senior secured',
        'Senior unsecured, then senior secured, then equity, with subordinated debt beside equity',
        'A first lien on collateral is paid from that collateral before unsecured claims. Senior unsecured claims rank ahead of subordinated debt, which ranks ahead of equity. Subordination is a contractual agreement to be paid after senior creditors. Secured status is not junior to unsecured status.',
      ],
      [
        'hard',
        'The issuer rating of Quill and Oak Retail is investment grade, yet a subordinated unsecured note of the same issuer can carry a lower issue rating than its senior unsecured notes. That difference is most likely:',
        'Notching for loss severity, because the subordinated note ranks lower in recovery',
        'A different probability of default, because subordinated debt defaults only after senior debt is repaid in full',
        'Proof that the two notes have different issuers',
        'An issuer default typically triggers default across its bond classes through cross-default, so the probability of default is a property of the issuer. Issue ratings are notched for loss given default. Subordinated notes are notched down because expected recovery is worse. They are still obligations of the same issuer.',
      ],
      [
        'medium',
        'A maintenance covenant on Northveil Industrials notes tests leverage every quarter. Relative to waiting for a missed coupon, this covenant most likely:',
        'Gives lenders an earlier signal and a chance to renegotiate before a payment default',
        'Eliminates default risk, because the ratio cannot be breached once it is written down',
        'Removes the need for a seniority ranking if the issuer later fails',
        'Maintenance covenants are early-warning devices. A breach can create a default or a consent process while the issuer is still paying coupons. The covenant does not make a breach impossible, and it does not replace collateral or ranking once a bankruptcy begins. It is a contract term, not a guarantee.',
      ],
      [
        'easy',
        'Collateral in corporate credit analysis is best described as:',
        'The assets lenders can claim, which support recovery if the issuer defaults',
        'The same concept as character, because both measure willingness to pay',
        'Irrelevant for secured bonds, because security removes credit risk',
        'Collateral is what backs recovery. Its quality, liquidity, and priority drive loss given default. Character is willingness, and capacity is cash flow versus debt service. Security improves expected recovery; it does not erase the possibility of default or the need to value the assets.',
      ],
      [
        'medium',
        'Capacity, as one of the four Cs for a corporate issuer such as Amberfield Dairy, is most likely assessed by:',
        'Cash flow relative to debt service, including coverage and leverage ratios',
        'Only the personal reputation of the chief executive',
        'Only the legal ranking of the newest subordinated note',
        'Capacity asks whether the business generates enough cash to pay interest and principal. Coverage and leverage ratios are the usual evidence. Reputation belongs with character. The ranking of one note belongs with priority and loss severity, which matter after capacity has already failed.',
      ],
    ]),
    numQ(
      'fi-credit-corp',
      'easy',
      `Last year Fennelbrook Agriculture reported EBIT of 88 million and interest expense of 21.5 million. Interest coverage, ${inline(String.raw`\frac{EBIT}{Interest}`)}, is closest to:`,
      coverage,
      [21.5 / 88, (88 - 21.5) / 21.5, 88 / 21.5 / 2],
      (value) => num(value, 2),
      (shown) =>
        `Interest coverage compares operating profit with the contractual interest. ${block(String.raw`\frac{88}{21.5}=4.093`)} ` +
        `A higher coverage means more capacity to service debt. Inverting the ratio, or subtracting interest from EBIT before dividing, answers a different question. Interest coverage is closest to ${shown}.`,
    ),
    numQ(
      'fi-credit-corp',
      'medium',
      `Glasswater Hotels has gross debt of 640 million, EBITDA of 160 million, and EBIT of 128 million. The debt-to-EBITDA ratio, ${inline(String.raw`\frac{640}{160}`)}, is closest to:`,
      debtToEbitda,
      [640 / 128, 160 / 640, 128 / 160],
      (value) => num(value, 2),
      (shown) =>
        `Debt to EBITDA uses gross debt in the numerator and EBITDA in the denominator. ${block(String.raw`\frac{640}{160}=4.00`)} ` +
        `Dividing by EBIT of 128 produces a higher leverage ratio and is a different metric. Inverting the ratio produces an EBITDA-to-debt coverage figure, not leverage. The debt-to-EBITDA ratio is closest to ${shown}.`,
    ),
  ]
}

function securitization(): Draft[] {
  return rows('fi-securitization', [
    [
      'medium',
      'In a typical securitization, the loans leave the originator through a true sale to a special purpose entity. That structure is intended to make the securities most likely:',
      'Bankruptcy remote from the originator, so investors look first to the pool rather than to the originator general creditors',
      'Obligations of the originator unsecured creditors, who can claw the loans back at any time',
      'Equity shares in the originator, with the loans kept as inventory',
      'Bankruptcy remoteness is the point of the special purpose entity. If the transfer is a true sale, the originator insolvency should not pull the pool back into the originator estate. Investors then depend on the pool, the tranching, and the servicing. A weak true-sale opinion undermines that protection. The securities are debt of the entity, not equity of the originator.',
    ],
    [
      'easy',
      'Tranching a loan pool most likely allows investors to:',
      'Choose a slice of credit risk and payment priority rather than share every loss pro rata',
      'Each receive the same rating regardless of which class they buy',
      'Avoid prepayment and default risk in every tranche, including the equity tranche',
      'Senior tranches are paid before junior tranches, so they carry less credit risk and a higher rating, while the junior slices absorb the first losses. Investors can match the slice to their mandate. Tranching reallocates risk; it does not remove default or prepayment from the structure, and the equity tranche is where credit risk is concentrated.',
    ],
    [
      'easy',
      'In a securitization, the servicer most likely:',
      'Collects payments from the borrowers and passes them through according to the waterfall',
      'Guarantees the senior tranche against every default',
      'Sets the monetary policy rate used to discount the tranches',
      'The servicer handles collections, delinquencies, and reporting. The trustee watches the rules of the indenture and holds the security interest for investors. A guarantee, if any, is credit enhancement from a specific provider, not an automatic duty of the servicer. The servicer does not set the policy rate.',
    ],
    [
      'medium',
      'The trustee in a securitization most likely:',
      'Represents investors by enforcing the agreements and overseeing the waterfall',
      'Originates the loans and keeps the credit risk on its own balance sheet',
      'Replaces the servicer as the borrower who owes the mortgage payments',
      'The trustee is the investors agent. It holds liens, monitors covenants, and directs cash according to the documents. The originator creates the loans. The borrowers remain the people who owe the payments. The trustee is not the borrower and is not automatically the owner of the credit risk.',
    ],
    [
      'medium',
      'An originator such as Southpier Ports securitizes a loan book. A typical motivation, assuming a true sale is achieved, is most likely:',
      'Funding, a smaller balance sheet, or a lower all-in cost than unsecured borrowing',
      'A requirement to keep the loans and the securitization debt on the same unsecured balance sheet',
      'Elimination of the need for investors to analyze the pool credit quality',
      'Securitization can turn illiquid loans into funded notes, can remove the assets and the related funding if the sale is recognized, and can price each tranche off its own risk. Those are issuer motivations. Investors still analyze the pool, the enhancement, and the waterfall. A covered bond, not a true-sale securitization, usually leaves the assets on the issuer balance sheet.',
    ],
    [
      'hard',
      'A risk that is specific to the incentive structure of a securitization, relative to a lender that keeps every loan, is most likely:',
      'Weaker origination standards if the originator does not retain a meaningful share of the credit risk',
      'The disappearance of servicing, because borrowers pay the trustee directly in cash at origination',
      'The inability to create a senior tranche',
      'If the originator sells the credit risk, the payoff to careful underwriting falls unless the originator retains a slice, provides representations, or is paid in a way that depends on performance. That moral hazard is a known securitization risk. Servicing still exists, and senior tranches are a standard part of the waterfall.',
    ],
  ])
}

function abs(): Draft[] {
  return rows('fi-abs', [
    [
      'medium',
      'Internal credit enhancement in an asset-backed security most likely includes:',
      'Subordination, overcollateralization, and excess spread',
      'A third-party surety bond only, with no junior tranche',
      'A government monetary-policy put that floors every borrower payment',
      'Internal enhancement uses the structure itself. Subordination makes junior tranches take losses first. Overcollateralization means the pool balance exceeds the notes. Excess spread is the remaining interest after note interest, servicing, and losses. A bank letter of credit or a surety bond is external enhancement because a third party provides it.',
    ],
    [
      'easy',
      'External credit enhancement of an asset-backed security is most likely provided by:',
      'A third-party guarantee or a letter of credit',
      'The excess of the pool coupon over the note coupon, with no third party',
      'A longer legal maturity on the senior tranche',
      'External enhancement is a promise from outside the pool, such as a guarantee, a letter of credit, or a surety. Excess spread is internal. Extending the legal final maturity changes the clock for principal; it does not add a third-party promise to absorb losses.',
    ],
    [
      'medium',
      'A covered bond issued by Cinderwell Utilities, compared with a typical auto-loan asset-backed security, most likely:',
      'Gives investors dual recourse to the cover pool and to the issuer, with the assets usually remaining on the issuer balance sheet',
      'Is a true sale that removes the cover pool from the issuer balance sheet and leaves investors with recourse only to the pool',
      'Has no recourse to either the issuer or the cover pool',
      'Covered bonds are dual-recourse instruments. If the cover pool is insufficient, investors still have a claim on the issuer. The assets typically stay on the issuer balance sheet and are pledged, rather than being sold to a special purpose entity. A typical asset-backed security aims at the opposite balance-sheet result: a true sale and recourse to the pool.',
    ],
    [
      'hard',
      'An auto-loan asset-backed security is structured as a true sale to a special purpose entity. If that true sale holds, investors most likely have:',
      'Recourse to the loan pool, and the loans are no longer assets of the originator available to its general creditors',
      'Dual recourse to the originator and to the pool, which is the covered-bond arrangement',
      'Recourse only to the originator unsecured credit, because a true sale keeps the loans on the originator balance sheet',
      'The usual asset-backed structure sells the receivables to the entity. If the sale is a true sale, the originator general creditors cannot reach the pool, and investors do not have ordinary unsecured recourse to the originator. Dual recourse with assets left on the balance sheet describes a covered bond, not this true sale.',
    ],
    [
      'medium',
      'A credit-card asset-backed security during its revolving period most likely:',
      'Uses principal collections to buy new receivables, until an early-amortization trigger starts paying principal to investors',
      'Pays every principal collection through to investors from the first month, like a fully amortizing auto deal',
      'Cannot stop the revolving period, even if charge-offs exceed the trigger',
      'Credit-card master trusts revolve: principal is reinvested in new card balances so the note balance stays outstanding. If performance tests fail, such as excess spread or delinquency triggers, the deal enters early amortization and principal is paid down. That is different from a granular auto-loan deal, which amortizes as the cars are paid off.',
    ],
    [
      'easy',
      'Collateral in a typical prime auto-loan asset-backed security, compared with credit-card receivables, most likely:',
      'Amortizes on a schedule, so the security pays down as the loans pay down',
      'Revolves for the entire legal life, with no scheduled principal',
      'Is commercial real estate with a single balloon payment and no monthly amortization',
      'Auto loans are amortizing consumer loans. As borrowers pay principal, the asset-backed security pays principal to noteholders. Credit-card receivables revolve until a trigger or a scheduled end. A single commercial-mortgage balloon is a commercial mortgage-backed structure, not a typical auto-loan pool.',
    ],
  ])
}

function mbs(): Draft[] {
  return rows('fi-mbs', [
    [
      'easy',
      'When mortgage rates fall, borrowers in a residential pass-through of the Province of Lirren housing pool refinance. Investors in that pass-through most likely face:',
      'Contraction risk: principal returns early and must be reinvested at lower yields, while the price rise is capped',
      'Extension risk only, because borrowers refinance when they want a longer loan',
      'No change in cash-flow timing, because a pass-through forbids unscheduled principal',
      'Prepayment rises when borrowers can refinance into a cheaper mortgage. Investors receive principal sooner, which shortens the security, and they reinvest at the new lower yields. The embedded prepayment option also limits how far the price can rise. That combination is contraction risk, not extension risk.',
    ],
    [
      'easy',
      'When mortgage rates rise well above the coupons on the underlying loans, prepayments on a residential mortgage-backed security most likely slow. Investors then most likely face:',
      'Extension risk, because principal remains outstanding longer while the discount rate is higher',
      'Contraction risk, because the higher rates force borrowers to prepay immediately',
      'A price increase larger than that of an otherwise identical option-free bond',
      'Borrowers have less reason to refinance when market rates are above their loan rate, so prepayments slow and the weighted average life extends. Investors are left holding a longer security just as discount rates rise, which hurts the price. An option-free bond does not add this extension. The slowdown is the opposite of contraction.',
    ],
    [
      'medium',
      'A pass-through distributes unscheduled principal pro rata. A sequential collateralized mortgage obligation made from similar loans most likely:',
      'Pays principal to the earliest tranche first, so later tranches have more extension exposure',
      'Pays every tranche the same principal fraction on every date, which is the pass-through rule',
      'Eliminates prepayment risk from the whole structure',
      'Sequential tranching concentrates principal on the front tranche until it is retired, then moves to the next. The last tranche waits, so its average life and extension risk are greater. A pass-through, by contrast, shares principal in proportion to balances. Reallocating prepayment risk is not the same as removing it.',
    ],
    [
      'hard',
      'Inside its prepayment collar, a planned amortization class tranche most likely:',
      'Keeps a more stable average life because the support tranche absorbs faster or slower prepayments',
      'Absorbs all prepayment variability so the support tranche can have a fixed schedule',
      'Is unaffected by prepayments even outside the collar, for the entire legal maturity',
      'The support, or companion, tranche is the shock absorber. Within the band, extra principal goes to the support tranche and shortfalls are taken there, so the planned amortization class stays near its schedule. Outside the band the protection can be exhausted and the planned class can still shorten or extend. The support tranche is the one with the unstable average life.',
    ],
    [
      'hard',
      'Compared with a residential pass-through, a commercial mortgage-backed security secured by income properties most likely has:',
      'More balloon refinance risk and less voluntary contraction risk, because commercial loans often restrict prepayment',
      'The same borrower refinancing behavior as a residential fixed-rate mortgage',
      'No credit analysis, because debt-service coverage and loan-to-value are equity statistics',
      'Commercial loans commonly include yield maintenance, defeasance, or lockout, so borrowers do not freely refinance when rates fall. Contraction risk is therefore lower than in a typical residential pass-through. The loan often has a balloon at the end of a shorter term, so investors face refinance risk. Underwriting looks directly at debt-service coverage and loan-to-value.',
    ],
    [
      'medium',
      'Because homeowners can prepay, the price-yield behavior of a residential mortgage-backed security at low yield levels is most likely:',
      'Negatively convex, with price gains capped as the prepayment option moves into the money',
      'More positively convex than an option-free bond of the same duration',
      'Linear, because prepayments do not depend on the level of rates',
      'The borrower prepayment option is like a call owned by the household. When yields fall, prepayments rise and the investor does not receive the full price appreciation of an option-free bond. The curve bends into negative convexity. Prepayments clearly depend on the rate level, so the price response is not a straight duration line.',
    ],
  ])
}

export function buildFixedIncome(): Draft[] {
  if (Math.abs(math.bondPrice(100, 0.06, 0.06, 2) - 100) > 1e-6) {
    throw new Error('bondPrice sanity check failed')
  }
  return [
    ...exactly('fi-features', 6, features()),
    ...exactly('fi-cashflows', 6, cashflows()),
    ...exactly('fi-issuance', 5, issuance()),
    ...exactly('fi-corpmarkets', 6, corpMarkets()),
    ...exactly('fi-govmarkets', 5, govMarkets()),
    ...exactly('fi-price', 16, [...priceCalcs(), ...priceConcept()]),
    ...exactly('fi-yields', 12, [...yieldsCalcs(), ...yieldsConcept()]),
    ...exactly('fi-floaters', 6, floaters()),
    ...exactly('fi-curve', 12, [...curveCalcs(), ...curveConcept()]),
    ...exactly('fi-return', 8, returns()),
    ...exactly('fi-duration', 14, [...durationCalcs(), ...durationConcept()]),
    ...exactly('fi-convexity', 12, [...convexityCalcs(), ...convexityConcept()]),
    ...exactly('fi-curve-risk', 8, curveRisk()),
    ...exactly('fi-credit', 8, credit()),
    ...exactly('fi-credit-gov', 5, creditGov()),
    ...exactly('fi-credit-corp', 8, creditCorp()),
    ...exactly('fi-securitization', 6, securitization()),
    ...exactly('fi-abs', 6, abs()),
    ...exactly('fi-mbs', 6, mbs()),
  ]
}

function main(): void {
  const drafts = buildFixedIncome()
  const questions = finalizeTopic('fixed-income', drafts)
  const levels = new Set(drafts.map((draft) => draft.difficulty))
  if (levels.size !== 3) throw new Error('fixed-income difficulty mix is incomplete')
  if (questions.length !== 155) throw new Error(`fixed-income length ${questions.length}`)
  console.log(`ok ${questions.length}`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
