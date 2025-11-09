// src/macros/take_profit_slippage_last_price.js
import { fmtNum, upper } from "./helpers";

// ✅ YENİ: Sadece Last için tam OHLC bloğu
function buildLastPriceOHLCBlock(prices) {
  return `> **Last Price (1m Candle):**
>   Open: ${fmtNum(prices?.last?.open)}
>   High: ${fmtNum(prices?.last?.high)}
>   Low:  ${fmtNum(prices?.last?.low)}
>   Close: ${fmtNum(prices?.last?.close)}`;
}

export const takeProfitSlippageLastPrice = {
  id: "tp_slippage_last_price",
  title: "Take Profit (TP) · Slippage / Unexpected Result (Trigger Last Price)",
  price_required: "last", // Sadece 'last' gerekli

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
      defaultValue: "LAST",
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
      const priceBlock = buildLastPriceOHLCBlock(prices);

      if (
        inputs.scenario_modifier ===
        "Take Profit resulted in less profit than expected"
      ) {
        // ✅ GÜNCELLENMİŞ METİN (Senaryo 2A)
        return `All the dates and times below are UTC+0, so please adjust them to your own time-zone:

**Order ID:** ${inputs.order_id}
**Symbol:** ${inputs.symbol} (${upper(inputs.side)} TP Order)
${inputs.placed_at_utc} UTC+0 = You placed this Take Profit (Stop-Market) order.

**Trigger Condition:** ${inputs.trigger_type}
**Trigger Price:** ${inputs.trigger_price}

${
  inputs.triggered_at_utc
} UTC+0 = The **Last Price** reached your trigger price, and the Market order was triggered.

Market order executed at the price of: **${inputs.executed_price}**

We understand that you were expecting a higher profit but received less because the executed price was not as favorable as the trigger price.

This is an expected behavior for a **Stop-Market** order. Here is why:

**1) Order Type (Stop-Market):**
A Take Profit Stop-Market order triggers a **Market Order** when its set price is reached.

**2) Market Execution:**
When the **Last Price** (which you selected as your trigger) reached **${
          inputs.trigger_price
        }**, the system immediately sent a Market Order.

**3) Slippage:**
Market orders ensure immediate execution, but they do not guarantee a specific price. Your order was filled at the *next best available price* in the market, which was **${
          inputs.executed_price
        }**.

This difference between the trigger price and the execution price is called *slippage* and is a normal part of trading in fast-moving markets.

The Last Price details for that minute were:

${priceBlock}

As you can see, the price may have moved instantly within that minute, causing your order to fill at a different price than your trigger.

For more information, you may check:
[What Are Stop Orders in Binance Futures?](https://www.binance.com/blog/futures/what-are-stop-orders-in-binance-futures-2094497753519691034)

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`;
      } else {
        // ✅ GÜNCELLENMİŞ METİN (Senaryo 2B)
        return `All the dates and times below are UTC+0, so please adjust them to your own time-zone:

**Order ID:** ${inputs.order_id}
**Symbol:** ${inputs.symbol} (${upper(inputs.side)} TP Order)
${inputs.placed_at_utc} UTC+0 = You placed this Take Profit (Stop-Market) order.

**Trigger Condition:** ${inputs.trigger_type}
**Trigger Price:** ${inputs.trigger_price}

${
  inputs.triggered_at_utc
} UTC+0 = The **Last Price** reached your trigger price, and the Market order was triggered.

Market order executed at the price of: **${inputs.executed_price}**

We understand it is frustrating to see a Take Profit order close with a loss. This can happen during a "flash crash" or a moment of extreme market volatility when using a Stop-Market order.

Here is the sequence of events:

**1) Order Type (Stop-Market):**
Your order was a **Stop-Market** order, set to trigger when the **Last Price** reached **${
          inputs.trigger_price
        }**.

**2) Market Execution:**
At ${
  inputs.triggered_at_utc
} UTC+0, the Last Price hit this level, and the system sent a **Market Order** as instructed.

**3) Volatility & Slippage:**
A Market Order executes immediately at the *best available price*. Due to extreme volatility, the market moved so fast that the *next* best available price to fill your order was **${
          inputs.executed_price
        }**, which was unfortunately at a loss.

The Last Price details for that minute show the high volatility:

${priceBlock}

Because your order was a Market Order, it had to be filled instantly at the available market price. Unlike a Limit order, it does not guarantee a price, which in this volatile moment resulted in a loss.

For more information, you may check:
[What Are Stop Orders in Binance Futures?](https://www.binance.com/blog/futures/what-are-stop-orders-in-binance-futures-2094497753519691034)

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`;
      }
    },
    summary: ({ inputs, prices }) => {
      const priceBlock = buildLastPriceOHLCBlock(prices);
      return `**Order ID:** ${inputs.order_id}  
**Trigger:** ${inputs.trigger_type} @ ${inputs.trigger_price}  
**Executed:** ${inputs.executed_price}  
**Scenario:** ${inputs.scenario_modifier}  

${priceBlock}

➡️ Your TP order was triggered by **Last Price**. The difference between your trigger and execution is due to standard market order slippage.`;
    }
  }
};
