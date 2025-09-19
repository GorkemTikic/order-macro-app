// src/components/FundingMacro.jsx
import React, { useState } from "react";
import { renderMacro } from "../macros";
import {
  getNearestFunding,
  getMarkPriceClose1m,
  getAllSymbolPrecisions
} from "../pricing";
import { truncateToPrecision } from "../macros/helpers.js";

export default function FundingMacro() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [fundingTime, setFundingTime] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [fundingInterval, setFundingInterval] = useState("8");
  const [mode, setMode] = useState("detailed");
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [rawMarkPrice, setRawMarkPrice] = useState(null);
  const [lastInputs, setLastInputs] = useState(null);

  async function handleGenerate() {
    setErr("");
    setResult("");
    setLoading(true);

    try {
      if (!symbol) throw new Error("Symbol is required.");
      if (!fundingTime) throw new Error("Funding Time is required.");
      if (!positionSize) throw new Error("Position Size is required.");
      if (!fundingInterval) throw new Error("Funding Interval (hours) is required.");

      const rec = await getNearestFunding(symbol, fundingTime);
      if (!rec) throw new Error("No funding record found near that time.");

      const fundingRate = rec.funding_rate;
      let markPrice = rec.mark_price;
      let fundingTimeStr = rec.funding_time;

      if (!markPrice) {
        const closeData = await getMarkPriceClose1m(symbol, rec.funding_time_ms);
        if (!closeData) throw new Error("Could not fetch mark price from 1m candles");
        markPrice = String(closeData.mark_price);
        fundingTimeStr = closeData.close_time;
      }

      console.log("[Generate] rawMarkPrice:", markPrice);

      const inputs = {
        symbol: symbol.toUpperCase(),
        funding_time: fundingTimeStr,
        funding_rate: fundingRate,
        mark_price: markPrice,
        position_size: positionSize,
        funding_interval: fundingInterval,
        price_dp: 0,
        qty_dp: 0
      };

      const msg = renderMacro("funding_macro", inputs, {}, mode);
      setResult(msg);
      setRawMarkPrice(markPrice);
      setLastInputs(inputs);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyPrecision() {
    try {
      if (!lastInputs || rawMarkPrice == null) {
        throw new Error("Please generate the macro first.");
      }
      const allPrecisions = await getAllSymbolPrecisions();
      const pricePrecision = allPrecisions[lastInputs.symbol] || 2;

      console.log("[ApplyPrecision]", lastInputs.symbol, "raw:", rawMarkPrice, "pricePrecision:", pricePrecision);

      const truncated = truncateToPrecision(rawMarkPrice, pricePrecision);

      const inputs2 = { ...lastInputs, mark_price: truncated };
      const msg2 = renderMacro("funding_macro", inputs2, {}, mode);

      setResult(msg2);
      setLastInputs(inputs2);
    } catch (e) {
      setErr(e.message || String(e));
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    const btn = document.getElementById("funding-copy-btn");
    const old = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = old), 1500);
  }

  return (
    <div className="panel">
      <h3>💰 Funding Macro</h3>
      <div className="grid">
        <div className="col-6">
          <label className="label">Symbol</label>
          <input
            className="input"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="BTCUSDT"
          />
        </div>

        <div className="col-6">
          <label className="label">Funding Time (UTC)</label>
          <input
            className="input"
            placeholder="YYYY-MM-DD HH:MM:SS"
            value={fundingTime}
            onChange={(e) => setFundingTime(e.target.value)}
          />
        </div>

        <div className="col-6">
          <label className="label">Position Size</label>
          <input
            className="input"
            placeholder="e.g. 0.05"
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value)}
          />
        </div>

        <div className="col-6">
          <label className="label">Funding Interval (hours)</label>
          <input
            className="input"
            placeholder="e.g. 1, 2, 4, 8"
            value={fundingInterval}
            onChange={(e) => setFundingInterval(e.target.value)}
          />
        </div>

        <div className="col-6">
          <label className="label">Output Mode</label>
          <select
            className="select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="detailed">Detailed</option>
            <option value="summary">Summary</option>
          </select>
        </div>

        <div className="col-12" style={{ marginTop: 12 }}>
          <button className="btn" onClick={handleGenerate} disabled={loading}>
            {loading ? "Loading..." : "✨ Generate Funding Macro"}
          </button>
        </div>

        <div className="col-12" style={{ display: "flex", gap: 10 }}>
          <button
            className="btn secondary"
            id="funding-copy-btn"
            onClick={handleCopy}
            disabled={!result}
          >
            Copy
          </button>

          <button
            className="btn secondary"
            onClick={handleApplyPrecision}
            disabled={!result}
            title="Apply exchangeInfo.pricePrecision (truncate, no rounding)"
          >
            Apply Precision
          </button>
        </div>
      </div>

      {err && (
        <div className="helper" style={{ color: "#ff6b6b", marginTop: 10 }}>
          <strong>Error:</strong> {err}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <label className="label">Generated Funding Macro</label>
          <textarea className="textarea" rows="14" value={result} readOnly />
        </div>
      )}
    </div>
  );
}
