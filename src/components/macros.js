// src/macros.js

export const MACROS = [
  {
    id: "stop_market_mark_vs_last_not_reached",
    title: "Stop-Market · Mark Trigger not reached (User checked Last Price)",
    price_required: "both", // needs both Mark + Last data from range
    fields: [
      "order_id",
      "symbol",
      "placed_at_utc",
      "triggered_at_utc",
      "trigger_type",
      "trigger_price",
      "executed_price",
      "status"
    ],
    template: ({ inputs, prices }) => {
      const stillOpen =
        inputs.status?.toLowerCase() === "open" && !inputs.executed_price;

      // friendly status wording
      let statusLine = "";
      if (inputs.status?.toLowerCase() === "canceled") {
        statusLine = `${inputs.triggered_at_utc} UTC+0 = This is the date and time you **cancelled** the order.`;
      } else if (inputs.status?.toLowerCase() === "executed") {
        statusLine = `${inputs.triggered_at_utc} UTC+0 = This is the date and time your order **executed**.`;
      } else if (inputs.status?.toLowerCase() === "open") {
        statusLine = `${inputs.triggered_at_utc} UTC+0 = Current status: **OPEN** (order still active).`;
      }

      return (
`**Order ID:** ${inputs.order_id}

${inputs.placed_at_utc} UTC+0 = At this date and time you placed a Stop-Market order for **${inputs.symbol}**.

**Order Type:** Stop-Market  
**Trigger Condition:** ${inputs.trigger_type}  
**Trigger Price:** ${inputs.trigger_price}

${statusLine}${inputs.executed_price ? `\n**Executed Price:** ${inputs.executed_price}` : ""}

When we check the **${inputs.symbol} Price Chart**

From: \`${inputs.placed_at_utc}\`  
To: \`${inputs.triggered_at_utc}\`

> Highest Mark Price: ${prices.mark.high} at ${prices.mark.highTime}  
> Highest Last Price: ${prices.last.high} at ${prices.last.highTime}

> Lowest Mark Price: ${prices.mark.low} at ${prices.mark.lowTime}  
> Lowest Last Price: ${prices.last.low} at ${prices.last.lowTime}

Because you selected **Mark Price** as the trigger condition, your order required the Mark Price to cross your trigger price (${inputs.trigger_price}).  
However, during this period the **lowest Mark Price** was ${prices.mark.low}, which stayed *above* your trigger price.  
That is why your Stop-Market order did not activate.${stillOpen ? `\n\n⚠️ *Please note: this order is still OPEN and may trigger in the future if Mark Price crosses the trigger price.*` : ""}

📌 **Traders who know the difference often follow this strategy:**

- If they want to close the position at a point close to liquidation, they choose the trigger condition as **Mark Price**, because liquidations are triggered via Mark Price.  
- However, if they are going to close the position away from liquidation and for profit, they prefer the **Last Price**, because they want to catch the fast movements of the Last Price.  

[Mark Price vs. Last Price on Binance Futures – What’s the Difference?](https://www.binance.com/blog/futures/5704082076024731087)

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`
      );
    }
  },
  {
    id: "stop_market_exec_diff",
    title: "Stop-Market · Executed Price different than Trigger Price",
    price_required: "both",
    fields: [
      "order_id",
      "symbol",
      "placed_at_utc",
      "triggered_at_utc",
      "trigger_type",
      "trigger_price",
      "executed_price",
      "status"
    ],
    template: ({ inputs, prices }) => (
`**Order ID:** ${inputs.order_id}

${inputs.triggered_at_utc} UTC+0 = This is the date and time your Stop-Market order was **triggered** for ${inputs.symbol}.  

**Trigger Condition:** ${inputs.trigger_type} @ ${inputs.trigger_price}  
**Executed Price:** ${inputs.executed_price}

> Triggered minute OHLC (${prices.triggered_minute} UTC+0):  
> - Mark: O=${prices.mark_open}, H=${prices.mark_high}, L=${prices.mark_low}, C=${prices.mark_close}  
> - Last: O=${prices.last_open}, H=${prices.last_high}, L=${prices.last_low}, C=${prices.last_close}

💡 *Note: Execution may differ from trigger due to slippage & liquidity at trigger time.*`
    )
  },
  {
    id: "stop_market_tp_loss",
    title: "Stop-Market · Take Profit ended with loss (slippage)",
    price_required: "both",
    fields: [
      "order_id",
      "symbol",
      "placed_at_utc",
      "triggered_at_utc",
      "trigger_type",
      "trigger_price",
      "executed_price",
      "status"
    ],
    template: ({ inputs, prices }) => (
`**Order ID:** ${inputs.order_id}

Take Profit review for **${inputs.symbol}**.  

**Trigger:** ${inputs.trigger_type} at ${inputs.trigger_price} (UTC ${inputs.triggered_at_utc})  
**Executed:** ${inputs.executed_price}

> Triggered minute (${prices.triggered_minute} UTC+0):  
> - Mark O/H/L/C = ${prices.mark_open}/${prices.mark_high}/${prices.mark_low}/${prices.mark_close}  
> - Last O/H/L/C = ${prices.last_open}/${prices.last_high}/${prices.last_low}/${prices.last_close}

⚠️ *Observation: The Take Profit ended with loss due to slippage during the triggered minute.*`
    )
  },
  {
    id: "stop_limit_mark_only",
    title: "Stop-Limit · Triggered minute (Mark only)",
    price_required: "mark",
    fields: [
      "order_id",
      "symbol",
      "triggered_at_utc",
      "trigger_type",
      "trigger_price",
      "status"
    ],
    template: ({ inputs, prices }) => (
`**Order ID:** ${inputs.order_id}

${inputs.triggered_at_utc} UTC+0 = Stop-Limit review for **${inputs.symbol}**  

**Trigger Condition:** ${inputs.trigger_type} @ ${inputs.trigger_price}

> Triggered minute (Mark) OHLC (${prices.triggered_minute} UTC+0):  
O=${prices.mark_open}, H=${prices.mark_high}, L=${prices.mark_low}, C=${prices.mark_close}`
    )
  },
  {
    id: "market_last_only",
    title: "Market Order · Execution context (Last only)",
    price_required: "last",
    fields: [
      "order_id",
      "symbol",
      "triggered_at_utc",
      "executed_price",
      "status"
    ],
    template: ({ inputs, prices }) => (
`**Order ID:** ${inputs.order_id}

Market order executed for **${inputs.symbol}** at ${inputs.executed_price} (UTC ${inputs.triggered_at_utc}).  

> Triggered minute (Last) OHLC (${prices.triggered_minute} UTC+0):  
O=${prices.last_open}, H=${prices.last_high}, L=${prices.last_low}, C=${prices.last_close}`
    )
  }
];

export const listMacros = () =>
  MACROS.map(({ id, title, price_required, fields }) => ({
    id,
    title,
    price_required,
    fields
  }));

export function renderMacro(macroId, inputs, prices) {
  const m = MACROS.find((x) => x.id === macroId);
  if (!m) throw new Error("Macro not found");
  return m.template({ inputs, prices });
}
