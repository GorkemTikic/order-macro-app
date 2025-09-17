// src/components/FundingMacro.jsx
import React, { useState } from "react";
import { renderMacro } from "../macros";
import {
  getNearestFunding,
  getMarkPriceClose1m,
  getSymbolPrecision
} from "../pricing";

export default function FundingMacro() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [fundingTime, setFundingTime] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [fundingInterval, setFundingInterval] = useState("8"); // manual input
  const [mode, setMode] = useState("detailed"); // detailed / summary
  const [result, setResult] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setErr("");
    setResult("");
    setLoading(true);

    try {
      if (!symbol) throw new Error("Symbol is required.");
      if (!fundingTime) throw new Error("Funding Time is required.");
      if (!positionSize) throw new Error("Position Size is required.");
      if (!fundingInterval) throw new Error("Funding Interval (hours) is required.");

      // 1) Funding record → rate + (varsa) markPrice
      const rec = await getNearestFunding(symbol, fundingTime);
      if (!rec) throw new Error("No funding record found near that time.");

      const fundingRate = rec.funding_rate;
      let markPrice = rec.mark_price;
      let fundingTimeStr = rec.funding_time;

      // 2) Eğer markPrice yoksa fallback olarak 1m kapanışı al
      if (!markPrice) {
        const closeData = await getMarkPriceClose1m(symbol, rec.funding_time_ms);
        if (!closeData) throw new Error("Could not fetch mark price from 1m candles");
        markPrice = closeData.mark_price;
        fundingTimeStr = closeData.close_time;
      }

      // 3) Precision bilgilerini çek
      const { priceDp, qtyDp } = await getSymbolPrecision(symbol);

      // 4) Macro inputs
      const inputs = {
        symbol: symbol.toUpperCase(),
        funding_time: fundingTimeStr,
        funding_rate: fundingRate,
        mark_price: markPrice,
        position_size: positionSize,
        funding_interval: fundingInterval,
        price_dp: priceDp,
        qty_dp: qtyDp
      };

      const msg = renderMacro("funding_macro", inputs, {}, mode);
      setResult(msg);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
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

        <div className="col-12">
          <button
            className="btn secondary"
            id="funding-copy-btn"
            onClick={handleCopy}
            disabled={!result}
          >
            Copy
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
