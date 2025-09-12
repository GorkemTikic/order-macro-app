const PROXY = ""; // CORS sorunu olursa buraya kendi proxy URL’ni koy

// Timestamp'i UTC dakikasının başlangıcına yuvarlar
export function msMinuteStartUTC(datetimeStr) {
  const ms = Date.parse(datetimeStr + "Z"); // UTC parse
  return Math.floor(ms / 60000) * 60000;
}

// Belirli dakikanın Mark ve Last OHLC'sini al
export async function getTriggerMinuteCandles(symbol, datetimeStr) {
  const msStart = msMinuteStartUTC(datetimeStr);
  const startTime = msStart;

  // Mark Price Candle
  const markUrl = `${PROXY}https://fapi.binance.com/fapi/v1/markPriceKlines?symbol=${symbol}&interval=1m&startTime=${startTime}&limit=1`;
  const lastUrl = `${PROXY}https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&startTime=${startTime}&limit=1`;

  const [markRes, lastRes] = await Promise.all([
    fetch(markUrl),
    fetch(lastUrl)
  ]);

  if (!markRes.ok) throw new Error(`MarkPrice fetch failed ${markRes.status}`);
  if (!lastRes.ok) throw new Error(`LastPrice fetch failed ${lastRes.status}`);

  const markJson = await markRes.json();
  const lastJson = await lastRes.json();

  const parseCandle = (arr) => arr && arr.length
    ? {
        open: parseFloat(arr[0][1]),
        high: parseFloat(arr[0][2]),
        low: parseFloat(arr[0][3]),
        close: parseFloat(arr[0][4])
      }
    : null;

  return {
    mark: parseCandle(markJson),
    last: parseCandle(lastJson)
  };
}

// Belirli tarih aralığında en yüksek / en düşük Mark ve Last Price’ları al
export async function getRangeHighLow(symbol, fromStr, toStr) {
  const from = msMinuteStartUTC(fromStr);
  const to = msMinuteStartUTC(toStr);

  const markUrl = `${PROXY}https://fapi.binance.com/fapi/v1/markPriceKlines?symbol=${symbol}&interval=1m&startTime=${from}&endTime=${to}`;
  const lastUrl = `${PROXY}https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&startTime=${from}&endTime=${to}`;

  const [markRes, lastRes] = await Promise.all([
    fetch(markUrl),
    fetch(lastUrl)
  ]);

  if (!markRes.ok) throw new Error(`MarkPrice fetch failed ${markRes.status}`);
  if (!lastRes.ok) throw new Error(`LastPrice fetch failed ${lastRes.status}`);

  const markJson = await markRes.json();
  const lastJson = await lastRes.json();

  function analyze(candles) {
    if (!candles || !candles.length) return { highest: null, lowest: null };
    let highest = { price: -Infinity, time: "" };
    let lowest = { price: Infinity, time: "" };
    for (const c of candles) {
      const high = parseFloat(c[2]);
      const low = parseFloat(c[3]);
      const time = new Date(c[0]).toISOString().replace("T", " ").slice(0,19);
      if (high > highest.price) highest = { price: high, time };
      if (low < lowest.price) lowest = { price: low, time };
    }
    return { highest, lowest };
  }

  const markStats = analyze(markJson);
  const lastStats = analyze(lastJson);

  return {
    highestMark: markStats.highest,
    lowestMark: markStats.lowest,
    highestLast: lastStats.highest,
    lowestLast: lastStats.lowest
  };
}

// 🔹 Yeni: 1 saniyelik Last Price OHLC (aggTrades ile)
export async function getLastPrice1s(symbol, datetimeStr) {
  const start = Date.parse(datetimeStr + "Z"); // UTC timestamp
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
