// src/macros/stop_market_mark_not_reached.js
import { fmtNum, upper, statusLineFriendly } from "./helpers";

function buildSideAwareBlock(inputs, prices) {
  const side = upper(inputs.side);
  const trig = Number(inputs.trigger_price);

  const mHigh = prices?.mark?.high;
  const mLow = prices?.mark?.low;
  const mHighT = prices?.mark?.highTime;
  const mLowT = prices?.mark?.lowTime;

  const lHigh = prices?.last?.high;
  const lLow = prices?.last?.low;
  const lHighT = prices?.last?.highTime;
  const lLowT = prices?.last?.lowTime;

  // Neutral (side not given)
  if (side !== "BUY" && side !== "SELL") {
    const bothBlock =
`> Highest Mark Price: ${fmtNum(mHigh)} at ${mHighT || "N/A"}
> Highest Last Price: ${fmtNum(lHigh)} at ${lHighT || "N/A"}

> Lowest Mark Price: ${fmtNum(mLow)} at ${mLowT || "N/A"}
> Lowest Last Price: ${fmtNum(lLow)} at ${lLowT || "N/A"}`;

    const neutralExplanation =
`Because the trigger condition is **Mark Price**, the order can only activate when Mark Price crosses your trigger level (${inputs.trigger_price}).  
The Mark Price extremes within this period did not cross that level, so the order did not activate.`;

    return { table: bothBlock, explanation: neutralExplanation };
  }

  // SELL → looking at lows
  if (side === "SELL") {
    const table =
`> Lowest **Mark Price**: ${fmtNum(mLow)} at ${mLowT || "N/A"}
> Lowest **Last Price**: ${fmtNum(lLow)} at ${lLowT || "N/A"}`;

    const lastCrossed = Number.isFinite(lLow) && Number.isFinite(trig) ? (lLow <= trig) : false;
    const markCrossed = Number.isFinite(mLow) && Number.isFinite(trig) ? (mLow <= trig) : false;

    let explanation = `Since you placed a **SELL Stop-Market**, the Mark Price needed to fall to **${inputs.trigger_price}**.  
However, the lowest Mark Price was **${fmtNum(mLow)}**, which stayed *above* your trigger price, so the order did not activate.`;

    if (lastCrossed && !markCrossed) {
      explanation += `
➡️ Even though the **Last Price** reached/passed your trigger level, the **Mark Price** did not, therefore the Stop-Market order could not trigger.`;
    }

    return { table, explanation };
  }

  // BUY → looking at highs
  const table =
`> Highest **Mark Price**: ${fmtNum(mHigh)} at ${mHighT || "N/A"}
> Highest **Last Price**: ${fmtNum(lHigh)} at ${lHighT || "N/A"}`;

  const lastCrossed = Number.isFinite(lHigh) && Number.isFinite(trig) ? (lHigh >= trig) : false;
  const markCrossed = Number.isFinite(mHigh) && Number.isFinite(trig) ? (mHigh >= trig) : false;

  let explanation = `Since you placed a **BUY Stop-Market**, the Mark Price needed to rise to **${inputs.trigger_price}**.  
However, the highest Mark Price was **${fmtNum(mHigh)}**, which stayed *below* your trigger price, so the order did not activate.`;

  if (lastCrossed && !markCrossed) {
    explanation += `
➡️ Even though the **Last Price** reached/passed your trigger level, the **Mark Price** did not, therefore the Stop-Market order could not trigger.`;
  }

  return { table, explanation };
}

export const stopMarketMarkNotReached = {
  id: "mark_not_reached_user_checked_last",
  title: "Stop-Market · Mark Price Not Reached (User Checks Last Price)",
  price_required: "both",
  fields: [
    "order_id",
    "symbol",
    "side",
    "placed_at_utc",
    "triggered_at_utc",
    "trigger_type",
    "trigger_price",
    "executed_price",
    "status"
  ],
  templates: {
    detailed: ({ inputs, prices }) => {
      const stillOpen = upper(inputs.status) === "OPEN" && !inputs.executed_price;
      const statusLine = statusLineFriendly(inputs);
      const { table, explanation } = buildSideAwareBlock(inputs, prices);

      return (
`**Order ID:** ${inputs.order_id}

${inputs.placed_at_utc} UTC+0 = At this date and time you placed a Stop-Market order (**${upper(inputs.side) || "N/A"}**) for **${inputs.symbol}**.

**Order Type:** Stop-Market  
**Trigger Condition:** ${inputs.trigger_type}  
**Trigger Price:** ${inputs.trigger_price}

${statusLine}${inputs.executed_price ? `\n**Executed Price:** ${inputs.executed_price}` : ""}

When we check the **${inputs.symbol} Price Chart**

From: ${inputs.placed_at_utc} UTC+0  
To: ${inputs.triggered_at_utc} UTC+0  

${table}

${explanation}${stillOpen ? `

⚠️ *Please note: this order is still OPEN and may trigger in the future if Mark Price crosses the trigger price.*` : ""}

For further details, you may check the official guide:  
[Mark Price vs. Last Price on Binance Futures – What’s the Difference?](https://www.binance.com/blog/futures/5704082076024731087)

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`
      );
    },
    summary: ({ inputs, prices }) => {
      const statusLine = statusLineFriendly(inputs);
      const side = upper(inputs.side);
      let lines = [];

      lines.push(`**Order ID:** ${inputs.order_id}  `);
      lines.push(``);
      lines.push(`${inputs.placed_at_utc} UTC+0 = You placed a Stop-Market order for **${inputs.symbol}**.`); 
      lines.push(statusLine);
      lines.push(``);
      lines.push(`**Trigger:** ${inputs.trigger_type} @ ${inputs.trigger_price}${side ? `  \n**Side:** ${side}` : ""}`);
      lines.push(``);

      if (side === "SELL") {
        lines.push(`During this time:`);
        lines.push(`- Lowest **Mark Price** = ${fmtNum(prices?.mark?.low)}`);
        lines.push(`- Lowest **Last Price** = ${fmtNum(prices?.last?.low)}`);
        lines.push(`- Your **Trigger Price** = ${inputs.trigger_price}`);
        lines.push(``);
        lines.push(`➡️ Even though **Last Price** may have moved further down, **Mark Price** stayed above your trigger price, so the order did not activate.`);
      } else if (side === "BUY") {
        lines.push(`During this time:`);
        lines.push(`- Highest **Mark Price** = ${fmtNum(prices?.mark?.high)}`);
        lines.push(`- Highest **Last Price** = ${fmtNum(prices?.last?.high)}`);
        lines.push(`- Your **Trigger Price** = ${inputs.trigger_price}`);
        lines.push(``);
        lines.push(`➡️ Even though **Last Price** may have moved further up, **Mark Price** stayed below your trigger price, so the order did not activate.`);
      } else {
        // Neutral fallback
        lines.push(`During this time:`);
        lines.push(`- Highest Mark/Last = ${fmtNum(prices?.mark?.high)} / ${fmtNum(prices?.last?.high)}`);
        lines.push(`- Lowest Mark/Last = ${fmtNum(prices?.mark?.low)} / ${fmtNum(prices?.last?.low)}`);
        lines.push(`- Your **Trigger Price** = ${inputs.trigger_price}`);
        lines.push(``);
        lines.push(`➡️ The order did not activate because **Mark Price** did not cross your trigger level.`);
      }

      lines.push(``);
      lines.push(`For further details, you may check the official guide:`); 
      lines.push(`[Mark Price vs. Last Price on Binance Futures – What’s the Difference?](https://www.binance.com/blog/futures/5704082076024731087)`);

      return lines.join("\n");
    }
  }
};
