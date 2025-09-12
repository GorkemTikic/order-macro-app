import React, { useState } from "react";
import { getTriggerMinuteCandles, getRangeCandles } from "../pricing";

export default function PriceLookup() {
  const [symbol, setSymbol] = useState("ETHUSDT");
  const [singleTime, setSingleTime] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function handleSingleLookup() {
    if (!singleTime) {
      setResult("Please enter a date/time.");
      return;
    }
    setLoading(true);
    try {
      const { mark, last } = await getTriggerMinuteCandles(symbol, singleTime);
      const msg = `
${singleTime} UTC+0 = At this date and time, the Mark Price and Last Price details are:

**Mark Price**
Opening: ${mark?.open ?? "N/A"}
Highest: ${mark?.high ?? "N/A"}
Lowest: ${mark?.low ?? "N/A"}
Closing: ${mark?.close ?? "N/A"}

**Last Price**
Opening: ${last?.open ?? "N/A"}
Highest: ${last?.high ?? "N/A"}
Lowest: ${last?.low ?? "N/A"}
Closing: ${last?.close ?? "N/A"}
      `;
      setResult(msg.trim());
    } catch (e) {
      setResult("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRangeLookup() {
    if (!rangeStart || !rangeEnd) {
      setResult("Please enter start and end datetime.");
      return;
    }
    setLoading(true);
    try {
      const { highest, lowest } = await getRangeCandles(
        symbol,
        rangeStart,
        rangeEnd
      );
      const msg = `
When we check the ${symbol} Price Chart

From: ${rangeStart}
To: ${rangeEnd}

${highest.mark.time} > At this date and time, the highest Mark Price ${highest.mark.value} was reached.
${highest.last.time} > At this date and time, the highest Last Price ${highest.last.value} was reached.

${lowest.mark.time} > At this date and time, the lowest Mark Price ${lowest.mark.value} was reached.
${lowest.last.time} > At this date and time, the lowest Last Price ${lowest.last.value} was reached.
      `;
      setResult(msg.trim());
    } catch (e) {
      setResult("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <h2 style={{ marginBottom: 12 }}>Price Lookup Tool</h2>

      {/* Header */}
      <div className="lookup-header">
        <div className="field">
          <label className="label">Symbol</label>
          <input
            className="input"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="ETHUSDT"
          />
        </div>
        <div className="field">
          <label className="label">Date/Time (UTC, YYYY-MM-DD HH:MM:SS)</label>
          <input
            className="input"
            value={singleTime}
            onChange={(e) => setSingleTime(e.target.value)}
            placeholder="2025-09-11 12:30:18"
          />
        </div>
      </div>

      <div className="lookup-actions">
        <button
          className="btn"
          onClick={handleSingleLookup}
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Loading..." : "Lookup Single Minute"}
        </button>
      </div>

      <div className="hr" />

      {/* Range Lookup */}
      <h3 style={{ marginBottom: 10 }}>Range High/Low</h3>
      <div className="lookup-header">
        <div className="field">
          <label className="label">From (UTC)</label>
          <input
            className="input"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            placeholder="2025-09-11 06:53:08"
          />
        </div>
        <div className="field">
          <label className="label">To (UTC)</label>
          <input
            className="input"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            placeholder="2025-09-11 12:30:18"
          />
        </div>
      </div>

      <div className="lookup-actions">
        <button
          className="btn"
          onClick={handleRangeLookup}
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Loading..." : "Lookup Range"}
        </button>
      </div>

      <div className="hr" />

      {/* Result */}
      <label className="label">Result</label>
      <textarea className="textarea" value={result} readOnly />
    </div>
  );
}
