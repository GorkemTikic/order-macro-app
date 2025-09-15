// src/macros/index.js
import { stopMarketMarkNotReached } from "./stop_market_mark_not_reached";

export const MACROS = [
  stopMarketMarkNotReached
];

export const listMacros = () =>
  MACROS.map(({ id, title, price_required, fields }) => ({
    id,
    title,
    price_required,
    fields
  }));

export function renderMacro(macroId, inputs, prices, mode = "detailed") {
  const m = MACROS.find((x) => x.id === macroId);
  if (!m) throw new Error("Macro not found");
  const tpl = m.templates?.[mode];
  if (!tpl) throw new Error(`Template for mode "${mode}" not found in macro`);
  return tpl({ inputs, prices });
}
