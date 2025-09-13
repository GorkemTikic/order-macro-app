// src/pricing.js

const PROXY = ""; // Eğer CORS sorunu yaşarsan buraya bir proxy adresi ekleyebilirsin

// Binance Futures: Mark Price (1m OHLC)
export async function fetchMarkPriceCandles(symbol, startTime, endTime) {
  const url = `${PROXY}https://fapi.binance.com/fapi/v1/markPriceKlines?symbol=${symbol}&interval=1m&startTime=${startTime}&endTime=${endTime}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`markPriceKlines fetch failed ${res.status}`);
  const data = await res.json();
  if (!data.length) return null;
  return {
    open: parseFloat(data[0][1]),
    high: parseFloat(data[0][2]),
    low: parseFloat(data[0][3]),
    close: parseFloat(data[0][4])
  };
}

// Binance Futures: Last Price (1m OHLC)
export async function fetchLastPriceCandles(symbol, startTime, endTime) {
  const url = `${PROXY}https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&startTime=${startTime}&endTime=${endTime}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`klines fetch failed ${res.status}`);
  const data = await res.json();
  if (!data.length) return null;
  return {
    open: parseFloat(data[0][1]),
    high: parseFloat(data[0][2]),
    low: parseFloat(data[0][3]),
    close: parseFloat(data[0][4])
  };
}

// 1 dakikalık Mark & Last Price birlikte
export async function getTriggerMinuteCandles(symbol, datetimeStr) {
  const t = Date.parse(datetimeStr + "Z");
  if (isNaN(t)) throw new Error("Invalid datetime: " + datetimeStr);
  const start = msMinuteStartUTC(datetimeStr);
  const end = start + 60 * 1000;

  const [mark, last] = await Promise.all([
    fetchMarkPriceCandles(symbol, start, end),
    fetchLastPriceCandles(symbol, start, end)
  ]);
  return { mark, last };
}

// 🔹 Yeni: 1 saniyelik Last Price OHLC (aggTrades ile, sadece son 7 gün için)
export async function getLastPrice1s(symbol, datetimeStr) {
  const start = Date.parse(datetimeStr + "Z");
  const now = Date.now();

  // 7 gün kontrolü
  if (now - start > 7 * 24 * 60 * 60 * 1000) {
    throw new Error("This feature only works for the last 7 days.");
  }

  const end = start + 1000; // 1 saniye sonrası
  const url = `${PROXY}https://fapi.binance.com/fapi/v1/aggTrades?symbol=${symbol}&startTime=${start}&endTime=${end}&limit=1000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`aggTrades fetch failed ${res.status}`);
  const trades = await res.json();

  if (!trades.length) return null;

  const prices = trades.map(t => parseFloat(t.p));
  return {
    open: prices[0],
    high: Math.max(...prices),
    low: Math.min(...prices),
    close: prices[prices.length - 1],
    count: trades.length
  };
}

// Zamanı UTC minute başlangıcına oturtur
export function msMinuteStartUTC(datetimeStr) {
  const d = new Date(datetimeStr + "Z");
  d.setUTCSeconds(0, 0);
  return d.getTime();
}
