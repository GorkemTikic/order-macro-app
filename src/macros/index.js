// src/macros/index.js
import { stopMarketMarkNotReached } from "./stop_market_mark_not_reached";
// Funding Macro intentionally not imported here
// because it has its own dedicated tab (FundingMacro.jsx)

export const MACROS = [
  stopMarketMarkNotReached
  // fundingMacro is excluded from Macro Generator dropdown
];

export const listMacros = () =>
  MACROS.map(({ id, title, price_required, fields }) => ({
    id,
    title,
    price_required,
    fields
  }));

export function renderMacro(macroId, inputs, prices, mode = "detailed") {
  // Funding Macro is still available for direct render calls
  if (macroId === "funding_macro") {
    // dynamic import avoids including it in dropdown
    const { fundingMacro } = require("./funding_macro");
    const tpl = fundingMacro.templates?.[mode];
    if (!tpl) throw new Error(`Template for mode "${mode}" not found in funding_macro`);
    return tpl({ inputs, prices });
  }

  const m = MACROS.find((x) => x.id === macroId);
  if (!m) throw new Error("Macro not found");
  const tpl = m.templates?.[mode];
  if (!tpl) throw new Error(`Template for mode "${mode}" not found in macro`);
  return tpl({ inputs, prices });
}
