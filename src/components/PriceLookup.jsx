import React, { useState } from "react";
import { getTriggerMinuteCandles, getRangeHighLow } from "../pricing";

export default function PriceLookup() {
  const [symbol, setSymbol] = useState("ETHUSDT");
  const [singleTime, setSingleTime] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [result, setResult] = useState(null);
  const [rangeResult, setRangeResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSingleLookup() {
    if (!singleTime) {
      setResult(null);
      return;
    }
    setLoading(true);
    try {
      const { mark, last } = await getTriggerMinuteCandles(symbol, singleTime);
      setResult({
        time: singleTime,
        mark: `Opening: ${mark?.open ?? "N/A"}\nHighest: ${mark?.high ?? "N/A"}\nLowest: ${mark?.low ?? "N/A"}\nClosing: ${mark?.close ?? "N/A"}`,
        last: `Opening: ${last?.open ?? "N/A"}\nHighest: ${last?.high ?? "N/A"}\nLowest: ${last?.low ?? "N/A"}\nClosing: ${last?.close ?? "N/A"}`
      });
    } catch (e) {
      setResult({
        time: singleTime,
        mark: "Error fetching Mark Price",
        last: "Error fetching Last Price"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRangeLookup() {
    if (!rangeFrom || !rangeTo) {
      setRangeResult("");
      return;
    }
    setLoading(true);
    try {
      const res = await getRangeHighLow(symbol, rangeFrom, rangeTo);
      setRangeResult(res);
    } catch (e) {
      setRangeResult("Error fetching range data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <h2>Price Lookup Tool</h2>

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
          <label className="label">Date/Time (UTC, YYYY-MM-DD HH:MM:SS)</label>
          <input
            className="input"
            value={singleTime}
            onChange={(e) => setSingleTime(e.target.value)}
          />
        </div>
      </div>

      <button className="btn" onClick={handleSingleLookup} disabled={loading}>
        {loading ? "Loading..." : "Lookup Single Minute"}
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <p>
            {result.time} UTC+0 = At this date and time, the Mark Price and Last Price details are:
          </p>
          <div className="price-box mark">
            <h4>Mark Price</h4>
            <div>{result.mark}</div>
          </div>
          <div className="price-box last">
            <h4>Last Price</h4>
            <div>{result.last}</div>
          </div>
        </div>
      )}

      <div className="hr" />

      <h3>Range High/Low</h3>
      <div className="grid">
        <div className="col-6">
          <label className="label">From (UTC)</label>
          <input
            className="input"
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
          />
        </div>
        <div className="col-6">
          <label className="label">To (UTC)</label>
          <input
            className="input"
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
          />
        </div>
      </div>

      <button className="btn" onClick={handleRangeLookup} disabled={loading}>
        {loading ? "Loading..." : "Lookup Range"}
      </button>

      {rangeResult && (
        <div style={{ marginTop: 20 }}>
          <pre className="price-box">{rangeResult}</pre>
        </div>
      )}
    </div>
  );
}
