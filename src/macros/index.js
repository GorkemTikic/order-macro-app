// src/macros/index.js
import { stopMarketMarkNotReached } from "./stop_market_mark_not_reached";
import { stopMarketLossHigherThanExpectedMarkPrice } from "./stop_market_loss_higher_than_expected_mark_price";
import { stopMarketLossHigherThanExpectedLastPrice } from "./stop_market_loss_higher_than_expected_last_price";
import { fundingMacro } from "./funding_macro"; // normal import

// Funding Macro intentionally excluded from MACROS list
export const MACROS = [
  stopMarketMarkNotReached,
  stopMarketLossHigherThanExpectedMarkPrice,
  stopMarketLossHigherThanExpectedLastPrice
];

export const listMacros = () =>
  MACROS.map(({ id, title, price_required, fields }) => ({
    id,
    title,
    price_required,
    fields
  }));

export function renderMacro(macroId, inputs, prices, mode = "detailed") {
  if (macroId === "funding_macro") {
    const tpl = fundingMacro.templates?.[mode];
    if (!tpl)
      throw new Error(`Template for mode "${mode}" not found in funding_macro`);
    return tpl({ inputs, prices });
  }

  const m = MACROS.find((x) => x.id === macroId);
  if (!m) throw new Error("Macro not found");
  const tpl = m.templates?.[mode];
  if (!tpl) throw new Error(`Template for mode "${mode}" not found in macro`);
  return tpl({ inputs, prices });
}
