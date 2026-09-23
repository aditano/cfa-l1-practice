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
  return numeric({ topicId: 'economics', losId, difficulty, stem, correct, wrong, format, explain })
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
  return q('economics', losId, difficulty, stem, correct, wrong1, wrong2, explanation)
}

function structures(): Draft[] {
  const keepOpen =
    'Keep producing in the short run, because price is above average variable cost and below average total cost.'
  const shutDown = 'Shut down in the short run, because price is below average variable cost.'
  const earnProfit = 'Earn an economic profit, because price is above average total cost.'
  const breakEvenPoint =
    'Economic profit is zero when price equals average total cost, which is a different point from the shutdown price.'
  const perfectComp =
    'Many sellers of the same product, free entry, and a horizontal demand curve facing each firm.'
  const monoComp =
    'Differentiated products and free entry, so long-run price equals average total cost while still exceeding marginal cost.'
  const cheat =
    'Each member can raise its own profit by quietly selling more than its quota, which can unravel the high price.'
  const monopolyRule =
    'Produce the quantity where marginal revenue equals marginal cost, then charge the price on the demand curve.'
  const natural =
    'Average total cost is still falling across the demand the market will buy, so one network can serve it more cheaply than two.'
  const supplyCurve =
    'The marginal-cost curve above average variable cost, because the firm produces only when price covers variable cost.'
  const mrMc =
    'Every structure sets marginal revenue equal to marginal cost, and only perfect competition also has marginal revenue equal to price.'
  const hhiVsCr =
    'The four-firm ratio ignores how unequal the top four are, while the HHI squares every firm’s share.'
  const hhiRise = 70 ** 2 + 30 ** 2 - (40 ** 2 + 30 ** 2 + 30 ** 2)
  const operatingLoss = (46 - 40) * 1000

  return exactly('eco-structures', 14, [
    idea(
      'eco-structures',
      'easy',
      'Harbor Glass is a price taker in the container market. The going price is USD 40 a case, average total cost is USD 46, and average variable cost is USD 37. In the short run the firm should:',
      keepOpen,
      'Shut down immediately, because any price below average total cost destroys value.',
      'Expand without limit, because a price above average variable cost is an economic profit.',
      `Short-run shutdown compares price with average variable cost, not with average total cost. Here ${inline(String.raw`AVC < P < ATC`)}, so operating loses less than closing and paying fixed cost. ${keepOpen}`,
    ),
    idea(
      'eco-structures',
      'medium',
      'Kelso Metals sells into a competitive slab market. The price has fallen to USD 22 a tonne. Average variable cost is USD 25 and average total cost is USD 31. The short-run operating decision is:',
      shutDown,
      'Keep producing, because a firm should shut down only when price is below average total cost.',
      'Raise the posted price to USD 31, because a price taker can choose the price that covers total cost.',
      `If price is below average variable cost, each extra unit adds less revenue than variable cost, so the loss exceeds fixed cost. ${inline(String.raw`P < AVC`)}. ${shutDown}`,
    ),
    idea(
      'eco-structures',
      'easy',
      'Rowan Dairy sells milk into a competitive regional pool at USD 18 a unit. Average total cost is USD 14 and average variable cost is USD 9. The firm’s short-run economic result is:',
      earnProfit,
      'A loss that should trigger shutdown, because variable cost is below total cost.',
      'Zero economic profit, because competitive firms are not allowed to earn more than normal profit in the short run.',
      `Economic profit appears when price exceeds average total cost: ${inline(String.raw`P > ATC`)}. The gap here is USD 4 a unit. ${earnProfit}`,
    ),
    idea(
      'eco-structures',
      'medium',
      'A study of the market for standard glass bottles describes many sellers, an identical product, and no meaningful barrier to a new furnace. Demand facing one seller is flat at the market price. That structure is:',
      perfectComp,
      'A monopoly, because a flat demand curve means the firm sets any price it wants.',
      'An oligopoly, because identical products are produced only by a handful of strategic rivals.',
      `Perfect competition combines many firms, a homogeneous product, free entry, and ${inline(String.raw`P = MR`)} for each seller. ${perfectComp}`,
    ),
    idea(
      'eco-structures',
      'medium',
      'Quill Software sells accounting apps that customers view as similar but not identical, and new vendors can enter. In a long-run monopolistic-competition equilibrium, the typical result is:',
      monoComp,
      'Price equal to marginal cost, because free entry removes every gap between price and marginal cost.',
      'A permanent economic profit, because product differentiation blocks all later entry.',
      `Free entry pushes long-run economic profit to zero, so ${inline(String.raw`P = ATC`)}. Downward-sloping demand still leaves ${inline(String.raw`P > MC`)}. ${monoComp}`,
    ),
    idea(
      'eco-structures',
      'hard',
      'Three national freight firms, including Lumen Rail, have privately agreed to hold a high tariff and to limit tonnage. The agreement is not enforced by a court. The instability in that arrangement is:',
      cheat,
      'No member can gain by cutting price, because oligopoly demand is perfectly elastic at the collusive price.',
      'The agreement becomes more stable as the number of members rises, because more firms make cheating easier to spot.',
      `A collusive price sits above the cheat’s own marginal cost, so one firm’s extra tonnes are profitable if the others do not match. ${cheat}`,
    ),
    idea(
      'eco-structures',
      'medium',
      'Marlowe Cement is the only permitted quarry in a valley, and imports cannot enter. For the profit-maximizing quantity and the price it posts, the firm should:',
      monopolyRule,
      'Produce where price equals marginal cost, then hope entry does not occur.',
      'Produce where average total cost is minimized, because a monopolist is forced to the efficient scale.',
      `A single seller faces the market demand curve, so marginal revenue lies below price. The quantity rule is still ${inline(String.raw`MR = MC`)}, and the price is read off demand. ${monopolyRule}`,
    ),
    idea(
      'eco-structures',
      'easy',
      'Analysts of a competitive mill sometimes treat “breaking even” and “shutting down” as the same price. For a firm with fixed costs, the distinction is:',
      breakEvenPoint,
      'Both points are the minimum of average variable cost, because fixed cost is ignored in the short run.',
      'Both points are the minimum of marginal cost, because marginal cost already includes fixed cost.',
      `Breakeven is ${inline(String.raw`P = ATC`)} and economic profit is zero. Shutdown in the short run is ${inline(String.raw`P < AVC`)}. ${breakEvenPoint}`,
    ),
    calc(
      'eco-structures',
      'hard',
      `Three glass makers have market shares of 40%, 30%, and 30%. The 40% firm then merges with one 30% firm, leaving shares of 70% and 30%. Using ${inline(String.raw`HHI=\sum s_i^2`)} with shares in percentage points, the increase in the HHI is closest to:`,
      hhiRise,
      [70 ** 2 + 30 ** 2, 40 ** 2 + 30 ** 2 + 30 ** 2],
      (value) => num(value, 0),
      (ans) =>
        `The pre-merger HHI is ${inline(String.raw`40^2+30^2+30^2=3400`)} and the post-merger HHI is ${inline(String.raw`70^2+30^2=5800`)}. The increase is ${block(String.raw`5800-3400=2400`)}. That increase is ${ans}. The level of the index, before or after, is not the change.`,
    ),
    idea(
      'eco-structures',
      'medium',
      'Bramble Utilities runs the only electric distribution network in a city. Average total cost keeps falling over the entire range of kilowatt-hours the city will buy. This cost shape is the usual reason to call the firm:',
      natural,
      'A perfectly competitive firm, because falling average cost means price equals marginal cost.',
      'A monopolistic competitor, because falling average cost requires many differentiated brands.',
      `A natural monopoly has declining average cost through the relevant demand, so splitting output across two networks raises ${inline(String.raw`ATC`)}. ${natural}`,
    ),
    idea(
      'eco-structures',
      'hard',
      'For a perfectly competitive firm that can pause production, the short-run supply curve is:',
      supplyCurve,
      'The entire average-total-cost curve, because the firm must cover fixed cost on every unit.',
      'A vertical line at the efficient scale, because competitive firms do not respond to price.',
      `The firm produces where ${inline(String.raw`P = MC`)} only if ${inline(String.raw`P \ge AVC`)}. Below that price, quantity supplied is zero. ${supplyCurve}`,
    ),
    idea(
      'eco-structures',
      'easy',
      'Across perfect competition, monopolistic competition, oligopoly, and monopoly, the quantity condition that stays the same, and the extra condition that does not, are:',
      mrMc,
      'Every structure sets price equal to marginal cost, and only monopoly sets marginal revenue equal to marginal cost.',
      'Only oligopoly sets marginal revenue equal to marginal cost, because strategic firms ignore marginal cost.',
      `Profit maximization is ${inline(String.raw`MR = MC`)} in each structure. Price and marginal revenue coincide only when demand facing the firm is horizontal. ${mrMc}`,
    ),
    idea(
      'eco-structures',
      'medium',
      'Two reports describe the same cement market. One quotes a four-firm concentration ratio. The other quotes an HHI that uses every firm’s share. A reason to prefer the HHI when the top four are very unequal is:',
      hhiVsCr,
      'The four-firm ratio squares every share, so it already penalizes inequality inside the top four.',
      'The HHI ignores the largest firm, so it is useful only in monopolistic competition.',
      `The four-firm ratio is a sum of shares. The HHI is ${inline(String.raw`\sum s_i^2`)}, so a 70/10/10/10 top four scores differently from a 25/25/25/25 top four even when both ratios equal 100. ${hhiVsCr}`,
    ),
    calc(
      'eco-structures',
      'hard',
      `Harbor Glass, still a price taker, expects to sell 1,000 cases at USD 40. Average total cost is USD 46 and average variable cost is USD 37. Using ${inline(String.raw`(ATC-P)\times Q`)}, economic loss if the firm produces is closest to:`,
      operatingLoss,
      [(46 - 37) * 1000, (40 - 37) * 1000],
      usd,
      (ans) =>
        `Producing loses the gap between average total cost and price on every case: ${block(String.raw`(46-40)\times 1000=6000`)}. The loss is ${ans}. Shutting down would instead lose fixed cost of ${inline(String.raw`(46-37)\times 1000=9000`)}, which is larger, and the USD 3 contribution margin is not a loss figure.`,
    ),
  ])
}

function cycles(): Draft[] {
  const afterTrough = 'An expansion, the phase in which output and employment are recovering from the bottom.'
  const indicatorRoles =
    'Building permits tend to lead, industrial production tends to coincide, and the unemployment rate tends to lag.'
  const creditCycle =
    'A credit crunch can deepen a downturn even after the original spending shock has faded.'
  const inventories = 'Early recovery production can exceed final sales while firms rebuild inventories.'
  const lateCycle =
    'Inflation pressure and a tight labor market often build before the peak, while unemployment is slower to turn.'
  const cyclicalFirm =
    'Lumen Rail’s freight volumes are the more cyclical of the two, because they track goods production.'
  const positiveGap = 'Actual output is above estimated potential, a setting that often adds to inflation pressure.'
  const peakMeans = 'The peak is the turning point from expansion into contraction, not the start of the recovery.'
  const inflationLags =
    'Consumer inflation can still be rising in the early months of a contraction, because prices react with a delay.'
  const onePrint =
    'One soft print is not a phase call; analysts look for a cluster of indicators that agree.'

  return exactly('eco-cycles', 10, [
    idea(
      'eco-cycles',
      'easy',
      'A business-cycle chronology marks a trough in the quarter just ended. The phase that follows a trough, if the dating is the standard four-phase sequence, is:',
      afterTrough,
      'A peak, because the trough is defined as the high point of output.',
      'A contraction, because output falls for at least a year after every trough.',
      `The usual sequence runs trough, expansion, peak, contraction. The phase after the bottom is the expansion. ${afterTrough}`,
    ),
    idea(
      'eco-cycles',
      'medium',
      'An analyst sorts three series: new building permits, an industrial production index, and the unemployment rate. In the usual classification of cyclical indicators, these three line up as:',
      indicatorRoles,
      'All three coincide with current output, because any official series is coincident by definition.',
      'Unemployment leads, industrial production lags, and permits are not cyclical.',
      `Leading series move before output, coincident series move with it, and lagging series move after. Permits are a classic lead, production a coincident read, and unemployment a lag. ${indicatorRoles}`,
    ),
    idea(
      'eco-cycles',
      'medium',
      'During a contraction, banks tighten standards and a large lender to Northline Foods’s customers calls in lines of credit. Real spending had already slowed. The extra damage from the credit tightening is an example of:',
      creditCycle,
      'A purely seasonal inventory swing, because credit standards only change with the holiday calendar.',
      'A lagging price index, because credit terms are a measure of consumer-price inflation.',
      `The credit cycle can amplify the business cycle. When lenders pull credit, spending falls further. ${creditCycle}`,
    ),
    idea(
      'eco-cycles',
      'easy',
      'Early in a recovery, Northline Foods raises factory output faster than grocery sales are rising, because warehouse stocks were run down in the recession. That pattern is:',
      inventories,
      'A sign the recovery has already ended, because production above sales is possible only at a peak.',
      'A lagging indicator of inflation, because inventory rebuilding is a price index.',
      `Inventory restocking adds a temporary gap between production and final sales at the start of an expansion. ${inventories}`,
    ),
    idea(
      'eco-cycles',
      'hard',
      'Late in a long expansion, job openings are high, wage growth has picked up, and inflation is above its recent range. Unemployment is still edging down. A careful cyclical reading is:',
      lateCycle,
      'The expansion has already ended, because unemployment cannot fall unless output is contracting.',
      'Inflation leads the labor market by several years, so rising wages are a sign of an early recovery.',
      `Labor-market tightness and inflation often show up late in the expansion. Unemployment itself usually turns only after the peak. ${lateCycle}`,
    ),
    idea(
      'eco-cycles',
      'medium',
      'Bramble Utilities sells regulated electric service to households. Lumen Rail hauls steel, grain, and finished goods. Across a typical business cycle, the more cyclical revenue stream is:',
      cyclicalFirm,
      'Bramble’s household power sales, because regulated utilities amplify every inventory cycle.',
      'Neither, because both firms sell a necessity and both revenues are noncyclical.',
      `Freight volumes move with industrial production. Household electricity is steadier. ${cyclicalFirm}`,
    ),
    idea(
      'eco-cycles',
      'easy',
      'A statistics office estimates that actual real GDP is 2% above its estimate of potential GDP. That positive output gap means:',
      positiveGap,
      'The economy is in a trough, because a positive gap is the definition of unused capacity.',
      'Fiscal policy must be expansionary, because a positive gap means demand is short of supply.',
      `The output gap is ${inline(String.raw`(Y-\bar{Y})/\bar{Y}`)}. A positive value means actual output is above potential. ${positiveGap}`,
    ),
    idea(
      'eco-cycles',
      'medium',
      'Commentators call the latest quarter a “peak” because real GDP printed its highest level of the expansion. In cycle dating, a peak is specifically:',
      peakMeans,
      'The first quarter of positive growth after a recession, also called a trough.',
      'Any quarter in which GDP is positive, whether or not the next quarter falls.',
      `A peak is a turning point. The level can be the high of the cycle, and the next phase is contraction. ${peakMeans}`,
    ),
    idea(
      'eco-cycles',
      'hard',
      'Real output has started to contract, but year-over-year consumer inflation is still climbing. A reason this combination can happen early in a downturn is:',
      inflationLags,
      'Inflation is a leading indicator, so it must turn down in the same month output turns down.',
      'A contraction is defined as falling prices, so the output decline cannot be a contraction.',
      `Prices and wages are slower to adjust than production. Inflation often lags the turn in output. ${inflationLags}`,
    ),
    idea(
      'eco-cycles',
      'medium',
      'One leading series, a weekly freight index for Lumen Rail, drops for a single week. A portfolio group is tempted to declare a recession. The more defensible use of indicators is:',
      onePrint,
      'A single leading series is decisive, because leading indicators do not give false signals.',
      'Ignore every indicator and date the cycle only from the unemployment rate, which leads output.',
      `Indicators are noisy. Phase calls rest on several series, revised data, and the distinction between leading and coincident measures. ${onePrint}`,
    ),
  ])
}

function fiscal(): Draft[] {
  const expansionary =
    'Higher government purchases or lower tax rates, aimed at raising aggregate demand.'
  const stabilizers =
    'Unemployment benefits and progressive taxes change the deficit without a new spending law.'
  const lags =
    'Recognition, legislative action, and impact lags can deliver a stimulus after the trough has passed.'
  const crowding =
    'Government borrowing can lift interest rates and displace some private investment, especially near full employment.'
  const structural =
    'A cyclical deficit shrinks as the economy recovers; a structural deficit would remain at full employment.'
  const ratioFalls =
    'The debt-to-GDP ratio can fall while debt still grows, if nominal GDP grows faster than the debt.'
  const transfers =
    'Government purchases enter GDP directly; transfers enter only to the extent recipients spend them.'
  const ricardian =
    'Some households may save a tax cut because they expect future taxes, which can dampen the demand effect.'
  const monetize =
    'Financing the deficit by central-bank money creation is more inflationary, in the extreme, than borrowing from private savers.'
  const multiplier = 1 / (1 - 0.75)

  return exactly('eco-fiscal', 10, [
    idea(
      'eco-fiscal',
      'easy',
      'A government wants to support demand during a contraction. Within ordinary fiscal policy, the expansionary tools are:',
      expansionary,
      'Higher tax rates and lower purchases, which raise private disposable income.',
      'An open-market sale of securities, which is a fiscal decision of the legislature.',
      `Fiscal expansion adds to demand through spending or through tax cuts that lift disposable income. ${expansionary}`,
    ),
    idea(
      'eco-fiscal',
      'medium',
      'A recession raises unemployment-benefit outlays and lowers tax collections under an unchanged tax code. No new statute is passed. These movements are:',
      stabilizers,
      'Discretionary stimulus, because any change in the deficit requires a fresh vote.',
      'Monetary operations, because benefit checks are a central-bank liability.',
      `Automatic stabilizers move the budget with the cycle under rules already in place. They do not wait on a new law. ${stabilizers}`,
    ),
    idea(
      'eco-fiscal',
      'hard',
      'Parliament begins designing a public-works package six months after a recession starts, argues for another nine months, and the projects hire workers only in the following year. The practical limit this illustrates is:',
      lags,
      'Automatic stabilizers, which are slow precisely because they require no legislation.',
      'Crowding out, which is the delay between recognizing a recession and publishing the data.',
      `Discretionary fiscal policy faces a recognition lag, an action lag, and an impact lag. A project-based stimulus can arrive late. ${lags}`,
    ),
    idea(
      'eco-fiscal',
      'medium',
      'The economy is already near estimated potential when the treasury issues a large bond-financed spending program. Private firms postpone Kelso Metals plant projects as yields rise. That offset is:',
      crowding,
      'A liquidity trap, which occurs when government spending lowers interest rates to zero.',
      'An automatic stabilizer, because higher yields reduce the structural deficit by definition.',
      `Crowding out is the interest-rate channel that offsets part of a fiscal expansion. It is stronger when idle resources are scarce. ${crowding}`,
    ),
    idea(
      'eco-fiscal',
      'easy',
      'A budget office separates the deficit that would remain if the economy were at potential from the extra deficit caused by a recession. The pair of labels is:',
      structural,
      'Both pieces are structural, because every deficit is independent of the cycle.',
      'Both pieces are cyclical, because the full-employment deficit moves one-for-one with unemployment.',
      `The cyclical piece is the cycle’s effect on revenue and transfers. The structural piece is what is left at potential output. ${structural}`,
    ),
    idea(
      'eco-fiscal',
      'medium',
      'Nominal government debt rises 3% in a year and nominal GDP rises 6%. For the debt-to-GDP ratio, the arithmetic implication is:',
      ratioFalls,
      'The ratio must rise, because any increase in debt raises the ratio regardless of GDP.',
      'The ratio is unchanged, because debt and GDP are the same object.',
      `The ratio is ${inline(String.raw`D/Y`)}. If ${inline(String.raw`Y`)} grows faster than ${inline(String.raw`D`)}, the ratio falls even though the debt stock is larger. ${ratioFalls}`,
    ),
    calc(
      'eco-fiscal',
      'hard',
      `Households are estimated to spend 75 cents of an extra dollar of disposable income. In the simple model where the spending multiplier is ${inline(String.raw`1/(1-MPC)`)}, the multiplier on a government-purchases increase is closest to:`,
      multiplier,
      [0.75, 1.75],
      (value) => num(value, 2),
      (ans) =>
        `With an MPC of 0.75, the simple multiplier is ${block(String.raw`1/(1-0.75)=4`)}. It equals ${ans}. The MPC itself is not the multiplier, and one plus the MPC is a different expression.`,
    ),
    idea(
      'eco-fiscal',
      'easy',
      'A finance ministry compares a USD 1 billion increase in road building with a USD 1 billion increase in cash transfers to households. On the way each item reaches measured demand:',
      transfers,
      'Both enter GDP dollar for dollar on day one, because a transfer is a government purchase of goods.',
      'Neither can affect demand, because only tax-rate changes are fiscal policy.',
      `Purchases are spending on goods and services. Transfers become demand only when someone spends them, and some of the cash is saved. ${transfers}`,
    ),
    idea(
      'eco-fiscal',
      'hard',
      'A temporary income-tax cut is expected, by some households, to be followed by higher taxes later. Those households save the cut. The demand effect of the cut is then smaller than a simple multiplier suggests. This dampener is:',
      ricardian,
      'Proof that tax cuts always reduce saving, because households spend every windfall.',
      'An open-market operation, because the tax cut is implemented by the central bank’s balance sheet.',
      `If people treat a tax cut as a loan from the future, private saving rises and the rise in consumption is muted. ${ricardian} It is a possible offset, not a reason to ignore the deficit.`,
    ),
    idea(
      'eco-fiscal',
      'medium',
      'The treasury finances a deficit by selling bills that the central bank buys and holds, expanding the monetary base. Compared with selling those bills to private savers, this financing is:',
      monetize,
      'Less inflationary, because central-bank purchases destroy the monetary base.',
      'Identical in every respect, because the holder of the bill does not change the deficit.',
      `Monetizing a deficit couples fiscal expansion with money creation. Private financing absorbs saving instead. ${monetize}`,
    ),
  ])
}

function monetary(): Draft[] {
  const purchase = 'Adds reserves and, in normal times, puts downward pressure on the policy rate.'
  const transmission =
    'From the policy rate to lending rates, asset prices, the exchange rate, spending, and then inflation.'
  const tighten =
    'Tighten policy, because inflation is above target and the output gap is positive.'
  const neutral =
    'The real policy stance that neither stimulates nor restrains demand when inflation is at target.'
  const qe = 'Buying longer-term assets to lower those yields when the policy rate is already near its floor.'
  const reservesUp = 'An increase in reserve requirements is a tightening tool, even if many central banks now rely more on the policy rate.'
  const fxChannel =
    'A higher policy rate tends to appreciate the currency, which leans against net exports and against import prices.'
  const oneTarget =
    'If money demand shifts, the bank cannot hold both the money stock and the interest rate at preset targets.'
  const inflationTarget =
    'The bank announces an inflation goal and steers policy toward it over a horizon, accepting short-run output swings.'
  const lender =
    'Emergency lending to a solvent bank is not the same decision as setting the policy rate to hit an inflation goal.'
  const easeWrong =
    'A rate cut would conflict with an inflation target while the economy is above capacity and inflation is high.'
  const fisher = 1.015 * 1.03 - 1

  return exactly('eco-monetary', 12, [
    idea(
      'eco-monetary',
      'easy',
      'The central bank buys government securities in the open market and pays the sellers by crediting bank reserves. In a corridor or floor system that is not stuck at the effective lower bound, this operation:',
      purchase,
      'Drains reserves and pushes the policy rate up, because a purchase is a sale from the banking system’s point of view.',
      'Has no effect on reserves, because open-market operations change only the fiscal deficit.',
      `An open-market purchase increases the monetary base. More reserves, in normal times, ease the policy rate. ${purchase}`,
    ),
    idea(
      'eco-monetary',
      'medium',
      'A cut in the policy rate is meant to affect inflation and output through several links, not in a single step. The usual transmission runs:',
      transmission,
      'Directly from the policy rate to potential GDP, with no effect on lending rates or the currency.',
      'Only through commercial-bank equity prices, with no path through borrowing or the exchange rate.',
      `Transmission is a chain: funding costs, credit, wealth, the exchange rate, then spending and prices. ${transmission}`,
    ),
    idea(
      'eco-monetary',
      'easy',
      'Inflation is above the announced target and the output gap is positive. Under an inflation-targeting mandate, the orthodox next step is to:',
      tighten,
      'Ease policy, because a positive output gap means demand is below potential.',
      'Fix the exchange rate and stop setting a policy rate, because targets apply only to the currency.',
      `Above-target inflation with an economy above potential calls for a higher policy rate, not a cut. ${tighten}`,
    ),
    idea(
      'eco-monetary',
      'medium',
      'Staff describe a real short-term rate that would keep inflation at target without pushing the output gap in either direction. That benchmark is:',
      neutral,
      'The zero lower bound, which is defined as the rate that maximizes inflation.',
      'The fiscal multiplier, which is a monetary-policy instrument set by the legislature.',
      `The neutral real rate is a stance benchmark. Policy below it is expansionary in real terms; policy above it is restrictive. ${neutral}`,
    ),
    calc(
      'eco-monetary',
      'hard',
      `A real risk-free rate is 1.50% and expected inflation is 3.00%. Using the exact Fisher relation ${inline(String.raw`(1+i)=(1+r)(1+\pi^e)`)}, the nominal rate is closest to:`,
      fisher,
      [0.015 + 0.03, 0.03 - 0.015],
      pct,
      (ans) =>
        `Multiply the gross real rate by the gross inflation factor: ${block(String.raw`(1.015)(1.03)-1`)}. The nominal rate is ${ans}. Adding the two percentages is the common approximation, and subtracting them is the real-minus-inflation gap, not the nominal rate.`,
    ),
    idea(
      'eco-monetary',
      'medium',
      'The policy rate is already near zero, and the central bank begins buying longer-maturity government bonds in size in order to lower those yields. This operation is:',
      qe,
      'A reserve-requirement cut, because bond purchases are implemented by changing the required-reserve ratio.',
      'A fiscal transfer, because the bonds leave the private sector’s tax bill unchanged by law.',
      `Quantitative easing extends easing along the curve when the overnight rate has little room left. ${qe}`,
    ),
    idea(
      'eco-monetary',
      'easy',
      'A central bank that still uses a required-reserve ratio raises that ratio for commercial banks. Holding other tools fixed, the direction of this change is:',
      reservesUp,
      'An easing, because banks lend more when they must hold more reserves against deposits.',
      'A fiscal tightening, because reserve requirements are a tax rate set in the budget.',
      `A higher reserve requirement immobilizes more of the banking system’s reserves and is a tightening instrument. ${reservesUp}`,
    ),
    idea(
      'eco-monetary',
      'medium',
      'The central bank lifts the policy rate while inflation abroad is unchanged. Through the exchange-rate channel, the usual pressure on the domestic currency and on net exports is:',
      fxChannel,
      'Depreciation, because a higher policy rate reduces foreign demand for domestic assets.',
      'No currency effect, because interest rates and exchange rates are set in separate markets that do not meet.',
      `Higher domestic rates attract capital and tend to appreciate the currency. A stronger currency leans against exports and import-price inflation. ${fxChannel}`,
    ),
    idea(
      'eco-monetary',
      'hard',
      'The central bank has announced both a money-supply target and an interest-rate target. Money demand then shifts because of a payments innovation. The conflict is:',
      oneTarget,
      'Both targets can still be hit, because money demand does not affect the rate or the quantity.',
      'The fiscal deficit automatically adjusts so that both targets remain feasible.',
      `The demand for money links the quantity of money and the interest rate. A shift in that demand makes one target miss if the other is held. ${oneTarget}`,
    ),
    idea(
      'eco-monetary',
      'medium',
      'A central bank publishes a 2% inflation goal, explains its forecasts, and moves the policy rate when inflation is expected to miss that goal over a two-year horizon. This regime is:',
      inflationTarget,
      'A money-supply target, because the announced number is a growth rate of currency.',
      'A fixed exchange rate, because 2% is the allowed band around the peg.',
      `Inflation targeting uses the policy rate, and often communication, to steer inflation toward a public number. Output may vary in the short run. ${inflationTarget}`,
    ),
    idea(
      'eco-monetary',
      'hard',
      'A solvent bank faces a deposit run and borrows overnight from the central bank against good collateral. Distinguishing that loan from monetary policy aimed at inflation:',
      lender,
      'They are the same tool, because every reserve credit is an open-market purchase designed to hit the inflation target.',
      'The loan is a fiscal transfer and cannot be collateralized, because central banks do not lend.',
      `Lender-of-last-resort credit addresses a liquidity run at a solvent firm. The policy rate addresses inflation and the output gap. ${lender}`,
    ),
    idea(
      'eco-monetary',
      'easy',
      'Inflation is well above target and output is above estimated potential. A proposal to cut the policy rate “to support asset prices” would, under the inflation mandate:',
      easeWrong,
      'Be required, because asset prices are the only variable in an inflation target.',
      'Be neutral, because policy-rate cuts cannot affect inflation once output is above potential.',
      `Easing into an overheating, above-target economy pushes against the mandate. ${easeWrong}`,
    ),
  ])
}

function geopolitics(): Draft[] {
  const cooperation =
    'A cooperative arrangement that reduces some uncertainty for investors who cross the border.'
  const tools =
    'Sanctions, export controls, tariffs, and expropriation can change both cash flows and the discount rate.'
  const globalShock =
    'A global energy shock is harder to diversify than a dispute that is confined to one small market.'
  const worldBank =
    'The World Bank funds long-horizon development projects; it does not adjudicate trade disputes or set a member’s policy rate.'
  const fragmentation =
    'Supply chains can split and costs can rise even when no army is mobilized, if blocs stop trading freely.'
  const domesticRisk =
    'A surprise tax or a cancelled permit is domestic political risk, distinct from a conflict between states.'
  const scenarios =
    'Scenario analysis is the practical tool, because these risks often lack a stable historical frequency.'
  const nationalize =
    'A taking of the local asset would transfer value away from foreign owners and lift required returns on similar projects.'

  return exactly('eco-geopolitics', 8, [
    idea(
      'eco-geopolitics',
      'easy',
      'Harbor Glass’s home government and a host government sign a treaty that sets a neutral forum for investment disputes. As a geopolitical setting, the treaty is best described as:',
      cooperation,
      'An act of rivalry that, by itself, bans every cross-border capital flow.',
      'A monetary-policy tool that sets the host country’s policy rate.',
      `Cooperation uses agreements and shared forums to lower some frictions. A dispute treaty is that kind of arrangement. ${cooperation}`,
    ),
    idea(
      'eco-geopolitics',
      'medium',
      'A portfolio holds Kelso Metals bonds and a Redkite Mining project in a country that is arguing with its neighbors. Channels through which geopolitics can reach those holdings include:',
      tools,
      'Only the domestic policy rate, because geopolitics cannot change taxes, trade, or ownership.',
      'Only accounting depreciation, because political actions never affect cash.',
      `States use economic tools as well as military ones. Sanctions and takings show up in expected cash flows and in risk premiums. ${tools}`,
    ),
    idea(
      'eco-geopolitics',
      'medium',
      'One risk is a licensing fight that affects a single Redkite pit. Another is a blockade that removes a large share of world fuel supply. For a diversified equity book, the distinction is:',
      globalShock,
      'The fuel blockade is easier to diversify, because global shocks cancel inside every portfolio.',
      'Both risks are fully diversifiable, because politics is always idiosyncratic.',
      `Country-specific political risk can be spread across countries. A shock that hits a global input does not. ${globalShock}`,
    ),
    idea(
      'eco-geopolitics',
      'easy',
      'A development lender, owned by many governments, finances a port and a power line in a lower-income country and is repaid over many years. Relative to the IMF and the WTO, this World Bank-style role is:',
      worldBank,
      'The same as the WTO, because development loans are trade-dispute rulings under another name.',
      'The same as a central bank, because project loans set the borrower’s overnight policy rate.',
      `Development banks fund projects and capacity. The IMF is associated with balance-of-payments support, and the WTO with trade rules. ${worldBank}`,
    ),
    idea(
      'eco-geopolitics',
      'hard',
      'Two trading blocs raise barriers on each other’s electronics, and Nimbus Components has to duplicate a plant on each side. No armed conflict occurs. The portfolio implication is:',
      fragmentation,
      'No cost change is possible, because geopolitical risk requires an armed conflict before cash flows move.',
      'Lower operating cost, because splitting a supply chain always removes tariffs.',
      `Rivalry can be economic. Duplicate plants and restricted trade raise costs without a battlefield. ${fragmentation}`,
    ),
    idea(
      'eco-geopolitics',
      'medium',
      'A host government imposes an unexpected windfall tax on Rowan Dairy’s local affiliate and threatens to revoke its water permit. There is no dispute with another country. This risk is:',
      domesticRisk,
      'An interstate war risk, because every tax is a conflict between governments.',
      'A monetary-policy surprise, because a permit is an open-market operation.',
      `Domestic political risk comes from the host’s own policy toward the firm. Interstate geopolitics involves other states. ${domesticRisk}`,
    ),
    idea(
      'eco-geopolitics',
      'hard',
      'A risk team has three stories for a shipping lane: open, tolled, or closed. Historical data do not contain a closure. A useful way to bring this into a valuation is:',
      scenarios,
      'A single probability taken from a normal distribution, because every political event has a known variance.',
      'Ignoring the lane, because risks without a long price history have a present value of zero.',
      `When frequencies are thin, coherent scenarios and stressed cash flows communicate more than a false precision. ${scenarios}`,
    ),
    idea(
      'eco-geopolitics',
      'medium',
      'The host government nationalizes Redkite Mining’s local subsidiary and pays compensation below the project’s going-concern value. For later foreign projects in that country, a likely market response is:',
      nationalize,
      'A lower required return, because nationalization removes operating risk for the remaining private owners.',
      'No change in required returns, because a taking in one project cannot affect the discount rate on another.',
      `Expropriation cuts the cash flows of the taken asset and raises the political-risk premium investors demand nearby. ${nationalize}`,
    ),
  ])
}

function trade(): Draft[] {
  const comparative =
    'Each country gains by specializing where its opportunity cost is lower, even if one country is absolutely faster at both goods.'
  const absolute =
    'Absolute advantage compares input use; it is not the rule that decides who should export which good.'
  const tariff =
    'The domestic price rises, imports fall, the government collects tariff revenue, and there is a deadweight loss.'
  const quota =
    'A quota also cuts the imported quantity, but the rent often goes to license holders rather than to the treasury as tariff revenue.'
  const blocs =
    'A free-trade area drops internal tariffs and lets each member keep its own external tariff; a customs union adds a common external tariff.'
  const diversion =
    'Trade is diverted when the bloc replaces cheaper non-member imports with higher-cost member production.'
  const smallCountry =
    'A small country cannot shift the world price, so the domestic price rises by about the full tariff.'
  const subsidy =
    'An export subsidy encourages exports and, for a small country, raises the domestic price and costs the government money.'
  const infant =
    'The costs of protection are immediate, and an open-ended shelter may never produce a competitive industry.'
  const wto =
    'The WTO is a forum for trade commitments and disputes; it does not lend official reserves the way the IMF does.'

  return exactly('eco-trade', 10, [
    idea(
      'eco-trade',
      'easy',
      'Country A uses fewer labor hours than Country B to produce both glass and grain. Country B still has a lower opportunity cost in grain. The case for B to export grain rests on:',
      comparative,
      'Absolute advantage only, so B should import both goods because A is faster at each.',
      'A rule that the larger country exports both goods, regardless of opportunity cost.',
      `Comparative advantage is about opportunity cost, not about who is absolutely more productive. ${comparative}`,
    ),
    idea(
      'eco-trade',
      'medium',
      'A briefing says Harbor Glass’s home country has an absolute advantage in bottles because it uses less energy per bottle than its trading partner. That statement, by itself, does not identify:',
      absolute,
      'Which country uses fewer inputs, because absolute advantage is silent on input use.',
      'Whether energy is an input, because absolute advantage counts only labor in every industry.',
      `Absolute advantage answers “who is more productive.” Comparative advantage answers “who gives up less of the other good.” ${absolute}`,
    ),
    idea(
      'eco-trade',
      'medium',
      'The home government puts a tariff on imported cement. Domestic producers, consumers, the treasury, and overall efficiency are affected as follows:',
      tariff,
      'The domestic price falls, imports rise, and the treasury pays the foreign exporter a subsidy.',
      'Consumers gain, producers lose, and there is no efficiency loss because a tariff only transfers income.',
      `A tariff drives a wedge between the world price and the domestic price. Producers gain, consumers lose, the treasury gains revenue, and some surplus is lost. ${tariff}`,
    ),
    idea(
      'eco-trade',
      'medium',
      'Instead of a tariff, the government limits cement imports to a fixed tonnage and gives the import licenses to a few domestic traders. Compared with a tariff that cuts imports by the same tonnage:',
      quota,
      'The treasury collects the same revenue, because a quota is collected as a tax at the border.',
      'The domestic price falls, because a quantity cap increases supply.',
      `Both tools restrict quantity and can raise the domestic price. Who captures the scarcity rent is the difference. ${quota}`,
    ),
    idea(
      'eco-trade',
      'easy',
      'Two neighbors abolish tariffs on each other’s goods but each keeps its own tariff schedule against the rest of the world. A third arrangement would also impose one common external tariff. Those two designs are:',
      blocs,
      'Both customs unions, because any internal free trade requires a common external tariff.',
      'Both monetary unions, because a trade agreement sets a single policy rate.',
      `The first design is a free-trade area. Adding a common external tariff makes it a customs union. ${blocs}`,
    ),
    idea(
      'eco-trade',
      'hard',
      'After a customs union, a member stops buying cheaper cement from a non-member and buys higher-cost cement from a partner that now faces no internal tariff. That switch is:',
      diversion,
      'Trade creation, because any rise in imports from a partner is a gain in efficiency.',
      'An export subsidy paid by the non-member, because the partner’s price is higher.',
      `Trade creation replaces higher-cost home production with lower-cost member production. Diversion replaces a lower-cost outsider with a higher-cost insider. ${diversion}`,
    ),
    idea(
      'eco-trade',
      'medium',
      'A country buys a tiny fraction of world cement, and the world price is set abroad. It imposes a tariff of USD 10 a tonne. For the domestic price of cement:',
      smallCountry,
      'The world price falls by USD 10, so the domestic price is unchanged.',
      'The domestic price falls by USD 10, because a tariff is a subsidy to foreign sellers.',
      `A small buyer does not move the world price. The tariff is added on top of that price inside the country. ${smallCountry}`,
    ),
    idea(
      'eco-trade',
      'easy',
      'The government pays Rowan Dairy a subsidy for every unit of milk powder it ships abroad. The country is small in the world market. The usual domestic effects are:',
      subsidy,
      'A lower domestic price and a budget surplus, because foreign buyers pay the subsidy.',
      'No change in exports, because a subsidy on exports reduces the incentive to export.',
      `An export subsidy pulls output toward foreign sales and, in the small-country case, lifts the home price while the budget pays the subsidy. ${subsidy}`,
    ),
    idea(
      'eco-trade',
      'hard',
      'A ministry argues for a lasting tariff so that a new Nimbus Components plant can “grow up” and later match foreign costs. A standard caution about that infant-industry case is:',
      infant,
      'Protection has no cost while it lasts, so the only risk is removing it too soon.',
      'A permanent tariff is required for comparative advantage to exist in any industry.',
      `Infant-industry protection is a possible argument, and it is easy to extend past any learning. Consumers and other industries pay meanwhile. ${infant}`,
    ),
    idea(
      'eco-trade',
      'medium',
      'A member state is accused of breaking a bound tariff commitment. The body that is built to host that argument, as distinct from the IMF or a development bank, is:',
      wto,
      'The IMF, because trade-rule disputes are settled by lending official reserves to the complainant.',
      'The World Bank, because a tariff dispute is funded as a multi-decade infrastructure loan.',
      `The WTO’s role is negotiated trade rules and a dispute process. Lending reserves is the IMF’s neighborhood, and project finance is the World Bank’s. ${wto}`,
    ),
  ])
}

function fx(): Draft[] {
  const participants =
    'Corporations hedging receipts, investors moving capital, dealers making markets, and central banks intervening.'
  const regimes =
    'A float is set in the market; a peg requires the authorities to defend a stated price with reserves or interest rates.'
  const trinity =
    'A peg, free capital flows, and an independent monetary policy cannot all be maintained together.'
  const imf =
    'The IMF lends official reserves and reviews external payments; it does not write the trade-law rulings associated with the WTO.'
  const exporter =
    'Lumen Rail receives fewer units of domestic currency for each unit of foreign revenue, holding the foreign price fixed.'
  const sterilized =
    'Sterilized intervention tries to offset the reserve change so the monetary base does not move; unsterilized intervention does not.'
  const pegBreak =
    'A peg with a persistent external deficit and falling reserves can end in a devaluation if rates are not raised enough.'
  const spotForward =
    'The spot market is for near-term delivery; the forward market sets today a price for delivery later.'
  const carry =
    'The trade earns the interest gap and loses if the high-rate currency depreciates by more than that gap.'

  return exactly('eco-fx', 9, [
    idea(
      'eco-fx',
      'easy',
      'A description of the foreign-exchange market lists firms paying suppliers, funds reallocating across countries, banks quoting two-way prices, and a central bank selling foreign currency. Those roles are:',
      participants,
      'Only the central bank, because private parties are not allowed to exchange currencies.',
      'Only exporters, because investors and dealers settle in a separate goods market.',
      `The FX market is where several motives meet: trade, investment, dealing, and official intervention. ${participants}`,
    ),
    idea(
      'eco-fx',
      'medium',
      'One currency’s price is left to trading. Another is announced as a fixed number of foreign units, and the central bank buys or sells reserves to keep it there. The two regimes are:',
      regimes,
      'Both pegs, because every market price is an announcement by the central bank.',
      'Both pure floats, because reserve sales do not affect a fixed price.',
      `Floating leaves the rate to private supply and demand. A peg is a promise the authorities must back. ${regimes}`,
    ),
    idea(
      'eco-fx',
      'hard',
      'A country wants a fixed exchange rate, wants capital to move freely, and wants to set its policy rate for domestic inflation. The constraint often called the impossible trinity says:',
      trinity,
      'All three can be hit together, because the policy rate does not affect cross-border flows.',
      'The only impossible pair is a float combined with capital controls, because pegs require free capital.',
      `Defending a peg with open capital markets means domestic rates cannot wander far from the anchor’s rates. ${trinity}`,
    ),
    idea(
      'eco-fx',
      'medium',
      'A country with a sudden external deficit draws on a pool of official resources and agrees to a published policy review. That function, as distinct from the WTO’s trade-rule work, belongs to:',
      imf,
      'The WTO, because balance-of-payments loans are tariff disputes.',
      'A commercial equity fund, because official reserves are venture-capital investments.',
      `The IMF is the institution associated with temporary external financing and surveillance of payments. ${imf}`,
    ),
    idea(
      'eco-fx',
      'easy',
      'Lumen Rail bills a foreign customer in that customer’s currency. The domestic currency then appreciates against the billing currency. Before any hedge, the effect on the domestic-currency value of the receivable is:',
      exporter,
      'More domestic currency per unit of foreign revenue, because appreciation multiplies foreign receipts.',
      'No change, because the invoice currency and the domestic currency are the same object.',
      `Appreciation means one unit of foreign currency converts into fewer domestic units. The exporter’s home-currency receipt shrinks. ${exporter}`,
    ),
    idea(
      'eco-fx',
      'medium',
      'The central bank sells foreign reserves to support the domestic currency and simultaneously drains or adds domestic liquidity so the monetary base is unchanged. That second step makes the intervention:',
      sterilized,
      'Unsterilized, because any reserve sale automatically leaves the monetary base unchanged.',
      'A capital control, because sterilization is a ban on private foreign-exchange trading.',
      `Sterilization offsets the domestic-money effect of the reserve transaction. Without that offset, the intervention is unsterilized. ${sterilized}`,
    ),
    idea(
      'eco-fx',
      'hard',
      'A pegged currency faces a long current-account deficit. Official reserves are falling, and the central bank will not raise the policy rate. A familiar ending to that path is:',
      pegBreak,
      'A permanent rise in reserves, because a deficit under a peg creates foreign currency.',
      'No pressure on the peg, because current-account deficits cannot affect reserve levels.',
      `A peg is defended with reserves or with rates. If neither is available, the announced price gives way. ${pegBreak}`,
    ),
    idea(
      'eco-fx',
      'easy',
      'A treasurer at Northline Foods can exchange currency for delivery in two days, or can lock today a rate for an exchange in six months. Those two markets are:',
      spotForward,
      'Both forward markets, because every currency trade settles in six months.',
      'Both goods markets, because foreign exchange is a tariff schedule rather than a price.',
      `Spot is the near-term price. Forward is a price agreed now for a later exchange. ${spotForward}`,
    ),
    idea(
      'eco-fx',
      'medium',
      'A fund borrows a low-interest currency and invests in a high-interest currency, leaving the exchange rate unhedged. The bet, before any move in the spot rate, is:',
      carry,
      'A guaranteed profit equal to the interest gap, because the high-rate currency cannot depreciate.',
      'A loss equal to the interest gap, because the low-rate currency always appreciates by more than the gap.',
      `Unhedged carry keeps the interest differential and takes the currency risk. Depreciation of the high-rate currency can erase the interest gain. ${carry}`,
    ),
  ])
}

function fxcalc(): Draft[] {
  const cadFwd = math.cipForward(1.36, 0.04, 0.03, 1)
  const cadSwap = math.cipForward(1.36, 0.03, 0.04, 1)
  const jpyFwd = math.cipForward(110.5, 0.015, 0.035, 2)
  const jpyOne = math.cipForward(110.5, 0.015, 0.035, 1)
  const jpySwap = math.cipForward(110.5, 0.035, 0.015, 2)
  const eurMove = (1.18 - 1.25) / 1.25
  const eurFlip = (1.25 - 1.18) / 1.18
  const eurBase = (1.18 - 1.25) / 1.18
  const inv0 = 1 / 1.25
  const inv1 = 1 / 1.18
  const invMove = (inv1 - inv0) / inv0
  const cross = 148.2 / 1.5
  const premium = (cadFwd - 1.36) / 1.36
  const gbpMove = (0.75 - 0.78) / 0.78
  const jpyPerUsd = 160 * 0.92
  const usdFwd = math.cipForward(1.25, 0.02, 0.05, 1)
  const usdSwap = math.cipForward(1.25, 0.05, 0.02, 1)
  const points = usdFwd - 1.25
  const sellForward =
    'Sell the USD forward against the CAD, because the market CAD-per-USD forward is above the covered-interest forward.'

  return exactly('eco-fxcalc', 12, [
    calc(
      'eco-fxcalc',
      'easy',
      `The spot rate is quoted as CAD per USD, so the CAD is the price currency and the USD is the base currency. Spot is 1.3600. The Canadian risk-free rate is 4% and the US risk-free rate is 3%. Using ${inline(String.raw`F=S(1+r_{CAD})/(1+r_{USD})`)}, the one-year forward in CAD per USD is closest to:`,
      cadFwd,
      [cadSwap, 1.36],
      (value) => num(value, 4),
      (ans) =>
        `Covered-interest parity prices the base currency forward from the price-currency rate in the numerator: ${block(String.raw`F=1.3600\times\frac{1.04}{1.03}`)}. The forward is ${ans}. Swapping the two interest rates, or leaving the spot unchanged, breaks that relation.`,
    ),
    calc(
      'eco-fxcalc',
      'medium',
      `The spot rate is 110.50 JPY per EUR. The JPY is the price currency and the EUR is the base currency. The Japanese risk-free rate is 1.5% and the euro risk-free rate is 3.5%. Using ${inline(String.raw`F=S[(1+r_{JPY})/(1+r_{EUR})]^2`)}, the two-year forward in JPY per EUR is closest to:`,
      jpyFwd,
      [jpyOne, jpySwap],
      (value) => num(value, 2),
      (ans) =>
        `The higher euro rate compounds in the denominator for two years: ${block(String.raw`F=110.50\times(1.015/1.035)^2`)}. The forward is ${ans}. A one-year power, or swapping which rate is in the numerator, is a different contract.`,
    ),
    calc(
      'eco-fxcalc',
      'easy',
      `The exchange rate is quoted as USD per EUR, so the euro is the base currency. It moves from 1.25 to 1.18. Using ${inline(String.raw`(S_1-S_0)/S_0`)}, the percentage change in the euro is closest to:`,
      eurMove,
      [eurFlip, eurBase],
      pct,
      (ans) =>
        `With the euro as the base, the percentage change uses the USD-per-EUR quotes: ${block(String.raw`(1.18-1.25)/1.25=-0.056`)}. The euro’s change is ${ans}. Dividing by the new quote, or flipping the sign without inverting the quote, describes a different object.`,
    ),
    calc(
      'eco-fxcalc',
      'medium',
      `Start from the same USD-per-EUR move, from 1.25 to 1.18. Invert both quotes so the new quote is EUR per USD. Using ${inline(String.raw`(S_1-S_0)/S_0`)} on those inverted quotes, the percentage change in the USD is closest to:`,
      invMove,
      [0.056, -0.056],
      pct,
      (ans) =>
        `The EUR-per-USD quotes are ${inline(String.raw`1/1.25`)} and ${inline(String.raw`1/1.18`)}. Their percentage change is ${block(String.raw`(1/1.18-1/1.25)/(1/1.25)`)} and equals ${ans}. The euro’s −5.60% move is not the USD’s move with the sign flipped, because the reciprocal of a percentage change is not that simple.`,
    ),
    calc(
      'eco-fxcalc',
      'medium',
      `The JPY-per-USD quote is 148.20 and the AUD-per-USD quote is 1.50. Both quotes use the USD as the base currency. The cross rate in JPY per AUD, ${inline(String.raw`(JPY/USD)/(AUD/USD)`)}, is closest to:`,
      cross,
      [148.2 * 1.5, 148.2],
      (value) => num(value, 2),
      (ans) =>
        `Divide the two “per USD” quotes to cancel the USD: ${block(String.raw`148.20/1.50=98.80`)}. The JPY-per-AUD rate is ${ans}. Multiplying the quotes, or stopping at the JPY-per-USD quote, does not express yen per Australian dollar.`,
    ),
    calc(
      'eco-fxcalc',
      'easy',
      `A spot rate is quoted as 1.2500 USD per EUR. The reciprocal quote, in EUR per USD, is ${inline(String.raw`1/S`)}. That EUR-per-USD quote is closest to:`,
      1 / 1.25,
      [1.25, 0.25],
      (value) => num(value, 4),
      (ans) =>
        `Invert the quote to change which currency is the base: ${block(String.raw`1/1.2500=0.8000`)}. The EUR-per-USD quote is ${ans}. The original 1.2500 is USD per EUR, and 0.2500 is not the reciprocal.`,
    ),
    calc(
      'eco-fxcalc',
      'medium',
      `Using the one-year CAD-per-USD case (spot 1.3600, Canadian rate 4%, US rate 3%), the forward premium on the USD is ${inline(String.raw`(F-S)/S`)}. That premium is closest to:`,
      premium,
      [0.01, 0.04],
      pct,
      (ans) =>
        `The covered-interest forward is about 1.3732 CAD per USD. The premium is ${block(String.raw`(F-1.3600)/1.3600`)} and equals ${ans}. A raw 1% rate gap, or the 4% Canadian rate, is not that percentage premium on the spot.`,
    ),
    idea(
      'eco-fxcalc',
      'hard',
      'The spot rate is 1.3600 CAD per USD. Covered-interest parity with a 4% Canadian rate and a 3% US rate gives a one-year forward near 1.3732. A dealer quotes a one-year forward of 1.4000 CAD per USD. The no-arbitrage direction in the forward is:',
      sellForward,
      'Buy the USD forward against the CAD, because a forward above the spot means the base currency is cheap.',
      'Do nothing, because a market forward is not comparable to a forward built from interest rates.',
      `The CIP forward is ${inline(String.raw`1.3600\times 1.04/1.03\approx 1.3732`)}. A market forward of 1.4000 prices the USD richer than that. ${sellForward}`,
    ),
    calc(
      'eco-fxcalc',
      'easy',
      `The quote is GBP per USD, so the USD is the base currency. It moves from 0.78 to 0.75. Using ${inline(String.raw`(S_1-S_0)/S_0`)}, the percentage change in the USD is closest to:`,
      gbpMove,
      [(0.78 - 0.75) / 0.75, (0.75 - 0.78) / 0.75],
      pct,
      (ans) =>
        `The base currency’s percentage change divides by the starting quote: ${block(String.raw`(0.75-0.78)/0.78`)}. The USD’s change is ${ans}. Using 0.75 as the denominator changes the percentage, whether the sign is kept or flipped.`,
    ),
    calc(
      'eco-fxcalc',
      'hard',
      `One quote is 0.92 EUR per USD. Another is 160 JPY per EUR. The USD is the base in the first quote and the EUR is the base in the second. The cross rate in JPY per USD, ${inline(String.raw`(JPY/EUR)\times(EUR/USD)`)}, is closest to:`,
      jpyPerUsd,
      [160 / 0.92, 160],
      (value) => num(value, 2),
      (ans) =>
        `Multiply along the chain so the euro cancels: ${block(String.raw`160\times 0.92=147.20`)}. The JPY-per-USD rate is ${ans}. Dividing 160 by 0.92 inverts the euro-per-dollar quote, and 160 is yen per euro rather than yen per dollar.`,
    ),
    calc(
      'eco-fxcalc',
      'medium',
      `The spot rate is 1.2500 USD per EUR. The USD is the price currency and the EUR is the base currency. The US risk-free rate is 2% and the euro risk-free rate is 5%. Using ${inline(String.raw`F=S(1+r_{USD})/(1+r_{EUR})`)}, the one-year forward in USD per EUR is closest to:`,
      usdFwd,
      [usdSwap, 1.25],
      (value) => num(value, 4),
      (ans) =>
        `The higher euro rate pulls the forward below the spot: ${block(String.raw`F=1.2500\times 1.02/1.05`)}. The forward is ${ans}. Putting the euro rate in the numerator, or ignoring both rates, prices a different forward.`,
    ),
    calc(
      'eco-fxcalc',
      'hard',
      `For that same USD-per-EUR pair (spot 1.2500, US rate 2%, euro rate 5%), the one-year forward points measured as ${inline(String.raw`F-S`)} in USD per EUR are closest to:`,
      points,
      [-points, -0.03],
      (value) => num(value, 4),
      (ans) =>
        `The forward is about 1.2143, so the points are ${block(String.raw`1.2143-1.2500`)}. They equal ${ans}. The opposite sign would be a premium, and a raw −3 percentage-point rate gap is not the difference in the exchange rate.`,
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
    if (/\b(all|none) of the above\b/i.test(draft.stem)) throw new Error(`Banned stem ${draft.losId}`)
  }
  if (counts.easy !== easy || counts.medium !== medium || counts.hard !== hard) {
    throw new Error(`Difficulty mix ${counts.easy}/${counts.medium}/${counts.hard}, expected ${easy}/${medium}/${hard}`)
  }
}

export function buildEconomics(): Draft[] {
  const drafts = [
    ...structures(),
    ...cycles(),
    ...fiscal(),
    ...monetary(),
    ...geopolitics(),
    ...trade(),
    ...fx(),
    ...fxcalc(),
  ]
  assertBank(drafts, 26, 38, 21)
  return drafts
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const drafts = buildEconomics()
  finalizeTopic('economics', drafts)
  console.log('ok', drafts.length)
}
