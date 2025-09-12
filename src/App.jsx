import React, { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import { listMacros, renderMacro } from "./macros";
import { getTriggerMinuteCandles, msMinuteStartUTC } from "./pricing";
import PriceLookup from "./components/PriceLookup";

const initialInputs = {
  order_id: "",
  symbol: "ETHUSDT",
  trigger_type: "MARK",
  trigger_price: "",
  executed_price: "",
  placed_at_utc: "",
  triggered_at_utc: ""
};

export default function App() {
  const [macros, setMacros] = useState([]);
  const [macroId, setMacroId] = useState("");
  const [inputs, setInputs] = useState(initialInputs);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const outRef = useRef(null);

  useEffect(() => {
    setMacros(listMacros());
  }, []);

  useEffect(() => {
    if (macros.length && !macroId) {
      setMacroId(macros[0].id);
    }
  }, [macros, macroId]);

  const activeMacro = useMemo(
    () => macros.find((m) => m.id === macroId),
    [macros, macroId]
  );

  const onChange = (k, v) => setInputs((prev) => ({ ...prev, [k]: v }));

  async function handleGenerate() {
    setLoading(true);
    setErr("");
    setResult("");

    try {
      if (!activeMacro) throw new Error("Select a macro.");
      if (!inputs.symbol) throw new Error("Symbol is required.");
      if (!inputs.triggered_at_utc)
        throw new Error(
          "Triggered At (UTC) is required. Format: YYYY-MM-DD HH:MM:SS"
        );

      // pull candles
      const { mark, last } = await getTriggerMinuteCandles(
        inputs.symbol,
        inputs.triggered_at_utc
      );
      const tMinute = new Date(
        msMinuteStartUTC(inputs.triggered_at_utc)
      )
        .toISOString()
        .slice(0, 16)
        .replace("T", " ");

      const prices = {
        triggered_minute: tMinute,
        mark_open: mark ? mark.open.toFixed(8) : "N/A",
        mark_high: mark ? mark.high.toFixed(8) : "N/A",
        mark_low: mark ? mark.low.toFixed(8) : "N/A",
        mark_close: mark ? mark.close.toFixed(8) : "N/A",
        last_open: last ? last.open.toFixed(8) : "N/A",
        last_high: last ? last.high.toFixed(8) : "N/A",
        last_low: last ? last.low.toFixed(8) : "N/A",
        last_close: last ? last.close.toFixed(8) : "N/A"
      };

      const msg = renderMacro(macroId, inputs, prices);
      setResult(msg);
      setTimeout(
        () => outRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    const btn = document.getElementById("copy-btn");
    const old = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = old), 1000);
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          Order Macro App
          <span className="badge">Binance 1m OHLC</span>
        </div>
      </div>

      <div className="panel">
        <div className="grid">
          <div className="col-12">
            <label className="label">Macro</label>
            <select
              className="select"
              value={macroId}
              onChange={(e) => setMacroId(e.target.value)}
            >
              {macros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6">
            <label className="label">Symbol</label>
            <input
              className="input"
              value={inputs.symbol}
              onChange={(e) =>
                onChange("symbol", e.target.value.toUpperCase())
              }
              placeholder="ETHUSDT"
            />
          </div>

          <div className="col-6">
            <label className="label">Trigger Type</label>
            <input
              className="input"
              value={inputs.trigger_type}
              onChange={(e) => onChange("trigger_type", e.target.value)}
              placeholder="Mark or Last"
            />
          </div>

          <div className="col-6">
            <label className="label">Trigger Price</label>
            <input
              className="input"
              value={inputs.trigger_price}
              onChange={(e) => onChange("trigger_price", e.target.value)}
              placeholder="e.g. 4393.00"
            />
          </div>

          <div className="col-6">
            <label className="label">Executed Price</label>
            <input
              className="input"
              value={inputs.executed_price}
              onChange={(e) => onChange("executed_price", e.target.value)}
              placeholder="e.g. 4331.67"
            />
          </div>

          <div className="col-6">
            <label className="label">Order ID</label>
            <input
              className="input"
              value={inputs.order_id}
              onChange={(e) => onChange("order_id", e.target.value)}
              placeholder="8389..."
            />
          </div>

          <div className="col-6">
            <label className="label">Placed At (UTC, YYYY-MM-DD HH:MM:SS)</label>
            <input
              className="input"
              value={inputs.placed_at_utc}
              onChange={(e) => onChange("placed_at_utc", e.target.value)}
              placeholder="2025-09-11 06:53:08"
            />
          </div>

          <div className="col-12">
            <label className="label">
              Triggered At (UTC, YYYY-MM-DD HH:MM:SS)
            </label>
            <input
              className="input"
              value={inputs.triggered_at_utc}
              onChange={(e) => onChange("triggered_at_utc", e.target.value)}
              placeholder="2025-09-11 12:30:18"
            />
            <div className="helper">
              We’ll fetch the 1-minute candle that contains this timestamp.
            </div>
          </div>

          <div className="col-12">
            <button
              className="btn"
              id="generate-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>

          <div className="col-12">
            <button
              className="btn secondary"
              id="copy-btn"
              onClick={handleCopy}
              disabled={!result}
            >
              Copy
            </button>
          </div>
        </div>

        <div className="hr" />

        {err && (
          <div className="helper" style={{ color: "#ffb4b4" }}>
            <strong>Error:</strong> {err}
            <div className="helper" style={{ marginTop: 6 }}>
              Tip: If you see <span className="kbd">451</span> or CORS errors,
              set a corporate CORS proxy in{" "}
              <span className="kbd">src/pricing.js</span> (PROXY constant).
            </div>
          </div>
        )}

        <div ref={outRef} className="grid" style={{ marginTop: 10 }}>
          <div className="col-12">
            <label className="label">Result</label>
            <textarea className="textarea" value={result} readOnly />
          </div>
        </div>
      </div>

      {/* Extra Tab: Price Lookup */}
      <div style={{ marginTop: 40 }}>
        <PriceLookup />
      </div>
    </div>
  );
}
