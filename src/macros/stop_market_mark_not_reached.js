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

  const fullRangeBlock = `> **Mark Price Range:**
>   Highest: ${fmtNum(mHigh)} (at ${mHighT || "N/A"})
>   Lowest:  ${fmtNum(mLow)} (at ${mLowT || "N/A"})
> 
> **Last Price Range:**
>   Highest: ${fmtNum(lHigh)} (at ${lHighT || "N/A"})
>   Lowest:  ${fmtNum(lLow)} (at ${lLowT || "N/A"})`;

  if (side !== "BUY" && side !== "SELL") {
    const neutralExplanation = `Because the trigger condition is **Mark Price**, the order can only activate when Mark Price crosses your trigger level (${inputs.trigger_price}).  

The Mark Price extremes within this period did not cross that level, so the order did not activate.`;

    return { table: fullRangeBlock, explanation: neutralExplanation };
  }

  if (side === "SELL") {
    const lastCrossed =
      Number.isFinite(lLow) && Number.isFinite(trig) ? lLow <= trig : false;
    const markCrossed =
      Number.isFinite(mLow) && Number.isFinite(trig) ? mLow <= trig : false;

    let explanation = `Since you placed a **SELL Stop-Market**, the Mark Price needed to fall to **${inputs.trigger_price}**.  

However, the lowest Mark Price was **${fmtNum(
      mLow
    )}**, which stayed *above* your trigger price, so the order did not activate.`;

    if (lastCrossed && !markCrossed) {
      explanation += `  

➡️ Even though the **Last Price** reached/passed your trigger level (Lowest: ${fmtNum(
        lLow
      )}), the **Mark Price** did not, therefore the Stop-Market order could not trigger.`;
    }

    return { table: fullRangeBlock, explanation: explanation };
  }

  // BUY
  const lastCrossed =
    Number.isFinite(lHigh) && Number.isFinite(trig) ? lHigh >= trig : false;
  const markCrossed =
    Number.isFinite(mHigh) && Number.isFinite(trig) ? mHigh >= trig : false;

  let explanation = `Since you placed a **BUY Stop-Market**, the Mark Price needed to rise to **${inputs.trigger_price}**.  

However, the highest Mark Price was **${fmtNum(
    mHigh
  )}**, which stayed *below* your trigger price, so the order did not activate.`;

  if (lastCrossed && !markCrossed) {
    explanation += `  

➡️ Even though the **Last Price** reached/passed your trigger level (Highest: ${fmtNum(
      lHigh
    )}), the **Mark Price** did not, therefore the Stop-Market order could not trigger.`;
  }

  return { table: fullRangeBlock, explanation: explanation };
}

export const stopMarketMarkNotReached = {
  id: "mark_not_reached_user_checked_last",
  title: "Stop-Market · Mark Price Not Reached (User Checks Last Price)",
  price_required: "both",

  formConfig: [
    {
      name: "order_id",
      label: "Order ID",
      type: "text",
      placeholder: "8389...",
      col: 6
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["OPEN", "CANCELED", "EXPIRED"],
      defaultValue: "OPEN",
      col: 6
    },
    {
      name: "symbol",
      label: "Symbol",
      type: "text",
      placeholder: "ETHUSDT",
      defaultValue: "ETHUSDT",
      col: 6
    },
    {
      name: "side",
      label: "Side (of the Stop order)",
      type: "select",
      options: ["SELL", "BUY"],
      defaultValue: "SELL",
      col: 6
    },
    {
      name: "placed_at_utc",
      label: "Placed At (UTC, YYYY-MM-DD HH:MM:SS)",
      type: "text",
      placeholder: "2025-09-11 06:53:08",
      col: 6
    },
    {
      name: "trigger_type",
      label: "Trigger Type",
      type: "text",
      defaultValue: "MARK",
      locked: true,
      col: 6
    },
    {
      name: "trigger_price", // ✅ HATA DÜZELTİLDİ (name:g: idi)
      label: "Trigger Price",
      type: "text",
      placeholder: "e.g. 4393.00",
      col: 6
    },
    {
      name: "final_status_utc",
      label: "Final Status At (Open/Canceled/Expired)",
      type: "text",
      placeholder: "2025-09-11 12:30:19",
      col: 12
    }
  ],

  templates: {
    detailed: ({ inputs, prices }) => {
      const stillOpen =
        upper(inputs.status) === "OPEN" && !inputs.executed_price;
      const statusLine = statusLineFriendly(inputs);
      const { table, explanation } = buildSideAwareBlock(inputs, prices);

      return `**Order ID:** ${inputs.order_id}

${inputs.placed_at_utc} UTC+0 = At this date and time you placed a Stop-Market order (**${
        upper(inputs.side) || "N/A"
      }**) for **${inputs.symbol}**.  

**Order Type:** Stop-Market  
**Trigger Condition:** ${inputs.trigger_type}  
**Trigger Price:** ${inputs.trigger_price}  

${statusLine}

When we check the **${inputs.symbol} Price Chart** From: ${inputs.placed_at_utc} UTC+0  
To: ${inputs.final_status_utc} UTC+0  

${table}  

${explanation}${
        stillOpen
          ? `  

⚠️ *Please note: this order is still OPEN and may trigger in the future if Mark Price crosses the trigger price.*`
          : ""
      }  

*Experienced traders often use **Mark Price** for stop-orders near liquidation risk, while they may choose **Last Price** for entry or take-profit orders.* [Mark Price vs. Last Price on Binance Futures – What’s the Difference?](https://www.binance.com/blog/futures/what-is-the-difference-between-a-futures-contracts-last-price-and-mark-price-5704082076024731087)  

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`;
    },
    summary: ({ inputs, prices }) => {
      const statusLine = statusLineFriendly(inputs);
      const side = upper(inputs.side);
      const { table, explanation } = buildSideAwareBlock(inputs, prices);

      let lines = [];

      lines.push(`**Order ID:** ${inputs.order_id}  `);
      lines.push(``);
      lines.push(
        `${inputs.placed_at_utc} UTC+0 = You placed a Stop-Market order for **${inputs.symbol}**.`
      );
      lines.push(statusLine);
      lines.push(``);
      lines.push(
        `**Trigger:** ${inputs.trigger_type} @ ${inputs.trigger_price}${
          side ? `  \n**Side:** ${side}` : ""
        }`
      );
      lines.push(``);
      lines.push(`**Price Range (${inputs.placed_at_utc} → ${inputs.final_status_utc}):**`);
      lines.push(table);
      lines.push(``);
      lines.push(explanation);

      return lines.join("\n");
    }
  }
};
