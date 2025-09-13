// src/pricing.js

// Eğer CORS hatası alırsan buraya kendi proxy adresini yazabilirsin
export const PROXY = "";

/**
 * Helper: dakika başlangıcı UTC ms
 */
export function msMinuteStartUTC(tsStr) {
  const d = new Date(tsStr + "Z");
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    0,
    0
  );
}

/**
 * Helper: format UTC datetime as YYYY-MM-DD HH:mm:ss UTC+0
 */
function fmtUTC(ms) {
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate()
  )} ${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC+0`;
}

/**
 * Tek bir dakikanın hem Mark hem de Last Price 1m mumunu çek
 */
export async function getTriggerMinuteCandles(symbol, triggeredAtStr) {
  const start = msMinuteStartUTC(triggeredAtStr);
  const end = start + 60 * 1000;

  // Mark Price candle
  const markUrl = `${PROXY}https://fapi.binance.com/fapi/v1/markPriceKlines?symbol=${symbol}&interval=1m&startTime=${start}&endTime=${end}`;
  const markRes = await fetch(markUrl);
  if (!markRes.ok) throw new Error(`Failed to fetch Mark Price candle`);
  const markJson = await markRes.json();

  // Last Price candle
  const lastUrl = `${PROXY}https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&startTime=${start}&endTime=${end}`;
  const lastRes = await fetch(lastUrl);
  if (!lastRes.ok) throw new Error(`Failed to fetch Last Price candle`);
  const lastJson = await lastRes.json();

  const parseCandle = (c) =>
    !c
      ? null
      : {
          open: parseFloat(c[1]),
          high: parseFloat(c[2]),
          low: parseFloat(c[3]),
          close: parseFloat(c[4]),
        };

  return {
    mark: markJson.length ? parseCandle(markJson[0]) : null,
    last: lastJson.length ? parseCandle(lastJson[0]) : null,
  };
}

/**
 * Belirli aralıkta high/low (Mark + Last)
 */
export async function getRangeHighLow(symbol, fromStr, toStr) {
  const start = Date.parse(fromStr + "Z");
  const end = Date.parse(toStr + "Z");
  if (isNaN(start) || isNaN(end)) throw new Error("Invalid date format.");

  // Mark Price candles
  const markUrl = `${PROXY}https://fapi.binance.com/fapi/v1/markPriceKlines?symbol=${symbol}&interval=1m&startTime=${start}&endTime=${end}`;
  const markRes = await fetch(markUrl);
  if (!markRes.ok) throw new Error("Failed to fetch mark price data");
  const markCandles = await markRes.json();

  // Last Price candles
  const lastUrl = `${PROXY}https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&startTime=${start}&endTime=${end}`;
  const lastRes = await fetch(lastUrl);
  if (!lastRes.ok) throw new Error("Failed to fetch last price data");
  const lastCandles = await lastRes.json();

  if (!markCandles.length && !lastCandles.length) return null;

  // 🔹 Mark Price high/low
  let markHigh, markLow, markHighTime, markLowTime;
  if (markCandles.length) {
    const highs = markCandles.map((c) => parseFloat(c[2]));
    const lows = markCandles.map((c) => parseFloat(c[3]));
    markHigh = Math.max(...highs);
    markLow = Math.min(...lows);
    markHighTime = fmtUTC(markCandles[highs.indexOf(markHigh)][0]);
    markLowTime = fmtUTC(markCandles[lows.indexOf(markLow)][0]);
  }

  // 🔹 Last Price high/low
  let lastHigh, lastLow, lastHighTime, lastLowTime;
  if (lastCandles.length) {
    const highs = lastCandles.map((c) => parseFloat(c[2]));
    const lows = lastCandles.map((c) => parseFloat(c[3]));
    lastHigh = Math.max(...highs);
    lastLow = Math.min(...lows);
    lastHighTime = fmtUTC(lastCandles[highs.indexOf(lastHigh)][0]);
    lastLowTime = fmtUTC(lastCandles[lows.indexOf(lastLow)][0]);
  }

  return {
    mark: {
      high: markHigh,
      low: markLow,
      highTime: markHighTime,
      lowTime: markLowTime,
    },
    last: {
      high: lastHigh,
      low: lastLow,
      highTime: lastHighTime,
      lowTime: lastLowTime,
    },
  };
}

/**
 * Last Price OHLC for a single second (via aggTrades, max 7 gün)
 */
export async function getLastPriceAtSecond(symbol, atStr) {
  const start = Date.parse(atStr + "Z");
  if (isNaN(start)) throw new Error("Invalid date format.");
  const end = start + 1000;

  const url = `${PROXY}https://fapi.binance.com/fapi/v1/aggTrades?symbol=${symbol}&startTime=${start}&endTime=${end}&limit=1000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch aggTrades for that second");
  const trades = await res.json();
  if (!trades.length) return null;

  const prices = trades.map((t) => parseFloat(t.p));
  return {
    open: prices[0],
    high: Math.max(...prices),
    low: Math.min(...prices),
    close: prices[prices.length - 1],
    count: trades.length,
  };
}
