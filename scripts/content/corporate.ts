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
  return numeric({ topicId: 'corporate', losId, difficulty, stem, correct, wrong, format, explain })
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
  return q('corporate', losId, difficulty, stem, correct, wrong1, wrong2, explanation)
}

function org(): Draft[] {
  const sole =
    'The owner has unlimited personal liability, and the profit is taxed on the owner’s own return.'
  const corp =
    'The company is a separate legal person, and an owner’s loss is limited to the capital invested.'
  const partnership =
    'Every general partner can bind the firm and has unlimited liability; a limited partner’s liability is capped if that partner does not run the business.'
  const publicPrivate =
    'The public company has a wider resale market and heavier disclosure; the private company has the opposite tradeoff.'
  const classicalTax =
    'Profit can be taxed at the company and taxed again when a dividend is paid to the owner.'
  const separation =
    'A widely held public corporation, because the people who own it and the people who run it are not the same.'
  const stayPrivate =
    'It skips public-market disclosure and quarterly pressure, and it gives up a deep market for reselling the shares.'
  const fundLp =
    'The general partner manages and bears unlimited liability; limited partners supply capital and are limited to that capital if they stay out of control.'

  return exactly('ci-org', 8, [
    idea(
      'ci-org',
      'easy',
      'Rowan Dairy is owned by one person, who signs the feed contracts personally and reports the dairy’s profit on a personal tax return. There is no separate legal entity. This form is best described as:',
      sole,
      'A corporation, because a single owner always receives limited liability.',
      'A limited partnership, because the owner is a limited partner in a one-person fund.',
      `A sole proprietorship does not separate the owner from the business. Creditors can reach personal assets, and there is no entity-level tax. ${sole}`,
    ),
    idea(
      'ci-org',
      'easy',
      'Harbor Glass incorporates, issues shares, and tells new investors that the firm’s unpaid trade bills cannot be collected from the investors’ houses. The feature being described is:',
      corp,
      'Unlimited liability, because incorporation makes each shareholder jointly liable for corporate debts.',
      'Pass-through taxation with no separate legal person, because a corporation is only a contract among partners.',
      `Incorporation creates a legal person distinct from its owners. That separation is what caps owner liability. ${corp}`,
    ),
    idea(
      'ci-org',
      'medium',
      'Two founders run a design studio as general partners. A relative contributes cash, takes no part in client work, and is promised that losses will not exceed that cash. The liability split is:',
      partnership,
      'All three have limited liability, because any partnership caps every partner’s loss at the capital contributed.',
      'Only the relative has unlimited liability, because silent capital is the residual claimant.',
      `General partners manage and are fully liable. Limited partners trade control for a liability cap. ${partnership}`,
    ),
    idea(
      'ci-org',
      'medium',
      'Quill Software can stay owned by three funds, or it can list and let the public trade its shares. Comparing public and private ownership, the listing would bring:',
      publicPrivate,
      'Less disclosure and a thinner resale market, because public companies report only to the board.',
      'The same disclosure and the same liquidity, because ownership form does not change either one.',
      `Public ownership buys a secondary market and pays for it with reporting, listing rules, and a wider set of owners. ${publicPrivate}`,
    ),
    idea(
      'ci-org',
      'hard',
      'Harbor Glass pays corporate income tax on its profit and then pays a dividend that is taxed again in the shareholder’s hands. A partnership next door is taxed only on the partners’ returns. The corporate pattern is:',
      classicalTax,
      'Pass-through taxation, because a dividend is deductible at the company and untaxed to the owner.',
      'A tax that applies only to sole proprietors, because corporations are exempt from tax on profit.',
      `A classical system taxes the entity and can tax the distribution. A partnership generally puts the profit on the owners once. ${classicalTax}`,
    ),
    idea(
      'ci-org',
      'medium',
      'An examiner asks which organizational setting most clearly separates the people who supply equity from the people who make daily decisions. The clearest case is:',
      separation,
      'A sole proprietorship, because the owner hires a separate legal person to sign every contract.',
      'A general partnership in which the only two partners do all the work themselves.',
      `Separation of ownership and control is the gap between outside shareholders and hired managers. It is widest when ownership is dispersed. ${separation}`,
    ),
    idea(
      'ci-org',
      'easy',
      'The founders of Finch Analytics refuse a listing. They want to choose what to publish and they do not want a daily share price. The ownership consequence they are accepting is:',
      stayPrivate,
      'Limited liability disappears, because only listed companies can incorporate.',
      'They must redeem every share on demand at book value, because private shares are deposits.',
      `Private ownership keeps information and timing closer to the founders. The cost is that a seller has fewer buyers. ${stayPrivate}`,
    ),
    idea(
      'ci-org',
      'hard',
      'Piper Street Capital raises a fund as a limited partnership. Outside pensions supply most of the money and do not pick the investments. One management company acts as general partner. The roles are:',
      fundLp,
      'The pensions are general partners because they supplied the most money, and the manager’s liability is capped.',
      'Every partner has identical liability and identical authority, because a fund cannot use two classes of partner.',
      `Private-capital funds often put control and unlimited liability on the general partner and a liability cap on the capital partners. ${fundLp}`,
    ),
  ])
}

function stakeholders(): Draft[] {
  const residual = 'Shareholders are paid from what remains after employees, suppliers, and debtholders have been met.'
  const assetSub =
    'Shareholders of a leveraged firm may prefer a riskier project; lenders prefer the safer one.'
  const beyond = 'Employees, customers, suppliers, and the local community can be stakeholders without owning a share.'
  const cleanup = 'A cleanup obligation can become a credit issue for lenders, not only a reputation issue for owners.'
  const covenants = 'A coverage floor or a limit on extra secured debt is a contractual protection for lenders.'
  const overhang =
    'Equity may turn down a positive-NPV project when most of the value would go to creditors.'
  const payableFight =
    'A supplier wants to be paid on time; a shareholder may prefer to hold the cash longer.'
  const esgCash = 'ESG items matter in underwriting when they change expected cash flows or the risk of those cash flows.'
  const permit = 'Losing the permit can wipe out equity value even if the product was profitable before the shutdown.'
  const mandate =
    'Whose interests the board must weigh is a governance choice; listing every group in a motto does not remove the conflicts.'

  return exactly('ci-stakeholders', 10, [
    idea(
      'ci-stakeholders',
      'easy',
      'Kelso Metals is wound down. Wages, supplier invoices, and bond principal are paid before anything is left for common shareholders. That order reflects the idea that:',
      residual,
      'Shareholders are paid first, because equity is a senior claim on the estate.',
      'Employees and bondholders share one residual claim that ranks behind the common dividend.',
      `Equity is the residual claim. Contractual claims sit ahead of it in a wind-down. ${residual}`,
    ),
    idea(
      'ci-stakeholders',
      'medium',
      'Harbor Glass is financed with a large bond issue. Management can spend the cash on a volatile new furnace or on a steadier repair. The conflict between owners and lenders is:',
      assetSub,
      'Lenders prefer the volatile furnace, because bondholders capture the upside and none of the downside.',
      'There is no conflict, because both groups are paid the same contractual residual.',
      `Once debt is in place, upside accrues more to equity and downside hits lenders harder. That is the asset-substitution tension. ${assetSub}`,
    ),
    idea(
      'ci-stakeholders',
      'easy',
      'A briefing on Northline Foods lists the union, grocery customers, wheat growers, and the town where the mill sits, none of whom own shares. They are still:',
      beyond,
      'Shareholders, because anyone affected by the firm automatically holds a voting share.',
      'Irrelevant to the firm, because only parties with a ticker symbol have a stake.',
      `Stakeholder is wider than shareholder. People who depend on the firm’s operations have a stake in how it is run. ${beyond}`,
    ),
    idea(
      'ci-stakeholders',
      'medium',
      'Kelso Metals discloses a probable river cleanup that will consume cash for a decade. A lender reviewing the bonds should treat that disclosure as:',
      cleanup,
      'Irrelevant to credit, because environmental costs never reduce cash available for interest.',
      'A gain for bondholders, because a cleanup liability raises the residual value of equity.',
      `A cash obligation competes with debt service. Environmental exposure is a credit fact when it is large enough to matter. ${cleanup}`,
    ),
    idea(
      'ci-stakeholders',
      'medium',
      'The indenture on a Bramble Utilities bond forbids new secured borrowing above a stated amount and requires interest coverage to stay above a floor. Those clauses exist to:',
      covenants,
      'Give common shareholders a larger vote than the bond contract allows.',
      'Remove the firm’s duty to pay interest whenever coverage is high.',
      `Covenants are how lenders limit later actions that would weaken their claim. ${covenants}`,
    ),
    idea(
      'ci-stakeholders',
      'hard',
      'A distressed division of Lumen Rail can fund a repair that has a positive NPV. Almost all of the value would lift the recovery of existing lenders, not the equity. Equity holders decline the repair. This is:',
      overhang,
      'Asset substitution, because the equity holders chose the riskier of two positive-NPV projects.',
      'A covenant breach, because declining a project automatically violates an interest-coverage floor.',
      `Debt overhang is underinvestment: equity will not contribute new money when the benefit accrues mainly to creditors. ${overhang}`,
    ),
    idea(
      'ci-stakeholders',
      'medium',
      'Northline Foods’s treasurer wants to pay wheat invoices on day 60 instead of day 30. A long-time grower wants day 30. The disagreement is a stakeholder conflict over:',
      payableFight,
      'Who has the residual claim in liquidation, which is settled by the payment date on grain.',
      'The corporate tax rate, because a later payment changes the statutory tax rate.',
      `Stretching payables keeps cash in the firm and shifts financing onto the supplier. The two sides do not share the same horizon. ${payableFight}`,
    ),
    idea(
      'ci-stakeholders',
      'easy',
      'An investor in Quill Software asks how a data-privacy fine and a high staff-turnover rate should enter the valuation. The relevant path is:',
      esgCash,
      'They are excluded from valuation, because non-financial items cannot change cash or risk.',
      'They replace the discount rate with a letter grade and drop the cash-flow forecast.',
      `Environmental, social, and governance facts are underwritten when they move cash flows or the risk attached to them. ${esgCash}`,
    ),
    idea(
      'ci-stakeholders',
      'hard',
      'The town withdraws Rowan Dairy’s permit to run the mill after a dispute over water use. Product margins had been healthy. For the equity value of that mill:',
      permit,
      'Nothing changes, because a permit is not a cash-flow input once margins are positive.',
      'The value rises, because losing a permit removes operating costs.',
      `A social license can be a binding constraint. If the mill cannot operate, the margin on a closed plant is zero. ${permit}`,
    ),
    idea(
      'ci-stakeholders',
      'medium',
      'Harbor Glass’s charter says the board serves shareholders. A later policy memo says the board also weighs employees and the town. The analytical point is:',
      mandate,
      'The memo ends every conflict, because naming a stakeholder removes that stakeholder’s competing claim.',
      'The charter is illegal whenever a firm has employees, because only stakeholder firms may incorporate.',
      `Shareholder and broader stakeholder mandates tell the board whose tradeoffs count. They do not make the tradeoffs disappear. ${mandate}`,
    ),
  ])
}

function governance(): Draft[] {
  const agent = 'Managers may pursue pay, size, or a quiet life rather than the value of the owners’ claim.'
  const board = 'Directors who are not executives are a mechanism for overseeing the people who run the firm.'
  const dual = 'Insiders can keep voting control with a minority of the cash-flow rights, so outside holders bear more of the economic risk than the votes.'
  const pay = 'Equity that vests over several years ties pay to long-run value more tightly than a fixed salary alone.'
  const related = 'Buying services from the CEO’s family company needs disclosure and an independent look, because the price may not be arm’s length.'
  const stagger = 'A staggered board slows a change of control, which can entrench a weak team as well as protect a long plan.'
  const audit = 'The audit committee oversees reporting and the external auditor; it does not replace management’s duty to keep the books.'
  const votes = 'Voting, selling, and, where the charter allows, proposing resolutions are the main formal tools of shareholders.'
  const empire = 'Buying revenue that destroys value is an agency cost, and a board that insists on NPV discipline pushes back.'
  const costOfCapital = 'Investors who fear diverted cash demand higher returns, so weak governance can raise the cost of equity and debt.'
  const distress = 'Near distress, the shareholder-creditor conflict can matter more than the manager-shareholder conflict.'
  const clawback = 'Clawbacks and say-on-pay are aimed at compensation, not at the firm’s product market.'

  return exactly('ci-governance', 12, [
    idea(
      'ci-governance',
      'easy',
      'Hired managers at Quill Software control the daily decisions, and the shareholders who own the firm do not. The principal-agent problem in that gap is:',
      agent,
      'Shareholders are the agents and managers are the principals, because managers supply the capital.',
      'There is no agency problem in a corporation, because a board removes every difference in incentives.',
      `Owners are the principals and managers are the agents. Their incentives are not automatically the same. ${agent}`,
    ),
    idea(
      'ci-governance',
      'medium',
      'Harbor Glass puts several directors on the board who are not employees and who do not sell services to the firm. The governance role of that group is:',
      board,
      'To manage the plants day to day, because independent directors replace the CEO.',
      'To guarantee a higher share price, because independence is a valuation model.',
      `An independent board is one mechanism that watches management on behalf of owners. It is oversight, not a promise about the stock. ${board}`,
    ),
    idea(
      'ci-governance',
      'medium',
      'The founders of Finch Analytics hold super-voting shares. Public investors own most of the economics and a minority of the votes. The governance effect is:',
      dual,
      'Public investors control every ordinary vote, because cash-flow rights and votes are always equal.',
      'Super-voting shares remove agency conflicts, because founders cannot outvote the public float.',
      `Dual-class structures separate control from economic exposure. Outside owners can be stuck with a strategy they cannot outvote. ${dual}`,
    ),
    idea(
      'ci-governance',
      'easy',
      'Two pay designs are on the table for the CEO of Lumen Rail: a fixed salary, or a smaller salary plus shares that vest over four years. The stronger alignment with long-run owner value is:',
      pay,
      'The fixed salary, because a salary that does not move with results removes the incentive to take risk.',
      'Neither, because compensation cannot affect managerial choices.',
      `Variable equity makes the manager’s wealth move with the owners’ wealth, with a delay that discourages a one-quarter spike. ${pay} It can also encourage extra risk, which is a separate design problem.`,
    ),
    idea(
      'ci-governance',
      'medium',
      'Kelso Metals hires a trucking firm owned by the CEO’s sibling at a rate above the quotes from two unrelated haulers. The governance concern is:',
      related,
      'There is no concern, because a related-party contract is arm’s length by definition.',
      'Only a tax issue, because the price of a related-party service cannot affect minority shareholders.',
      `Related-party deals can move value out of the company. Disclosure and a review by directors who do not benefit are the usual checks. ${related}`,
    ),
    idea(
      'ci-governance',
      'hard',
      'Only one third of Bramble Utilities’ board stands for election each year. A dissident holder cannot replace a majority of seats in a single meeting. The risk in that design is:',
      stagger,
      'It forces every director to resign annually, which makes a change of control too easy.',
      'It gives bondholders the votes, because a staggered board is a creditor committee.',
      `Staggered terms are a takeover defense. The benefit claimed is continuity; the cost is entrenchment. ${stagger}`,
    ),
    idea(
      'ci-governance',
      'medium',
      'The board of Orchard Paper has a committee that hires the external auditor and reviews the integrity of the financial statements. That committee:',
      audit,
      'Prepares the journal entries, because the audit committee is a substitute for the controller.',
      'Sets the dividend, because audit oversight is a capital-structure decision.',
      `Oversight of reporting is not the same job as keeping the books. Management accounts; the committee watches. ${audit}`,
    ),
    idea(
      'ci-governance',
      'easy',
      'A minority shareholder in a public Harbor Glass cannot fire the CEO directly. The formal levers that shareholder still has are:',
      votes,
      'The right to seize plant assets whenever a quarter is missed.',
      'A guaranteed board seat, because every share comes with a directorship.',
      `Shareholders act mainly by voting, by selling, and by using whatever proposal rights the charter and law allow. ${votes}`,
    ),
    idea(
      'ci-governance',
      'hard',
      'The CEO of Sable Logistics prefers an acquisition that doubles revenue and the CEO’s pay even though the price implies a negative NPV. The failure mode is:',
      empire,
      'Debt overhang, because the acquisition is turned down despite a positive NPV.',
      'A creditor covenant, because empire building is a restriction written into bond indentures to protect managers.',
      `Empire building spends owners’ capital on size. Requiring a positive NPV at the opportunity cost of capital is the counterweight. ${empire}`,
    ),
    idea(
      'ci-governance',
      'medium',
      'Two otherwise similar private firms seek equity. One has an independent board, audited statements, and related-party rules. The other has none of those. Investors are likely to:',
      costOfCapital,
      'Accept a lower return from the weaker firm, because missing controls reduce the risk of diverted cash.',
      'Ignore governance, because the cost of capital depends only on the product market.',
      `Governance is part of the risk that cash will not reach investors. Weaker controls are compensated with a higher required return. ${costOfCapital}`,
    ),
    idea(
      'ci-governance',
      'hard',
      'Lumen Rail is close to breaking a coverage covenant. Equity holders want a high-variance bet; lenders want assets preserved. Relative to ordinary manager-owner friction, this moment features:',
      distress,
      'No additional conflict, because leverage removes disagreements between claimholders.',
      'A conflict only about board independence, because distress does not change project choice.',
      `Distress makes the option-like nature of equity more important. Managers who side with equity may gamble with creditors’ recovery. ${distress}`,
    ),
    idea(
      'ci-governance',
      'medium',
      'After a restatement, Harbor Glass adds a rule that unvested pay can be reclaimed if results were misstated, and shareholders get an advisory vote on pay. Those tools are:',
      clawback,
      'Product-market strategies, because say-on-pay sets the price of glass.',
      'A replacement for limited liability, because a clawback makes shareholders liable for corporate debts.',
      `Pay design is a governance mechanism. Reclaiming unearned awards and letting owners vote on pay both aim at the manager-owner gap. ${clawback}`,
    ),
  ])
}

function workingCapital(): Draft[] {
  const dio = math.dayCount(480, 3200)
  const dso = math.dayCount(270, 4100)
  const dpo = math.dayCount(210, 3200)
  const cycle = math.cashConversionCycle(dio, dso, dpo)
  const negativeCycle = math.cashConversionCycle(20, 15, 50)
  const tradeCredit = (1 + 0.02 / 0.98) ** (365 / 20) - 1
  const stretch =
    'It conserves cash and can raise supplier prices, tighten credit, or delay shipments.'
  const restrictive =
    'Less inventory and cash, which can lift return on assets and also raises the risk of a stockout or a missed payment.'
  const relaxed =
    'More current assets, which costs financing and storage and reduces the chance of a missed sale.'
  const operatingDef =
    'The operating cycle is days inventory plus days receivable and does not subtract days payable.'
  const collect =
    'Collecting sooner cuts days receivable and the cash conversion cycle, at the cost of some discount or some lost sales.'
  const seasonal =
    'Financing the holiday peak with short-term debt matches the need’s life and must be rolled; financing it with equity is more permanent and usually costlier.'
  const line =
    'A committed line is a liquidity reserve that costs a fee and comes with covenants; it is not free cash.'
  const levers =
    'Collect receivables sooner and pay suppliers later, while inventory days stay the same.'

  return exactly('ci-wc', 14, [
    calc(
      'ci-wc',
      'medium',
      `Northline Foods holds inventory of USD 480. Annual cost of goods sold is USD 3,200. The firm uses a 365-day year. Using ${inline(String.raw`Days=Inventory/COGS\times 365`)}, days inventory on hand is closest to:`,
      dio,
      [480 / 3200, 3200 / 480],
      (value) => num(value, 2),
      (ans) =>
        `Days inventory scales the stock by the daily cost of goods: ${block(String.raw`480/3200\times 365`)}. The result is ${ans} days. The ratio 480/3200 is a fraction of a year, not a day count, and COGS divided by inventory is a turnover, not a day count.`,
    ),
    calc(
      'ci-wc',
      'medium',
      `The same Northline Foods file shows receivables of USD 270, credit sales of USD 4,100, and cost of goods sold of USD 3,200. Using a 365-day year and ${inline(String.raw`Days=Receivables/Sales\times 365`)}, days sales outstanding is closest to:`,
      dso,
      [math.dayCount(270, 3200), (270 / 4100) * 360],
      (value) => num(value, 2),
      (ans) =>
        `Receivable days use credit sales, not cost of goods sold: ${block(String.raw`270/4100\times 365`)}. The result is ${ans} days. Substituting COGS, or using a 360-day year, changes the count the firm did not ask for.`,
    ),
    calc(
      'ci-wc',
      'medium',
      `Northline Foods has payables of USD 210. Cost of goods sold, used as the purchases proxy, is USD 3,200, and sales are USD 4,100. Using a 365-day year and ${inline(String.raw`Days=Payables/COGS\times 365`)}, days payable is closest to:`,
      dpo,
      [math.dayCount(210, 4100), 3200 / 210],
      (value) => num(value, 2),
      (ans) =>
        `Payable days divide the payable by the purchase flow: ${block(String.raw`210/3200\times 365`)}. The result is ${ans} days. Sales are the wrong flow for this count, and COGS divided by payables is a turnover.`,
    ),
    calc(
      'ci-wc',
      'hard',
      `Using those Northline Foods counts — inventory days from USD 480 of inventory and USD 3,200 of COGS, receivable days from USD 270 of receivables and USD 4,100 of sales, and payable days from USD 210 of payables and USD 3,200 of COGS, all on a 365-day year — the cash conversion cycle ${inline(String.raw`CCC=DIO+DSO-DPO`)} is closest to:`,
      cycle,
      [dio + dso + dpo, dio + dso],
      (value) => num(value, 2),
      (ans) =>
        `The cycle adds the time inventory and receivables are outstanding and subtracts the time suppliers finance the firm: ${block(String.raw`CCC=DIO+DSO-DPO`)}. It equals ${ans} days. Adding payables, or stopping at the operating cycle, overstates the cash tied up.`,
    ),
    idea(
      'ci-wc',
      'easy',
      'A treasurer computes days inventory and days receivable and stops. A colleague subtracts days payable. The first figure, before payables are subtracted, is:',
      operatingDef,
      'The cash conversion cycle, because payables are already inside days receivable.',
      'The current ratio, because days inventory plus days receivable equals current assets over current liabilities.',
      `Operating cycle ${inline(String.raw`= DIO + DSO`)}. The cash conversion cycle goes one step further and subtracts ${inline(String.raw`DPO`)}. ${operatingDef}`,
    ),
    idea(
      'ci-wc',
      'medium',
      'Kelso Metals begins paying suppliers on day 75 instead of day 30. Cash rises. A risk the treasurer still has to price is:',
      stretch,
      'The cash conversion cycle lengthens, because paying later increases days payable in the subtraction.',
      'There is no commercial cost, because suppliers cannot change price or service when they are paid later.',
      `A longer payable period shortens ${inline(String.raw`CCC=DIO+DSO-DPO`)}. The cash is not free if vendors respond. ${stretch}`,
    ),
    idea(
      'ci-wc',
      'easy',
      'Ibis Apparel keeps bare inventory and a small cash balance, and it chases collections aggressively. Relative to a looser policy, this restrictive net-working-capital stance:',
      restrictive,
      'Eliminates liquidity risk, because lower current assets cannot cause a stockout.',
      'Always lowers return on assets, because less inventory reduces sales one for one and never frees capital.',
      `Restrictive working capital frees capital and accepts more operating interruptions. ${restrictive}`,
    ),
    idea(
      'ci-wc',
      'medium',
      'Hearth Hotels keeps extra linens, a larger cash buffer, and longer customer terms than a peer. The relaxed policy’s tradeoff is:',
      relaxed,
      'Lower financing cost and a higher chance of stockouts, because extra current assets reduce both.',
      'A shorter cash conversion cycle by definition, because more inventory reduces days inventory.',
      `Slack current assets buy fewer missed sales and cost carry. Days inventory usually rise, which lengthens the cycle. ${relaxed}`,
    ),
    calc(
      'ci-wc',
      'hard',
      `Orchard Paper is offered terms of 2/10 net 30. The firm can pay on day 10 and take the 2% discount, or pay the full invoice on day 30. Using a 365-day year and ${inline(String.raw`(1+0.02/0.98)^{365/20}-1`)}, the effective annual cost of forgoing the discount is closest to:`,
      tradeCredit,
      [0.02, (0.02 * 365) / 20],
      pct,
      (ans) =>
        `Forgoing the discount means paying 100 to settle a 98 obligation 20 days later. Annualized, ${block(String.raw`(1+0.02/0.98)^{365/20}-1`)}. That cost is ${ans}. The 2% discount is the periodic saving, not the annualized cost, and a simple 2% times 365/20 skips compounding on the 98 base.`,
    ),
    calc(
      'ci-wc',
      'easy',
      `A distributor has 20 days of inventory, 15 days of receivables, and 50 days of payables. Using ${inline(String.raw`CCC=DIO+DSO-DPO`)}, the cash conversion cycle is closest to:`,
      negativeCycle,
      [20 + 15 + 50, 50 - 20 - 15],
      (value) => num(value, 2),
      (ans) =>
        `Subtract payable days from the operating cycle: ${block(String.raw`20+15-50=-15`)}. The cycle is ${ans} days. A negative result means suppliers finance the operating cycle and then some. Adding all three counts, or flipping the sign, misses that direction.`,
    ),
    idea(
      'ci-wc',
      'medium',
      'Quill Software starts offering a small discount for invoices paid in ten days. Some customers take it and some price-sensitive accounts leave. The working-capital effect the treasurer wanted is:',
      collect,
      'A longer cash conversion cycle, because a discount increases days receivable.',
      'No change in cash, because receivables are not part of the cash conversion cycle.',
      `Shorter collection cuts ${inline(String.raw`DSO`)} inside ${inline(String.raw`DIO+DSO-DPO`)}. The discount and any lost sales are the price of that cash. ${collect}`,
    ),
    idea(
      'ci-wc',
      'hard',
      'Northline Foods builds inventory for a holiday peak and then draws it down. The treasurer compares funding that seasonal bulge with a short-term line versus with new equity. The maturity point is:',
      seasonal,
      'Equity is the closer maturity match, because a seasonal inventory need is permanent.',
      'Short-term debt cannot finance inventory, because lenders refuse current assets as a use of funds.',
      `A temporary current asset can be matched with temporary debt. The rollover risk is the cost of that match; equity avoids the rollover and costs more. ${seasonal}`,
    ),
    idea(
      'ci-wc',
      'easy',
      'Bramble Utilities pays a fee to keep a bank line undrawn so it can borrow if a storm repair arrives. As a liquidity tool, the line is:',
      line,
      'Free, because an undrawn commitment has no cost and no conditions.',
      'A substitute for equity that never has to be repaid and never has covenants.',
      `The commitment is a reserve, not cash on hand. Fees and covenants are the price of the option to draw. ${line}`,
    ),
    idea(
      'ci-wc',
      'hard',
      'Holding the sales level fixed, which change reduces a firm’s cash conversion cycle?',
      levers,
      'Pay suppliers sooner and collect from customers later.',
      'Increase days of inventory and leave receivable and payable days unchanged.',
      `Because ${inline(String.raw`CCC=DIO+DSO-DPO`)}, a shorter receivable period or a longer payable period reduces the cycle, and a longer inventory period increases it. ${levers}`,
    ),
  ])
}

function capalloc(): Draft[] {
  const rate = 0.09
  const flows = [-250, 90, 110, 120]
  const projectNpv = math.npv(rate, flows)
  const projectIrr = math.irr(flows)
  const kilnFlows = [-1000, 430, 430, 430]
  const boothFlows = [-100, 75, 75]
  const kilnNpv = math.npv(0.08, kilnFlows)
  const kilnIrr = math.irr(kilnFlows)
  const boothNpv = math.npv(0.08, boothFlows)
  const boothIrr = math.irr(boothFlows)
  const pickKiln =
    'Accept the kiln upgrade, because its NPV at the 8% opportunity cost of capital is larger.'
  const paybackLimit =
    'Payback ignores the time value of money and ignores cash flows that arrive after the cutoff.'
  const independent =
    'Accept each independent conventional project that has a positive NPV at the opportunity cost of capital.'
  const reinvest =
    'When the rankings conflict, use NPV, because it discounts at the opportunity cost of capital rather than assuming reinvestment at the IRR.'
  const sunk = 'The study is a sunk cost and is left out of the accept-or-reject cash flows.'
  const cannibal =
    'Lost margin on the existing brand is an externality and is subtracted from the new project’s cash flows.'
  const opportunity =
    'The opportunity cost is the after-tax cash the firm could get from selling or renting the warehouse to someone else.'
  const delay =
    'The option to wait can make an immediate start the wrong choice even when today’s NPV is positive.'
  const abandon =
    'The option to stop and sell the assets truncates the downside, so the project is worth more than a model that forces the firm to continue.'
  const ration =
    'Rank feasible projects by profitability index, present value of future inflows divided by the initial investment, when capital is the scarce resource.'
  const multiIrr =
    'More than one sign change can produce more than one IRR, and NPV at the cost of capital is still a single decision.'
  const depreciation =
    'Depreciation is not a cash outflow; the cash effect is the tax saved because the charge is deductible.'
  const replacement =
    'Analyze the incremental cash flows versus keeping the old machine, including the after-tax cash from selling the old machine today.'
  const roic =
    'A firm-level return above WACC does not make every project acceptable; the project still needs its own positive NPV.'

  return exactly('ci-capalloc', 16, [
    calc(
      'ci-capalloc',
      'medium',
      `Harbor Glass can spend USD 250 today on a mold and then receive USD 90, USD 110, and USD 120 at the ends of the next three years. The opportunity cost of capital is 9%. Using ${inline(String.raw`NPV=\sum CF_t/(1+r)^t`)}, the NPV is closest to:`,
      projectNpv,
      [90 + 110 + 120 - 250, math.npv(rate, [90, 110, 120])],
      usd,
      (ans) =>
        `Discount each dated cash flow, including the outflow at t = 0: ${block(String.raw`-250+\frac{90}{1.09}+\frac{110}{1.09^2}+\frac{120}{1.09^3}`)}. The NPV is ${ans}. The undiscounted net of USD 70 ignores time, and dropping the initial outflow from the timeline treats the first inflow as cash today.`,
    ),
    calc(
      'ci-capalloc',
      'medium',
      `For that same Harbor Glass mold (cash flows of −250, +90, +110, and +120), the internal rate of return is the rate that sets ${inline(String.raw`NPV=0`)}. That IRR is closest to:`,
      projectIrr,
      [0.09, (90 + 110 + 120) / 250 - 1],
      pct,
      (ans) =>
        `The IRR solves ${block(String.raw`-250+\frac{90}{1+IRR}+\frac{110}{(1+IRR)^2}+\frac{120}{(1+IRR)^3}=0`)}. It is ${ans}. The 9% hurdle is the opportunity cost of capital, not the project’s IRR, and the undiscounted inflow over the outflow is not a time-weighted rate.`,
    ),
    idea(
      'ci-capalloc',
      'hard',
      'Harbor Glass can fund only one project. The kiln upgrade costs USD 1,000 today and returns USD 430 a year for three years. The booth refresh costs USD 100 today and returns USD 75 a year for two years. The opportunity cost of capital is 8%. The decision is:',
      pickKiln,
      'Accept the booth refresh, because its IRR is higher.',
      'Reject both, because the smaller project uses less capital and therefore has no NPV.',
      `At 8%, the kiln NPV is ${usd(kilnNpv)} and its IRR is ${pct(kilnIrr)}. The booth NPV is ${usd(boothNpv)} and its IRR is ${pct(boothIrr)}. Both IRRs clear 8%, and the value added is the NPV. ${pickKiln}`,
    ),
    idea(
      'ci-capalloc',
      'easy',
      'A Harbor Glass screen accepts any project that returns the initial cash within two years and rejects the rest, with no discounting. The limitation of that payback rule is:',
      paybackLimit,
      'Payback is identical to NPV, because the cutoff year is the discount rate.',
      'Payback overstates later cash flows, because it compounds them at the IRR.',
      `A dollar in year five does not enter a two-year payback, and a dollar in year two is treated like a dollar today. ${paybackLimit}`,
    ),
    idea(
      'ci-capalloc',
      'easy',
      'Quill Software has two unrelated product ideas. Each can be accepted without killing the other, and each has one outflow followed by inflows. The decision rule is:',
      independent,
      'Accept only the idea with the higher IRR, even when both NPVs are positive.',
      'Accept an idea whenever accounting profit in year one is positive, regardless of NPV.',
      `Independence means one project’s acceptance does not block the other. For a conventional pattern, positive NPV and IRR above the hurdle agree. ${independent}`,
    ),
    idea(
      'ci-capalloc',
      'hard',
      'On two mutually exclusive conventional projects, one has the higher IRR and the other has the higher NPV at the opportunity cost of capital. The reason to follow the NPV ranking is:',
      reinvest,
      'IRR is always the value added to the firm, so the higher IRR is the larger wealth increase.',
      'NPV assumes reinvestment at the IRR, so it double-counts the higher-IRR project.',
      `NPV measures the increase in value using the return the capital could earn elsewhere. The IRR’s implied reinvestment rate is the project’s own IRR. ${reinvest}`,
    ),
    idea(
      'ci-capalloc',
      'easy',
      'Last year Kelso Metals paid for a feasibility study. The report is finished and the fee cannot be refunded. In the NPV of going ahead now, that fee is:',
      sunk,
      'Included as an outflow today, because every historical cost is incremental.',
      'Included as a cash inflow, because a sunk cost is recovered when the project is accepted.',
      `Incremental cash flows are what change because of the decision. A fee already paid does not change. ${sunk}`,
    ),
    idea(
      'ci-capalloc',
      'medium',
      'Northline Foods will launch a premium soup that steals volume from its own standard soup. In the premium project’s cash flows, that lost standard-soup margin is:',
      cannibal,
      'Ignored, because a sale lost inside the same firm is not a cash flow.',
      'Added to the premium project, because cannibalization is extra revenue.',
      `An externality inside the firm still belongs to the owners. The with-project case has less standard-soup profit. ${cannibal}`,
    ),
    idea(
      'ci-capalloc',
      'medium',
      'Ibis Apparel already owns a warehouse it could sell or rent. A new project would occupy it. The warehouse’s cost in that project is:',
      opportunity,
      'Zero, because the building is fully paid for and depreciation is finished.',
      'The original construction cost, unadjusted for what a buyer would pay today.',
      `Using an owned asset spends the cash the firm gives up by not selling or leasing it. ${opportunity}`,
    ),
    idea(
      'ci-capalloc',
      'hard',
      'Redkite Mining can open a pit today with a small positive NPV, or wait a year for a ruling on a royalty. The pit cannot be un-opened cheaply. The real-option point is:',
      delay,
      'A positive NPV must be taken immediately, because an option to wait has zero value.',
      'Waiting is free, because a delay cannot change the NPV that was computed today.',
      `The option to postpone is valuable when information is coming and the start is hard to reverse. Today’s NPV does not include that option unless the analyst adds it. ${delay}`,
    ),
    idea(
      'ci-capalloc',
      'medium',
      'Vesper Clinics can shut a pilot clinic and sell the equipment if demand disappoints. A forecast that assumes the clinic must run for ten years regardless:',
      abandon,
      'Overstates the project, because the right to abandon adds nothing once the equipment can be sold.',
      'Is required, because real options are recognized only for expansion, never for stopping.',
      `Abandonment cuts off the worst paths. Ignoring it understates a project that has a real exit. ${abandon}`,
    ),
    idea(
      'ci-capalloc',
      'easy',
      'Piper Street Capital’s portfolio company can fund only USD 5 million of positive-NPV projects that together need USD 9 million. The projects are divisible. A capital-rationing rank uses:',
      ration,
      'The longest payback, because scarce capital should go to the slowest return of cash.',
      'The highest accounting profit, because rationing ignores present value.',
      `The profitability index is ${inline(String.raw`PV_{inflows}/Investment`)}. It picks NPV per unit of the scarce outlay. ${ration}`,
    ),
    idea(
      'ci-capalloc',
      'hard',
      'A mine spends cash to open, produces inflows for several years, and then spends again to restore the site. The cash-flow sign changes twice. For the decision statistic:',
      multiIrr,
      'The IRR is unique whenever the NPV is positive, so the second outflow can be ignored.',
      'NPV is undefined when there are two outflows, so the firm must use payback.',
      `Multiple sign changes can yield multiple rates that set NPV to zero. Discounting at the opportunity cost of capital still returns one NPV. ${multiIrr}`,
    ),
    idea(
      'ci-capalloc',
      'easy',
      'A project model for Marlowe Cement subtracts depreciation from revenue and also subtracts the same depreciation again as if it were a cash cost. The correct treatment is:',
      depreciation,
      'Subtract depreciation twice, because the tax shield is a second cash outflow.',
      'Ignore depreciation entirely, because a non-cash charge cannot affect tax or cash.',
      `Operating cash flow uses after-tax operating profit and adds back depreciation, which is the same idea as counting the tax shield. ${depreciation}`,
    ),
    idea(
      'ci-capalloc',
      'medium',
      'Lumen Rail can keep an old locomotive or buy a new one and sell the old one now. The sale would generate after-tax cash. The analysis should:',
      replacement,
      'Ignore the old locomotive, because a sunk asset cannot produce cash even if it is sold.',
      'Compare the new locomotive’s NPV with zero and leave the sale proceeds out of both cases.',
      `Replacement decisions are incremental. Selling the old asset is cash the firm receives only if it replaces. ${replacement}`,
    ),
    idea(
      'ci-capalloc',
      'medium',
      'Bramble Utilities’ overall return on invested capital is above its WACC. A new unregulated sideline has a negative NPV at a hurdle that fits that sideline’s risk. The implication is:',
      roic,
      'Accept the sideline, because any project inside a firm that beats its WACC has a positive NPV.',
      'Reject the whole firm, because one negative-NPV idea means the firm-level return is below WACC.',
      `Firm-level ROIC is an average. The sideline is accepted or rejected on its own NPV at a risk-matched cost of capital. ${roic}`,
    ),
  ])
}

function structure(): Draft[] {
  const waccNow = math.wacc(0.62, 0.124, 0.38, 0.07, 0.21)
  const waccPretax = math.wacc(0.62, 0.124, 0.38, 0.07, 0)
  const waccSwap = math.wacc(0.38, 0.124, 0.62, 0.07, 0.21)
  const afterTax = 0.07 * (1 - 0.21)
  const keNoTax = math.mmCostOfEquity(0.09, 0.05, 0.5)
  const keInverted = math.mmCostOfEquity(0.09, 0.05, 2)
  const keTax = math.mmCostOfEquity(0.09, 0.05, 0.5, 0.25)
  const keCombined = math.mmCostOfEquity(0.1, 0.06, 0.4, 0.25)
  const weightEquity = 1 / 1.4
  const weightDebt = 0.4 / 1.4
  const waccCombined = math.wacc(weightEquity, keCombined, weightDebt, 0.06, 0.25)
  const waccNoShield = weightEquity * keCombined + weightDebt * 0.06
  const unchanged =
    'Without taxes, WACC stays at the unlevered cost of capital, because the rise in the cost of equity offsets the cheaper debt.'
  const taxShield =
    'With corporate taxes and no distress costs, WACC falls as the firm adds debt, because interest shields tax.'
  const tradeoff =
    'The value-maximizing debt level balances the tax shield against expected distress costs.'
  const marketWeights =
    'Use market-value weights, because those are the amounts investors currently have at risk.'
  const keRises =
    'The cost of equity rises with the debt-to-equity ratio, so cheap debt is not a free reduction in WACC.'
  const pecking =
    'Internal funds first, then debt, then new equity, because of asymmetric information about the shares.'
  const businessRisk =
    'Higher business risk means less debt capacity, all else equal, because operating cash flow is less able to cover interest.'
  const target =
    'Discount a project at the target-capital-structure WACC, not at the coupon on the particular loan that happens to fund it.'
  const sideRisk =
    'A riskier sideline needs a higher hurdle than the firm’s WACC; the firm WACC fits projects that match the firm’s existing risk.'

  return exactly('ci-structure', 14, [
    calc(
      'ci-structure',
      'medium',
      `Harbor Glass targets 62% equity and 38% debt at market value. The cost of equity is 12.4%, the pretax cost of debt is 7%, and the corporate tax rate is 21%. Using ${inline(String.raw`WACC=w_e k_e+w_d k_d(1-t)`)}, WACC is closest to:`,
      waccNow,
      [waccPretax, waccSwap],
      pct,
      (ans) =>
        `Weight the equity cost fully and the debt cost after tax: ${block(String.raw`0.62(0.124)+0.38(0.07)(1-0.21)`)}. WACC is ${ans}. Dropping the tax shield uses the pretax debt cost, and swapping the weights assigns the equity return to the debt slice.`,
    ),
    calc(
      'ci-structure',
      'easy',
      `The pretax cost of Bramble Utilities’ debt is 7% and the corporate tax rate is 21%. Using ${inline(String.raw`k_d(1-t)`)}, the after-tax cost of debt is closest to:`,
      afterTax,
      [0.07, 0.07 * 0.21],
      pct,
      (ans) =>
        `Interest reduces taxable income, so the debt cost that enters WACC is after tax: ${block(String.raw`0.07(1-0.21)`)}. It is ${ans}. The pretax yield is the lender’s quote, and 7% times the tax rate is only the shield, not the net cost.`,
    ),
    calc(
      'ci-structure',
      'medium',
      `Kelso Metals is all-equity financed at a 9% cost of capital. It can borrow at 5%. There are no corporate taxes. At a debt-to-equity ratio of 0.50, the Modigliani-Miller cost of equity ${inline(String.raw`k_e=k_0+(k_0-k_d)(D/E)`)} is closest to:`,
      keNoTax,
      [0.09, keInverted],
      pct,
      (ans) =>
        `Without taxes the levered equity cost adds the full spread times D/E: ${block(String.raw`0.09+(0.09-0.05)(0.50)`)}. It is ${ans}. Leaving equity at the unlevered cost ignores leverage, and using E/D of 2 instead of D/E of 0.50 overstates the premium.`,
    ),
    calc(
      'ci-structure',
      'hard',
      `Use the same Kelso Metals inputs: unlevered cost 9%, cost of debt 5%, and D/E of 0.50. The corporate tax rate is 25%. The Modigliani-Miller cost of equity, with the spread multiplied by ${inline(String.raw`(1-t)`)}, is closest to:`,
      keTax,
      [keNoTax, 0.09 * (1 - 0.25)],
      pct,
      (ans) =>
        `Taxes shrink the leverage premium, not the whole cost of equity: ${block(String.raw`k_e=0.09+(0.09-0.05)(0.50)(1-0.25)`)}. The levered cost is ${ans}. The no-tax figure 11% omits the shield, and multiplying the unlevered cost by one minus the tax rate is not the MM formula.`,
    ),
    idea(
      'ci-structure',
      'easy',
      'In a Modigliani-Miller setting with no taxes and no distress costs, Kelso Metals replaces equity with debt that costs less than the unlevered cost of capital. The WACC:',
      unchanged,
      'Falls by the full difference between the unlevered cost and the cost of debt.',
      'Rises, because any use of debt increases every capital cost including the cost of debt.',
      `The MM no-tax result is ${inline(String.raw`k_e=k_0+(k_0-k_d)(D/E)`)}, and the higher equity cost offsets the cheaper debt in the weighted average. ${unchanged}`,
    ),
    idea(
      'ci-structure',
      'medium',
      'Add corporate taxes to that Modigliani-Miller setting and keep distress costs at zero. As Kelso Metals adds debt, the claim about WACC is:',
      taxShield,
      'WACC is unchanged, because the tax shield is exactly offset by a higher cost of equity even after tax.',
      'WACC rises, because the tax shield makes debt more expensive than equity.',
      `Interest tax shields add value, so the after-tax weighted average declines as debt replaces equity in this frictionless taxed model. ${taxShield}`,
    ),
    idea(
      'ci-structure',
      'hard',
      'Harbor Glass enjoys a tax shield on interest and also faces a rising chance of a costly restructuring if debt is very high. The static tradeoff view of the debt choice is:',
      tradeoff,
      'Borrow as much as lenders will allow, because distress costs are zero whenever a tax shield exists.',
      'Use no debt, because a tax shield cannot be positive if distress is possible.',
      `Value rises with the shield and falls with expected distress. The interior mix is where those effects balance. ${tradeoff}`,
    ),
    idea(
      'ci-structure',
      'medium',
      'Book equity at Quill Software is far below the market value of the shares. Debt is quoted near face. For the weights in WACC, the analyst should:',
      marketWeights,
      'Use book weights, because accounting values are the amounts investors require a return on.',
      'Use equal weights, because market and book differences are ignored in WACC.',
      `WACC weights the capital that is outstanding at current value. ${inline(String.raw`w_e=E/(D+E)`)} should use market values. ${marketWeights}`,
    ),
    idea(
      'ci-structure',
      'easy',
      'A treasurer argues that replacing equity with lower-coupon debt must cut the firm’s WACC one for one. Holding taxes aside, the Modigliani-Miller objection is:',
      keRises,
      'The cost of equity falls as leverage rises, which is why WACC falls by more than the coupon gap.',
      'The cost of equity is fixed at the coupon rate, so leverage cannot change it.',
      `Lenders’ yield is only part of the package. Equity’s required return increases with ${inline(String.raw`D/E`)}. ${keRises}`,
    ),
    idea(
      'ci-structure',
      'hard',
      'Finch Analytics finances new spending with cash on hand when it can, then with debt, and sells shares only when the other sources are exhausted. Managers say a share issue would be read as a signal that the stock is not cheap. This ordering is:',
      pecking,
      'The static tradeoff, because the firm is explicitly balancing a tax shield against distress.',
      'A rule that new equity is the cheapest and first source, because asymmetric information makes shares underpriced.',
      `Pecking order puts internal funds ahead of debt and debt ahead of external equity. The equity issue is the most information-sensitive. ${pecking}`,
    ),
    idea(
      'ci-structure',
      'medium',
      'Redkite Mining’s operating profit swings widely with ore prices. Bramble Utilities’ regulated profit is steadier. All else equal, the implication for debt capacity is:',
      businessRisk,
      'Redkite can carry more debt, because volatile EBIT makes interest easier to cover.',
      'Business risk does not affect debt capacity, because only the tax rate matters.',
      `Debt service is a fixed claim. A noisier operating stream supports less of that claim before distress risk rises. ${businessRisk}`,
    ),
    idea(
      'ci-structure',
      'easy',
      'A project at Harbor Glass will be paid for entirely with a new bank loan. The firm’s target mix is still mostly equity. The discount rate for a project of ordinary risk should be:',
      target,
      'The loan coupon, because the marginal financing is the project’s cost of capital.',
      'The cost of equity only, because a project never includes debt in the discount rate.',
      `Projects are assumed to be financed at the target mix over time, not at the instrument used on closing day. ${target}`,
    ),
    calc(
      'ci-structure',
      'hard',
      `Lumen Rail’s unlevered cost of capital is 10% and it borrows at 6%. The debt-to-equity ratio is 0.40 and the corporate tax rate is 25%. Equity value is the residual, so the equity weight is 1/1.4 and the debt weight is 0.4/1.4. Using the after-tax Modigliani-Miller cost of equity inside ${inline(String.raw`WACC=w_e k_e+w_d k_d(1-t)`)}, WACC is closest to:`,
      waccCombined,
      [keCombined, waccNoShield],
      pct,
      (ans) =>
        `The levered equity cost is ${inline(String.raw`0.10+(0.10-0.06)(0.40)(1-0.25)=0.112`)}. Then ${block(String.raw`WACC=(1/1.4)(0.112)+(0.4/1.4)(0.06)(0.75)`)}. WACC is ${ans}. Stopping at the 11.20% equity cost ignores debt, and skipping the tax shield on the debt coupon overstates WACC.`,
    ),
    idea(
      'ci-structure',
      'medium',
      'Bramble Utilities’ WACC fits its regulated network. A proposed merchant power plant is much riskier than that network. The hurdle for the plant should be:',
      sideRisk,
      'The firm WACC, because every project inside a firm shares the firm’s beta.',
      'The after-tax cost of debt, because a risky project is financed only with debt.',
      `The discount rate has to match project risk. Using a too-low firm WACC would make the risky plant look more valuable than it is. ${sideRisk}`,
    ),
  ])
}

function models(): Draft[] {
  const subscription =
    'Customers pay a recurring fee, revenue is smoother than a one-time license, and churn is the central risk.'
  const marketplace =
    'The firm takes a fee on other parties’ transactions and does not own the inventory; revenue is the take rate times volume.'
  const franchise =
    'The franchisor earns fees and royalties while the franchisee supplies local capital, and brand control is the risk.'
  const razor =
    'The instrument is priced to build an installed base, and the profit sits in the later consumables.'
  const ads =
    'Users do not pay; advertisers do. A slump in the ad market or a privacy limit can cut revenue even if usage rises.'
  const license =
    'Licensing needs less capital and has lower operating leverage, and it gives up some control of quality and of the upside.'

  return exactly('ci-models', 6, [
    idea(
      'ci-models',
      'easy',
      'Quill Software stops selling perpetual licenses and charges an annual fee to keep using the same application. The business-model shift is toward:',
      subscription,
      'A one-time equipment sale, because an annual fee is collected only at installation.',
      'A marketplace, because the user now sets the price of a third party’s goods.',
      `Subscription revenue repeats and depends on renewals. Losing subscribers is the risk that replaces the old upgrade cycle. ${subscription}`,
    ),
    idea(
      'ci-models',
      'medium',
      'A platform owned by Piper Street’s portfolio company matches independent bakeries with households and keeps 12% of each order. The bakeries own the food. Revenue for the platform is:',
      marketplace,
      'The full grocery ticket, because a marketplace consolidates the sellers’ sales onto its own top line.',
      'A regulated tariff, because a take rate is a utility’s allowed return on a rate base.',
      `Marketplace economics are a fee on other people’s volume. The 12% is the take rate, not the bakers’ revenue. ${marketplace}`,
    ),
    idea(
      'ci-models',
      'medium',
      'Hearth Hotels lets local operators use its brand, collects a royalty on room revenue, and requires the operators to fund the buildings. This design is:',
      franchise,
      'A vertically integrated chain, because the brand owner supplies the local capital and keeps every room’s profit.',
      'A pure advertising model, because a royalty is a fee paid by viewers rather than by operators.',
      `Franchising splits local capital from the brand. The franchisor’s job is standards and the royalty stream. ${franchise}`,
    ),
    idea(
      'ci-models',
      'easy',
      'Ibis Apparel sells a home press at a thin margin and earns most of its profit on proprietary sheets that fit only that press. The model is:',
      razor,
      'A subscription, because the press price is rebilled every month whether or not sheets are bought.',
      'A franchise, because each sheet buyer operates a hotel under the apparel brand.',
      `The durable good builds the base. The consumable is where the margin is repeated. ${razor}`,
    ),
    idea(
      'ci-models',
      'hard',
      'A free reading app from Finch Analytics is supported only by advertisements sold to brands. Usage is rising. The revenue risk that can still hurt the firm is:',
      ads,
      'There is no revenue risk, because revenue tracks usage one for one when the user does not pay.',
      'Churn in a subscription fee, because advertisers are the users and they pay a monthly license.',
      `In an ad model the paying customer is the advertiser. Usage without advertiser demand, or a rule that limits targeting, breaks the link to revenue. ${ads}`,
    ),
    idea(
      'ci-models',
      'medium',
      'Marlowe Cement can build and run plants, or it can license its blend to regional partners who own the kilns. Compared with owning the plants, the license model:',
      license,
      'Raises operating leverage, because a royalty income stream requires the same fixed plant cost as owning the kiln.',
      'Removes all risk, because a licensee’s quality problems cannot affect the brand.',
      `Asset-light income scales with less fixed cost. The firm collects a thinner slice and depends on partners to run the process. ${license}`,
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
    if (/\b(all|none) of the above\b/i.test(`${draft.stem} ${draft.correct}`)) {
      throw new Error(`Banned phrasing ${draft.losId}`)
    }
  }
  if (counts.easy !== easy || counts.medium !== medium || counts.hard !== hard) {
    throw new Error(`Difficulty mix ${counts.easy}/${counts.medium}/${counts.hard}, expected ${easy}/${medium}/${hard}`)
  }
}

export function buildCorporate(): Draft[] {
  const drafts = [
    ...org(),
    ...stakeholders(),
    ...governance(),
    ...workingCapital(),
    ...capalloc(),
    ...structure(),
    ...models(),
  ]
  assertBank(drafts, 24, 36, 20)
  return drafts
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const drafts = buildCorporate()
  finalizeTopic('corporate', drafts)
  console.log('ok', drafts.length)
}
