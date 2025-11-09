
// src/macros/take_profit_slippage_mark_price.js
import { fmtNum, upper } from "./helpers";

// ✅ YENİ: Mark ve Last için tam OHLC bloğu
function buildFullOHLCBlock(prices) {
  return `> **Mark Price (1m Candle):**
>   Open: ${fmtNum(prices?.mark?.open)}
>   High: ${fmtNum(prices?.mark?.high)}
>   Low:  ${fmtNum(prices?.mark?.low)}
>   Close: ${fmtNum(prices?.mark?.close)}
> 
> **Last Price (1m Candle):**
>   Open: ${fmtNum(prices?.last?.open)}
>   High: ${fmtNum(prices?.last?.high)}
>   Low:  ${fmtNum(prices?.last?.low)}
>   Close: ${fmtNum(prices?.last?.close)}`;
}

export const takeProfitSlippageMarkPrice = {
  id: "tp_slippage_mark_price",
  title: "Take Profit (TP) · Slippage / Unexpected Result (Trigger Mark Price)",
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
      options: ["EXECUTED"],
      defaultValue: "EXECUTED",
      locked: true,
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
      label: "Side (of the TP order)",
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
      name: "trigger_price",
      label: "Trigger Price",
      type: "text",
      placeholder: "e.g. 4393.00",
      col: 6
    },
    {
      name: "executed_price",
      label: "Executed Price",
      type: "text",
      placeholder: "e.g. 4392.50",
      col: 6
    },
    {
      name: "triggered_at_utc",
      label: "Executed At (UTC, YYYY-MM-DD HH:MM:SS)",
      type: "text",
      placeholder: "2025-09-11 12:30:18",
      col: 12
    },
    {
      name: "scenario_modifier",
      label: "Scenario (User Complaint)",
      type: "select",
      options: [
        "Take Profit resulted in less profit than expected",
        "Take Profit order closed with a loss"
      ],
      defaultValue: "Take Profit resulted in less profit than expected",
      col: 12
    }
  ],

  templates: {
    detailed: ({ inputs, prices }) => {
      const priceBlock = buildFullOHLCBlock(prices);
      let scenarioExplanation = "";

      if (
        inputs.scenario_modifier ===
        "Take Profit resulted in less profit than expected"
      ) {
        // ✅ ONAYLADIĞINIZ METİN (Senaryo 1A)
        return `All the dates and times below are UTC+0, so please adjust them to your own time-zone:

**Order ID:** ${inputs.order_id}
**Symbol:** ${inputs.symbol} (${upper(inputs.side)} TP Order)
${inputs.placed_at_utc} UTC+0 = You placed this Take Profit (Stop-Market) order.

**Trigger Condition:** ${inputs.trigger_type}
**Trigger Price:** ${inputs.trigger_price}

${
  inputs.triggered_at_utc
} UTC+0 = The **Mark Price** reached your trigger price, and the Market order was triggered.

Market order executed at the price of: **${inputs.executed_price}**

We understand that you were expecting a higher profit but received less because the executed price was not as favorable as the trigger price.

This is an expected behavior due to two main factors:

**1) Order Type (Stop-Market):**
A Take Profit Stop-Market order triggers a market order when its set price is reached. While market orders ensure immediate execution, they do not guarantee a specific price. The difference between the trigger and execution price is known as slippage.

**2) Trigger Condition (Mark Price):**
Your order was set to trigger from the **Mark Price**. However, all orders execute at the **Last Price** (the actual market trade price).

During that minute, the prices were:

${priceBlock}

This shows that when the **Mark Price** reached your trigger of **${
          inputs.trigger_price
        }**, the system sent a market order. This order was then filled at the best available **Last Price**, which was **${
          inputs.executed_price
        }**.

This difference between the Mark Price (your trigger) and the Last Price (the execution) is the source of the slippage you experienced. This is one of the reasons, and slippage in the Last Price also affects it, so both the Mark Price and Last Price difference and Last Price slippage will affect the order.

For more information, you may check:

[What Is the Difference Between a Futures Contract’s Last Price and Mark Price?](https://www.binance.com/blog/futures/what-is-the-difference-between-a-futures-contracts-last-price-and-mark-price-5704082076024731087)
[What Are Stop Orders in Binance Futures?](https://www.binance.com/blog/futures/what-are-stop-orders-in-binance-futures-2094497753519691034)

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`;
      } else {
        // ✅ GÜNCELLENMİŞ METİN (Senaryo 1B)
        return `All the dates and times below are UTC+0, so please adjust them to your own time-zone:

**Order ID:** ${inputs.order_id}
**Symbol:** ${inputs.symbol} (${upper(inputs.side)} TP Order)
${inputs.placed_at_utc} UTC+0 = You placed this Take Profit (Stop-Market) order.

**Trigger Condition:** ${inputs.trigger_type}
**Trigger Price:** ${inputs.trigger_price}

${
  inputs.triggered_at_utc
} UTC+0 = The **Mark Price** reached your trigger price, and the Market order was triggered.

Market order executed at the price of: **${inputs.executed_price}**

We understand it is frustrating to see a Take Profit order close with a loss. This is a rare scenario that can occur during extreme market volatility, specifically when the **Mark Price** and **Last Price** diverge significantly, combined with market slippage.

Here is the sequence of events:

**1) Trigger Condition (Mark Price):**
Your order was a **Stop-Market** order, set to trigger when the **Mark Price** reached **${
          inputs.trigger_price
        }**.

**2) Market Order Execution:**
At ${
  inputs.triggered_at_utc
} UTC+0, the Mark Price hit this level, and the system sent a Market Order. This Market Order executes at the best available **Last Price**.

**3) Volatility & Slippage:**
During this volatile minute, the Last Price was trading significantly lower/higher than the Mark Price, and the market order's execution (slippage) resulted in a fill at **${
          inputs.executed_price
        }**, which was unfortunately at a loss.

The prices during that minute show this divergence:

${priceBlock}

This outcome is a result of two combined factors: the difference between Mark Price (trigger) and Last Price (execution base) *and* the additional slippage from the Market Order executing in a volatile market.

For more information, you may check:

[What Is the Difference Between a Futures Contract’s Last Price and Mark Price?](https://www.binance.com/blog/futures/what-is-the-difference-between-a-futures-contracts-last-price-and-mark-price-5704082076024731087)

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`;
      }
    },
    summary: ({ inputs, prices }) => {
      // Özet modu (gerekirse daha sonra doldurulabilir)
      const priceBlock = buildFullOHLCBlock(prices);
      return `**Order ID:** ${inputs.order_id}  
**Trigger:** ${inputs.trigger_type} @ ${inputs.trigger_price}  
**Executed:** ${inputs.executed_price}  
**Scenario:** ${inputs.scenario_modifier}  

${priceBlock}

➡️ Your TP order was triggered by **Mark Price** but executed at **Last Price**. The difference between these prices, combined with market order slippage, caused the unexpected result.`;
    }
  }
};
