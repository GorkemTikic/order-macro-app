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
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC+0`
  );
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

  if (!markCandles.length && !lastCandles.length) {
    return {
      mark: { high: "N/A", low: "N/A", highTime: "N/A", lowTime: "N/A" },
      last: { high: "N/A", low: "N/A", highTime: "N/A", lowTime: "N/A" },
    };
  }

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
      high: markHigh ?? "N/A",
      low: markLow ?? "N/A",
      highTime: markHighTime ?? "N/A",
      lowTime: markLowTime ?? "N/A",
    },
    last: {
      high: lastHigh ?? "N/A",
      low: lastLow ?? "N/A",
      highTime: lastHighTime ?? "N/A",
      lowTime: lastLowTime ?? "N/A",
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

/**
 * 📌 Funding Rate & Mark Price (yakın funding kaydı)
 */
export async function getNearestFunding(symbol, targetUtcStr) {
  const targetMs = Date.parse(targetUtcStr + "Z");
  if (isNaN(targetMs)) throw new Error("Invalid date format.");

  for (const windowMin of [10, 30, 90]) {
    const url = `${PROXY}https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol.toUpperCase()}&startTime=${targetMs - windowMin * 60_000}&endTime=${targetMs + windowMin * 60_000}&limit=1000`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch fundingRate");
    const rows = await res.json();
    if (rows && rows.length) {
      rows.sort(
        (a, b) =>
          Math.abs(parseInt(a.fundingTime) - targetMs) -
          Math.abs(parseInt(b.fundingTime) - targetMs)
      );
      const rec = rows[0];
      return {
        funding_time: fmtUTC(Number(rec.fundingTime)),
        funding_rate: parseFloat(rec.fundingRate),
        mark_price: rec.markPrice || null,
        funding_time_ms: Number(rec.fundingTime)
      };
    }
  }
  return null;
}

/**
 * 📌 Eğer funding kaydında markPrice yoksa 1m kapanışı al (fallback)
 */
export async function getMarkPriceClose1m(symbol, fundingTimeMs) {
  const startMinute = fundingTimeMs - (fundingTimeMs % 60_000);
  const candidates = [startMinute, startMinute - 60_000];
  for (const start of candidates) {
    const url = `${PROXY}https://fapi.binance.com/fapi/v1/markPriceKlines?symbol=${symbol.toUpperCase()}&interval=1m&startTime=${start}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      return {
        mark_price: parseFloat(data[0][4]),
        close_time: fmtUTC(Number(data[0][6]))
      };
    }
  }
  return null;
}

/**
 * 📌 Get ALL symbol → pricePrecision map
 */
let symbolPrecisionCache = null;

export async function getAllSymbolPrecisions() {
  if (symbolPrecisionCache) return symbolPrecisionCache;

  const url = `${PROXY}https://fapi.binance.com/fapi/v1/exchangeInfo`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch exchangeInfo");
  const data = await res.json();

  const map = {};
  for (const s of data.symbols) {
    map[s.symbol] = s.pricePrecision;
  }
  console.log("[getAllSymbolPrecisions] loaded", Object.keys(map).length, "symbols");
  symbolPrecisionCache = map;
  return map;
}
