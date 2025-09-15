// src/macros/helpers.js

export function fmtNum(v, digits = 8) {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(digits) : String(v);
}

export function upper(s) {
  return (s || "").toString().trim().toUpperCase();
}

export function statusLineFriendly(inputs) {
  const st = upper(inputs.status);
  const t = inputs.triggered_at_utc || "";
  if (st === "CANCELED" || st === "CANCELLED") {
    return `${t} UTC+0 = This is the date and time you **cancelled** the order.`;
  } else if (st === "EXECUTED") {
    return `${t} UTC+0 = This is the date and time your order **executed**.`;
  } else if (st === "TRIGGERED") {
    return `${t} UTC+0 = This is the date and time the order was **triggered**.`;
  } else if (st === "OPEN") {
    return `${t} UTC+0 = Current status: **OPEN** (order still active).`;
  }
  return `${t} UTC+0 = Status: **${st || "N/A"}**.`;
}
