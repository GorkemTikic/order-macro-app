// macros.js

export const MACROS = [
  {
    id: "stop_market_mark_vs_last",
    title: "Stop-Market · Mark Price did not reach (user checked Last Price)",
    price_required: "both",
    fields: [
      "order_id", "symbol", "placed_at_utc", "triggered_at_utc",
      "trigger_type", "trigger_price", "executed_price"
    ],
    template: ({ inputs, prices }) => (
`Order ID: ${inputs.order_id}

${inputs.placed_at_utc} UTC+0 = You placed a Stop-Market order for ${inputs.symbol}.
${inputs.triggered_at_utc} UTC+0 = Stop-Market order review.
Trigger: ${inputs.trigger_type} @ ${inputs.trigger_price}
Executed at: ${inputs.executed_price}

Triggered minute (${prices.triggered_minute} UTC+0):
- Mark Price 1m: O=${prices.mark_open}, H=${prices.mark_high}, L=${prices.mark_low}, C=${prices.mark_close}
- Last Price 1m: O=${prices.last_open}, H=${prices.last_high}, L=${prices.last_low}, C=${prices.last_close}
`)
  },
  {
    id: "stop_market_exec_diff",
    title: "Stop-Market · Executed Price different than Trigger Price",
    price_required: "both",
    fields: [
      "order_id", "symbol", "placed_at_utc", "triggered_at_utc",
      "trigger_type", "trigger_price", "executed_price"
    ],
    template: ({ inputs, prices }) => (
`Order ID: ${inputs.order_id}

${inputs.triggered_at_utc} UTC+0 = Stop-Market was triggered for ${inputs.symbol}.
Trigger: ${inputs.trigger_type} @ ${inputs.trigger_price}
Executed at: ${inputs.executed_price}

Triggered minute OHLC (${prices.triggered_minute} UTC+0):
- Mark: O=${prices.mark_open}, H=${prices.mark_high}, L=${prices.mark_low}, C=${prices.mark_close}
- Last: O=${prices.last_open}, H=${prices.last_high}, L=${prices.last_low}, C=${prices.last_close}

Note: Execution may differ from trigger due to slippage & liquidity at trigger time.
`)
  },
  {
    id: "stop_market_tp_loss",
    title: "Stop-Market · Take Profit ended with loss (slippage)",
    price_required: "both",
    fields: [
      "order_id", "symbol", "placed_at_utc", "triggered_at_utc",
      "trigger_type", "trigger_price", "executed_price"
    ],
    template: ({ inputs, prices }) => (
`Order ID: ${inputs.order_id}

Take Profit review for ${inputs.symbol}.
Trigger: ${inputs.trigger_type} at ${inputs.trigger_price} (UTC ${inputs.triggered_at_utc})
Executed: ${inputs.executed_price}

Triggered minute (${prices.triggered_minute} UTC+0):
- Mark O/H/L/C = ${prices.mark_open}/${prices.mark_high}/${prices.mark_low}/${prices.mark_close}
- Last O/H/L/C = ${prices.last_open}/${prices.last_high}/${prices.last_low}/${prices.last_close}

Observation: The TP ended with loss due to slippage during the triggered minute.
`)
  },
  {
    id: "stop_limit_mark_only",
    title: "Stop-Limit · Triggered minute (Mark only)",
    price_required: "mark",
    fields: [
      "order_id", "symbol", "triggered_at_utc", "trigger_type", "trigger_price"
    ],
    template: ({ inputs, prices }) => (
`Order ID: ${inputs.order_id}

${inputs.triggered_at_utc} UTC+0 = Stop-Limit review for ${inputs.symbol}
Trigger condition: ${inputs.trigger_type} @ ${inputs.trigger_price}

Triggered minute (Mark) OHLC (${prices.triggered_minute} UTC+0):
O=${prices.mark_open}, H=${prices.mark_high}, L=${prices.mark_low}, C=${prices.mark_close}
`)
  },
  {
    id: "market_last_only",
    title: "Market Order · Execution context (Last only)",
    price_required: "last",
    fields: [
      "order_id", "symbol", "triggered_at_utc", "executed_price"
    ],
    template: ({ inputs, prices }) => (
`Order ID: ${inputs.order_id}

Market order executed for ${inputs.symbol} at ${inputs.executed_price} (UTC ${inputs.triggered_at_utc}).

Triggered minute (Last) OHLC (${prices.triggered_minute} UTC+0):
O=${prices.last_open}, H=${prices.last_high}, L=${prices.last_low}, C=${prices.last_close}
`)
  }
];

export const listMacros = () =>
  MACROS.map(({ id, title, price_required, fields }) => ({ id, title, price_required, fields }));

export function renderMacro(macroId, inputs, prices) {
  const m = MACROS.find(x => x.id === macroId);
  if (!m) throw new Error("Macro not found");
  return m.template({ inputs, prices });
}
