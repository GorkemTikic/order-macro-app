import React, { useState } from "react";
import { getTriggerMinuteCandles, getRangeHighLow } from "../pricing";

export default function PriceLookup() {
  const [symbol, setSymbol] = useState("ETHUSDT");
  const [singleTime, setSingleTime] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [rangeResult, setRangeResult] = useState(null);

  async function handleSingleLookup() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      if (!symbol || !singleTime) throw new Error("Symbol and Date/Time required");

      const { mark, last } = await getTriggerMinuteCandles(symbol, singleTime);
      setResult({
        symbol,
        time: singleTime,
        mark,
        last,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRangeLookup() {
    setLoading(true);
    setError("");
    setRangeResult(null);
    try {
      if (!symbol || !rangeFrom || !rangeTo)
        throw new Error("Symbol and From/To required");

      const data = await getRangeHighLow(symbol, rangeFrom, rangeTo);
      setRangeResult({ symbol, from: rangeFrom, to: rangeTo, ...data });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 20 }}>
      <h2 style={{ marginBottom: 12 }}>Price Lookup Tool</h2>

      {/* --- Single Time Lookup --- */}
      <div className="grid">
        <div className="col-4">
          <label className="label">Symbol</label>
          <input
            className="input"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="ETHUSDT"
          />
        </div>
        <div className="col-8">
          <label className="label">Date/Time (UTC, YYYY-MM-DD HH:MM:SS)</label>
          <input
            className="input"
            value={singleTime}
            onChange={(e) => setSingleTime(e.target.value)}
            placeholder="2025-09-11 12:30:18"
          />
        </div>
        <div className="col-12">
          <button className="btn" onClick={handleSingleLookup} disabled={loading}>
            {loading ? "Loading..." : "Lookup Single Minute"}
          </button>
        </div>
      </div>

      {result && (
        <div className="grid" style={{ marginTop: 20 }}>
          <div className="col-12">
            <h3>
              {result.time} UTC+0 = At this date and time, the Mark Price and Last
              Price details are:
            </h3>

            <div className="price-box mark">
              <h3>Mark Price</h3>
              <p>Opening: {result.mark?.open ?? "N/A"}</p>
              <p>Highest: {result.mark?.high ?? "N/A"}</p>
              <p>Lowest: {result.mark?.low ?? "N/A"}</p>
              <p>Closing: {result.mark?.close ?? "N/A"}</p>
            </div>

            <div className="price-box last">
              <h3>Last Price</h3>
              <p>Opening: {result.last?.open ?? "N/A"}</p>
              <p>Highest: {result.last?.high ?? "N/A"}</p>
              <p>Lowest: {result.last?.low ?? "N/A"}</p>
              <p>Closing: {result.last?.close ?? "N/A"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="hr" />

      {/* --- Range Lookup --- */}
      <h3>Range High/Low</h3>
      <div className="grid">
        <div className="col-6">
          <label className="label">From (UTC)</label>
          <input
            className="input"
            value={rangeFrom}
            onChange={(e) => setRangeFrom(e.target.value)}
            placeholder="2025-09-11 06:53:08"
          />
        </div>
        <div className="col-6">
          <label className="label">To (UTC)</label>
          <input
            className="input"
            value={rangeTo}
            onChange={(e) => setRangeTo(e.target.value)}
            placeholder="2025-09-11 12:30:18"
          />
        </div>
        <div className="col-12">
          <button className="btn" onClick={handleRangeLookup} disabled={loading}>
            {loading ? "Loading..." : "Lookup Range"}
          </button>
        </div>
      </div>

      {rangeResult && (
        <div className="grid" style={{ marginTop: 20 }}>
          <div className="col-12">
            <h3>
              When we check the {rangeResult.symbol} Price Chart <br />
              From: {rangeResult.from} To: {rangeResult.to}
            </h3>

            <div className="price-box mark">
              <h3>Mark Price</h3>
              <p>
                {rangeResult.markHighTime} = Highest Mark Price{" "}
                {rangeResult.markHigh}
              </p>
              <p>
                {rangeResult.markLowTime} = Lowest Mark Price {rangeResult.markLow}
              </p>
            </div>

            <div className="price-box last">
              <h3>Last Price</h3>
              <p>
                {rangeResult.lastHighTime} = Highest Last Price{" "}
                {rangeResult.lastHigh}
              </p>
              <p>
                {rangeResult.lastLowTime} = Lowest Last Price{" "}
                {rangeResult.lastLow}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && <div className="helper" style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
