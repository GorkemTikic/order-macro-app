// src/components/PriceLookup.jsx

import React, { useState } from "react";
import { getTriggerMinuteCandles, getLastPrice1s } from "../pricing";

export default function PriceLookup() {
  const [symbol, setSymbol] = useState("ETHUSDT");
  const [datetime, setDatetime] = useState("");
  const [mode, setMode] = useState("minute"); // minute | second | range
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function handleLookup() {
    setError(""); 
    setResult("");

    if (mode === "minute") {
      if (!datetime) return setError("Please enter a datetime.");
      try {
        const { mark, last } = await getTriggerMinuteCandles(symbol, datetime);
        if (!mark && !last) {
          setResult("No data found for that minute.");
        } else {
          const msg = `${datetime} UTC+0 = At this date and time, the Mark Price and Last Price details are:\n
**Mark Price:**\nOpening: ${mark?.open ?? "N/A"}\nHighest: ${mark?.high ?? "N/A"}\nLowest: ${mark?.low ?? "N/A"}\nClosing: ${mark?.close ?? "N/A"}\n
**Last Price:**\nOpening: ${last?.open ?? "N/A"}\nHighest: ${last?.high ?? "N/A"}\nLowest: ${last?.low ?? "N/A"}\nClosing: ${last?.close ?? "N/A"}`;
          setResult(msg);
        }
      } catch (err) {
        setError(err.message);
      }
    } 
    else if (mode === "second") {
      if (!datetime) return setError("Please enter a datetime.");
      try {
        const data = await getLastPrice1s(symbol, datetime);
        if (!data) {
          setResult("No trade data found for that second.");
        } else {
          const msg = `${datetime} UTC+0 = At this date and time, the Last Price details (1s) are:\n
**Last Price (1s):**\nOpening: ${data.open}\nHighest: ${data.high}\nLowest: ${data.low}\nClosing: ${data.close}\n(from ${data.count} trades)`;
          setResult(msg);
        }
      } catch (err) {
        if (err.message.includes("7 days")) {
          setError("⚠️ 1-second data is only available for the last 7 days.");
        } else {
          setError(err.message);
        }
      }
    } 
    else if (mode === "range") {
      if (!from || !to) return setError("Please enter both From and To.");
      try {
        const start = Date.parse(from + "Z");
        const end = Date.parse(to + "Z");
        if (isNaN(start) || isNaN(end)) throw new Error("Invalid date format.");
        const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&startTime=${start}&endTime=${end}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch range data");
        const candles = await res.json();
        if (!candles.length) return setResult("No data found for range.");

        const highs = candles.map(c => parseFloat(c[2]));
        const lows = candles.map(c => parseFloat(c[3]));
        const high = Math.max(...highs);
        const low = Math.min(...lows);
        const highTime = new Date(candles[highs.indexOf(high)][0]).toISOString();
        const lowTime = new Date(candles[lows.indexOf(low)][0]).toISOString();

        const msg = `When we check the ${symbol} Price Chart\n\nFrom: ${from}\nTo: ${to}\n\n` +
          `${highTime} > At this date and time, the highest Last Price ${high} was reached.\n` +
          `${lowTime} > At this date and time, the lowest Last Price ${low} was reached.`;

        setResult(msg);
      } catch (err) {
        setError(err.message);
      }
    }
  }

  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <h2 style={{ marginBottom: 12 }}>Price Lookup Tool</h2>
      <div className="grid">
        <div className="col-6">
          <label className="label">Symbol</label>
          <input
            className="input"
            value={symbol}
            onChange={e => setSymbol(e.target.value.toUpperCase())}
          />
        </div>
        <div className="col-6">
          <label className="label">Mode</label>
          <select
            className="select"
            value={mode}
            onChange={e => setMode(e.target.value)}
          >
            <option value="minute">Single Minute (Mark + Last)</option>
            <option value="second">Single Second (Last only, 7d)</option>
            <option value="range">Range (High/Low)</option>
          </select>
        </div>

        {mode === "minute" || mode === "second" ? (
          <div className="col-12">
            <label className="label">Datetime (UTC, YYYY-MM-DD HH:MM:SS)</label>
            <input
              className="input"
              value={datetime}
              onChange={e => setDatetime(e.target.value)}
              placeholder="2025-09-11 12:30:18"
            />
            {mode === "second" && (
              <div className="helper">⚠️ Only works for the last 7 days.</div>
            )}
          </div>
        ) : null}

        {mode === "range" && (
          <>
            <div className="col-6">
              <label className="label">From (UTC)</label>
              <input
                className="input"
                value={from}
                onChange={e => setFrom(e.target.value)}
                placeholder="2025-09-11 06:53:08"
              />
            </div>
            <div className="col-6">
              <label className="label">To (UTC)</label>
              <input
                className="input"
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="2025-09-11 12:30:18"
              />
            </div>
          </>
        )}

        <div className="col-12">
          <button className="btn" onClick={handleLookup}>Lookup</button>
        </div>
      </div>

      {error && (
        <div className="helper" style={{ color: "#ffb4b4", marginTop: 12 }}>
          {error}
        </div>
      )}

      {result && (
        <div className="col-12" style={{ marginTop: 12 }}>
          <label className="label">Result</label>
          <textarea className="textarea" value={result} readOnly />
        </div>
      )}
    </div>
  );
}
