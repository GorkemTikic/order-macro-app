// src/macros/index.js
import { stopMarketMarkNotReached } from "./stop_market_mark_not_reached";
import { stopMarketLossHigherThanExpectedMarkPrice } from "./stop_market_loss_higher_than_expected_mark_price";
import { stopMarketLossHigherThanExpectedLastPrice } from "./stop_market_loss_higher_than_expected_last_price";
import { takeProfitSlippageMarkPrice } from "./take_profit_slippage_mark_price";
import { takeProfitSlippageLastPrice } from "./take_profit_slippage_last_price";
// ✅ YENİ İMPORTLAR
import { stopLimitMarkPriceNotFilled } from "./stop_limit_mark_price.js";
import { stopLimitLastPriceNotFilled } from "./stop_limit_last_price.js";

import { fundingMacro } from "./funding_macro"; // normal import

// ✅ YENİ MAKROLAR EKLENDİ
export const MACROS = [
  stopMarketMarkNotReached,
  stopMarketLossHigherThanExpectedMarkPrice,
  stopMarketLossHigherThanExpectedLastPrice,
  takeProfitSlippageMarkPrice,
  takeProfitSlippageLastPrice,
  stopLimitMarkPriceNotFilled,
  stopLimitLastPriceNotFilled
];

export const listMacros = () =>
  MACROS.map(({ id, title, price_required, formConfig }) => ({
    id,
    title,
    price_required,
    formConfig
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
