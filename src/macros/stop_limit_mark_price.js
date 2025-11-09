// src/macros/stop_limit_mark_price.js
import { fmtNum, upper, statusLineFriendly } from "./helpers";

// Mark ve Last için tam OHLC bloğu
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

export const stopLimitMarkPriceNotFilled = {
  id: "stop_limit_mark_price_not_filled",
  // ✅ GÜNCELLENDİ: Arayüz başlığı
  title: "Stop-Limit · Not Filled (Stop/Limit Same Price - Mark)",
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
      label: "Side (of the Stop-Limit order)",
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
      col: 12
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
      label: "Stop Price (Trigger)",
      type: "text",
      placeholder: "e.g. 4393.00",
      col: 6
    },
    {
      name: "limit_price",
      label: "Limit Price (Order Price)",
      type: "text",
      placeholder: "e.g. 4393.00",
      col: 6
    },
    {
      name: "triggered_at_utc",
      label: "Triggered At (Stop Price Hit)",
      type: "text",
      placeholder: "2025-09-11 12:30:18",
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
      const priceBlock = buildFullOHLCBlock(prices);

      // ✅ GÜNCELLENDİ: Metin "Same Price" riskini vurgulayacak şekilde netleştirildi
      return `All the dates and times below are UTC+0, so please adjust them to your own time-zone:

**Order ID:** ${inputs.order_id}
**Symbol:** ${inputs.symbol} (${upper(inputs.side)} Stop-Limit Order)

${inputs.placed_at_utc} UTC+0 = You placed this Stop-Limit order.

**Trigger Condition:** ${inputs.trigger_type}
**Stop Price (Trigger):** ${inputs.trigger_price}
**Limit Price (Order Price):** ${inputs.limit_price}

${
  inputs.triggered_at_utc
} UTC+0 = The **Mark Price** reached your Stop Price. This **triggered** your Limit order, placing it onto the order book.

${statusLineFriendly(inputs)}

We understand your order was triggered but did not fill (execute), and remained open on the order book.

This issue is often caused by setting the **Stop Price and Limit Price to the same value ($${
        inputs.trigger_price
      })** in a volatile market.

Here is a breakdown of the reasons:

**1) The "Same Price" Risk:**
Setting your Stop and Limit to the same price gives you **zero buffer** for execution. A Limit order can only fill at that exact price or better. In the volatile crypto market, this is highly risky.

**2) Trigger (Mark) vs. Execution (Last):**
Your order was set to trigger from the **Mark Price**. However, all orders execute based on the **Last Price**. When the Mark Price hit your trigger, the **Last Price** (where your order needed to fill) was *already* worse than your Limit Price.

The prices during that minute show this difference:

${priceBlock}

As the data shows, the Last Price was trading at a level that made your Limit order impossible to fill. Because no buyers/sellers were available at your Limit Price (${
        inputs.limit_price
      }) or better, your order remained open (unfilled).

**Recommendation (How to Avoid This):**
To increase the chance of your order filling next time, we strongly recommend setting a "buffer" (a gap) between your Stop and Limit prices. Setting them to the same price is not a reliable strategy in a fast market.

Here is a simple example for a **SELL** order:
Instead of setting both Stop and Limit at $103,000, set the **Stop Price at $103,000** and the **Limit Price slightly lower, for example, at $102,950**.
This way, when the Stop price is triggered, your Limit order has a $50 range ($103,000 to $102,950) to get filled, massively increasing the chance of execution.

For more information, you can refer to these articles:
[What Is a Stop-Limit Order?](https://www.binance.com/en/academy/articles/what-is-a-stop-limit-order)
[Types of Order on Binance Futures](https://www.binance.com/en/support/faq/detail/360033779452)
[Mark Price vs. Last Price on Binance Futures – What’s the Difference?](https://www.binance.com/en/blog/futures/5704082076024731087)

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`;
    },
    summary: ({ inputs, prices }) => {
      const priceBlock = buildFullOHLCBlock(prices);
      return `**Order ID:** ${inputs.order_id}
**Trigger:** ${inputs.trigger_type} @ ${inputs.trigger_price}
**Limit Price:** ${inputs.limit_price}
**Status:** ${upper(inputs.status)}

${priceBlock}

➡️ Your Stop-Limit order **triggered** (by Mark Price) but **did not fill**.
This usually happens because the **Last Price** was already worse than your Limit Price. Setting the Stop and Limit to the *same price* ($${
        inputs.trigger_price
      }) gives no buffer for execution in volatile markets.`;
    }
  }
};
