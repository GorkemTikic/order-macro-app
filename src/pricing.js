// pricing.js
// Pure frontend: fetch Mark/Last OHLC (1m) directly from Binance public API.

const BASE = "https://fapi.binance.com";
const PROXY = ""; 
// If your region/host blocks Binance or you hit CORS/451, set:
// const PROXY = "https://your-cors-proxy.example.com/";  // enterprise/internal recommended

const api = (path, params) => {
  const url = new URL((PROXY || "") + BASE + path);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
};

export function msMinuteStartUTC(utcStr) {
  // utcStr = "YYYY-MM-DD HH:MM:SS"
  const [date, time] = utcStr.trim().split(" ");
  const [Y, M, D] = date.split("-").map(Number);
  const [h, m, s] = time.split(":").map(Number);
  const ms = Date.UTC(Y, M - 1, D, h, m, 0);
  return ms;
}

async function fetchKline(path, symbol, openMs) {
  const url = api(path, {
    symbol: symbol.toUpperCase(),
    interval: "1m",
    startTime: String(openMs),
    limit: "1"
  });
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} – ${url}\n${t}`);
  }
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return null;
  const k = data[0];
  return {
    openTime: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    closeTime: k[6]
  };
}

export async function getTriggerMinuteCandles(symbol, triggeredAtUtc) {
  const openMs = msMinuteStartUTC(triggeredAtUtc);
  const [mark, last] = await Promise.all([
    fetchKline("/fapi/v1/markPriceKlines", symbol, openMs),
    fetchKline("/fapi/v1/klines", symbol, openMs)
  ]);
  return { mark, last, openMs };
}

export async function getRangeHiLo(symbol, placedAtUtc, triggeredAtUtc) {
  // Optional: could be added later; keeping minimal to avoid heavy calls on client.
  return null;
}
