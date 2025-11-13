// src/macros/helpers.js

// Format number safely with fixed digits
export function fmtNum(v, digits = 8) {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : String(v);
}

// Convert string to uppercase safely
export function upper(s) {
  return (s || "").toString().trim().toUpperCase();
}

// Build user-friendly status line with timestamp
export function statusLineFriendly(inputs) {
  const st = upper(inputs.status);
  
  // 'final_status_utc' (Stop-Limit, Not-Reached) önceliklidir.
  // Yoksa, 'triggered_at_utc' (SL/TP Slippage) kullanılır.
  const t = inputs.final_status_utc || inputs.triggered_at_utc || "";

  if (st === "CANCELED" || st === "CANCELLED") {
    return `${t} UTC+0 = This is the date and time the order was **cancelled**.`;
  } else if (st === "EXECUTED") {
    return `${t} UTC+0 = This is the date and time your order **executed**.`;
  } else if (st === "TRIGGERED") {
     // Bu 'Stop-Limit' için 'Triggered At' ile çakışmayacak,
     // çünkü 'Stop-Limit' 'final_status_utc' kullanır.
    return `${t} UTC+0 = This is the date and time the order was **triggered**.`;
  } else if (st === "OPEN") {
    return `${t} UTC+0 = Current status: **OPEN** (order still active).`;
  } else if (st === "EXPIRED") {
     return `${t} UTC+0 = This is the date and time the order **expired**.`;
  }

  return `${t} UTC+0 = Status: **${st || "N/A"}**.`;
}

/**
 * Truncate a raw numeric string to given pricePrecision WITHOUT rounding.
 * Logs input/output for debugging.
 */
export function truncateToPrecision(raw, prec) {
  console.log("[truncateToPrecision] input:", raw, "prec:", prec);
  if (raw === null || raw === undefined) return "N/A";
  const s = String(raw);
  const [intPart, decPart = ""] = s.split(".");
  if (prec <= 0) {
    console.log("[truncateToPrecision] output:", intPart);
    return intPart;
  }
  const sliced = decPart.slice(0, prec);
  const out = sliced ? `${intPart}.${sliced}` : intPart;
  console.log("[truncateToPrecision] output:", out);
  return out;
}
