// src/components/PriceLookup.jsx

import React, { useState } from "react";
import {
  getTriggerMinuteCandles,
  getRangeHighLow,
  getLastPriceAtSecond,
} from "../pricing";

function PriceLookup() {
  const [symbol, setSymbol] = useState("ETHUSDT");
  const [mode, setMode] = useState("trigger");
  const [at, setAt] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function handleLookup() {
    setResult("");
    setError("");

    try {
      if (mode === "trigger") {
        if (!at) return setError("Please enter a Triggered At timestamp.");
        const { mark, last } = await getTriggerMinuteCandles(symbol, at);
        if (!mark && !last) return setResult("No data found.");
        const msg =
          `${at} UTC+0 = At this date and time, the Mark Price and Last Price details are:\n\n` +
          `**Mark Price:**\nOpening: ${mark?.open ?? "N/A"}\nHighest: ${
            mark?.high ?? "N/A"
          }\nLowest: ${mark?.low ?? "N/A"}\nClosing: ${
            mark?.close ?? "N/A"
          }\n\n` +
          `**Last Price:**\nOpening: ${last?.open ?? "N/A"}\nHighest: ${
            last?.high ?? "N/A"
          }\nLowest: ${last?.low ?? "N/A"}\nClosing: ${
            last?.close ?? "N/A"
          }`;
        setResult(msg);
      } else if (mode === "range") {
        if (!from || !to) return setError("Please enter both From and To.");
        const range = await getRangeHighLow(symbol, from, to);
        if (!range) return setResult("No data found for range.");
        const msg =
          `When we check the ${symbol} Price Chart\n\nFrom: ${from}\nTo: ${to}\n\n` +
          `${range.mark.highTime} > At this date and time, the highest Mark Price ${range.mark.high} was reached.\n` +
          `${range.last.highTime} > At this date and time, the highest Last Price ${range.last.high} was reached.\n\n` +
          `${range.mark.lowTime} > At this date and time, the lowest Mark Price ${range.mark.low} was reached.\n` +
          `${range.last.lowTime} > At this date and time, the lowest Last Price ${range.last.low} was reached.\n\n` +
          `**Mark Price Change (High→Low):** ${range.mark.changePct}\n` +
          `**Last Price Change (High→Low):** ${range.last.changePct}`;
        setResult(msg);
      } else if (mode === "last1s") {
        if (!at) return setError("Please enter a DateTime (UTC).");
        const ohlc = await getLastPriceAtSecond(symbol, at);
        if (!ohlc)
          return setResult("No trade data found for that second (Last Price).");
        const msg =
          `${at} UTC+0 = At this date and time, the Last Price details are:\n\n` +
          `**Opening:** ${ohlc.open}\nHighest: ${ohlc.high}\nLowest: ${ohlc.low}\nClosing: ${ohlc.close}\n` +
          `(based on ${ohlc.count} trades in that second)`;
        setResult(msg);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="panel">
      <h3>Price Lookup Tool</h3>
      <div className="grid">
        <div className="col-6">
          <label className="label">Symbol</label>
          <input
            className="input"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
        </div>

        <div className="col-6">
          <label className="label">Mode</label>
          <select
            className="select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="trigger">Trigger Minute (Mark+Last)</option>
            <option value="range">Range (High/Low)</option>
            <option value="last1s">Last Price 1s (max 7d)</option>
          </select>
        </div>

        {mode === "trigger" && (
          <div className="col-12">
            <label className="label">At (UTC)</label>
            <input
              className="input"
              placeholder="YYYY-MM-DD HH:MM:SS"
              value={at}
              onChange={(e) => setAt(e.target.value)}
            />
          </div>
        )}

        {mode === "range" && (
          <>
            <div className="col-6">
              <label className="label">From (UTC)</label>
              <input
                className="input"
                placeholder="YYYY-MM-DD HH:MM:SS"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="col-6">
              <label className="label">To (UTC)</label>
              <input
                className="input"
                placeholder="YYYY-MM-DD HH:MM:SS"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </>
        )}

        {mode === "last1s" && (
          <div className="col-12">
            <label className="label">DateTime (UTC)</label>
            <input
              className="input"
              placeholder="YYYY-MM-DD HH:MM:SS"
              value={at}
              onChange={(e) => setAt(e.target.value)}
            />
          </div>
        )}

        <div className="col-12">
          <button className="btn" onClick={handleLookup}>
            Lookup
          </button>
        </div>
      </div>

      {error && (
        <div className="helper" style={{ color: "#ff6b6b" }}>
          Error: {error}
        </div>
      )}
      {result && (
        <div style={{ marginTop: 12 }}>
          <label className="label">Result</label>
          <textarea className="textarea" value={result} readOnly />
        </div>
      )}
    </div>
  );
}

export default PriceLookup;
