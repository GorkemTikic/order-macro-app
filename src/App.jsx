// src/App.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import { listMacros, renderMacro } from "./macros/index.js";
import {
  getTriggerMinuteCandles,
  getRangeHighLow,
  msMinuteStartUTC
} from "./pricing";
import PriceLookup from "./components/PriceLookup";
import FundingMacro from "./components/FundingMacro";

const initialInputs = {
  order_id: "",
  symbol: "ETHUSDT",
  side: "SELL",
  trigger_type: "MARK",
  trigger_price: "",
  limit_price: "", // Stop-Limit için
  executed_price: "",
  placed_at_utc: "",
  triggered_at_utc: "", // Gerçekleşen emirler (SL/TP) ve Stop-Limit tetiklenme zamanı için
  final_status_utc: "", // Gerçekleşmeyen emirler (Not Reached, Stop-Limit) için
  status: "OPEN"
};

// Dinamik zaman damgası etiketleri
function getDynamicTimestampLabel(fieldName, status) {
  if (fieldName === "final_status_utc") {
    switch (status) {
      case "OPEN":
        return "To (UTC, YYYY-MM-DD HH:MM:SS)";
      case "CANCELED":
        return "Canceled At (UTC, YYYY-MM-DD HH:MM:SS)";
      case "EXPIRED":
        return "Expired At (UTC, YYYY-MM-DD HH:MM:SS)";
      default:
        return "Final Status At (UTC)";
    }
  }
  // (fieldName === 'triggered_at_utc')
  switch (status) {
    case "EXECUTED":
      return "Executed At (UTC, YYYY-MM-DD HH:MM:SS)";
    case "TRIGGERED":
      return "Triggered At (UTC, YYYY-MM-DD HH:MM:SS)";
    default:
      return "Triggered/Executed At (UTC)";
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState("macros");
  const [macros, setMacros] = useState([]);
  const [macroId, setMacroId] = useState("");
  const [inputs, setInputs] = useState(initialInputs);
  const [result, setResult] = useState("");
  const [mode, setMode] = useState("detailed");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const outRef = useRef(null);

  useEffect(() => {
    setMacros(listMacros());
  }, []);

  const activeMacro = useMemo(
    () => macros.find((m) => m.id === macroId),
    [macros, macroId]
  );

  useEffect(() => {
    if (macros.length && !macroId) {
      setMacroId(macros[0].id);
    }
  }, [macros, macroId]);

  // Makro değiştikçe, formun varsayılan değerlerini ayarla
  useEffect(() => {
    if (!activeMacro) return;
    const newDefaults = {};
    activeMacro.formConfig.forEach((field) => {
      if (field.defaultValue !== undefined) {
        newDefaults[field.name] = field.defaultValue;
      }
    });
    setInputs((prev) => ({
      ...initialInputs,
      ...newDefaults,
      symbol: prev.symbol,
      order_id: prev.order_id
    }));
  }, [activeMacro]);

  const onChange = (k, v) => setInputs((prev) => ({ ...prev, [k]: v }));

  async function handleGenerate() {
    setLoading(true);
    setErr("");
    setResult("");

    let effectiveInputs = { ...inputs };
    
    // Hangi makronun hangi zaman damgasını kullandığını belirle
    const usesFinalStatusTime = macroId.includes("not_reached") || macroId.includes("stop_limit");
    const usesTriggerTime = !usesFinalStatusTime; // SL/TP Slippage makroları

    let rangeEndTime = inputs.final_status_utc;
    let triggerCandleTime = inputs.triggered_at_utc;

    // 'OPEN' durumu için son zamanı ayarla
    if (inputs.status === "OPEN") {
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      if (usesFinalStatusTime) {
        rangeEndTime = now;
        effectiveInputs.final_status_utc = now;
      }
    }

    try {
      if (!activeMacro) throw new Error("Select a macro.");
      if (!effectiveInputs.symbol) throw new Error("Symbol is required.");

      // Zaman damgası gerekliliklerini doğrula
      if (usesFinalStatusTime && !rangeEndTime) {
         throw new Error(
          `Final Status At (Open/Canceled/Expired) is required. Format: YYYY-MM-DD HH:MM:SS`
        );
      }
      if (usesTriggerTime && !triggerCandleTime) {
           throw new Error(
          `Triggered/Executed At is required. Format: YYYY-MM-DD HH:MM:SS`
        );
      }
      if (macroId.includes("stop_limit") && !inputs.triggered_at_utc) {
         throw new Error(
          `Triggered At (Stop Price Hit) is required for Stop-Limit. Format: YYYY-MM-DD HH:MM:SS`
        );
      }
       if (macroId.includes("not_reached") && !inputs.placed_at_utc) {
         throw new Error(
          `Placed At (UTC) is required for this macro. Format: YYYY-MM-DD HH:MM:SS`
        );
      }


      let prices = {};
      const priceSource = activeMacro.price_required;

      // 'Not Reached' makrosu bir fiyat aralığı (range) çeker
      if (macroId.includes("not_reached")) {
        const range = await getRangeHighLow(
          effectiveInputs.symbol,
          effectiveInputs.placed_at_utc,
          rangeEndTime // 'placed_at' ile 'final_status' arası
        );
        if (!range) throw new Error("No data found for this range.");
        prices = range;
      } else {
        // Diğer tüm makrolar (SL, TP, Stop-Limit) tetiklenme anındaki (triggered_at_utc) 1m mumunu çeker
        const { mark, last } = await getTriggerMinuteCandles(
          effectiveInputs.symbol,
          inputs.triggered_at_utc // Tetiklenme anı mumu
        );
        const tMinute = new Date(msMinuteStartUTC(inputs.triggered_at_utc))
          .toISOString()
          .slice(0, 16)
          .replace("T", " ");

        // ✅ N/A DÜZELTMESİ:
        // Fiyatları her zaman {mark, last} objeleri olarak paketle,
        // makronun 'price_required' ihtiyacına göre.
        if (priceSource === "both") {
          prices = { triggered_minute: tMinute, mark, last };
        } else if (priceSource === "last") {
          prices = { triggered_minute: tMinute, last };
        } else {
          // Güvenli varsayılan (veya hata)
          prices = { triggered_minute: tMinute, mark, last };
        }
      }

      const msg = renderMacro(macroId, effectiveInputs, prices, mode);
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
    btn.textContent = "Copied! (Markdown-ready for chat)";
    setTimeout(() => (btn.textContent = old), 1500);
  }


  // Formu dinamik olarak render et
  const renderFormField = (field) => {
    let value = inputs[field.name] ?? "";
    let label = field.label;
    let placeholder = field.placeholder;
    let isDisabled = field.locked;
    let helperText = field.helper;

    // ✅ YENİ: İki dinamik zaman damgası alanını da ele al
    
    // 1. Gerçekleşen (Executed) emirler için
    if (field.name === "triggered_at_utc" && !macroId.includes("stop_limit")) {
      label = getDynamicTimestampLabel(field.name, inputs.status);
    }
    
    // 2. Gerçekleşmeyen (Not Filled) emirler için
    if (field.name === "final_status_utc") {
      label = getDynamicTimestampLabel(field.name, inputs.status);
      if (inputs.status === "OPEN") {
        value = "(Auto-populates on Generate)";
        isDisabled = true;
      }
      helperText = (inputs.status === "OPEN")
        ? "For 'OPEN' orders, we check from 'Placed At' to the current time."
        : `Enter the time the order was ${inputs.status.toLowerCase()}.`;
    }

    // Select (Dropdown)
    if (field.type === "select") {
      return (
        <div className={`col-${field.col || 6}`} key={field.name}>
          <label className="label">{label}</label>
          <select
            className="select"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={isDisabled}
          >
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    // Text (Input)
    return (
      <div className={`col-${field.col || 6}`} key={field.name}>
        <label className="label">{label}</label>
        <input
          className="input"
          type={field.type}
          value={value}
          onChange={(e) =>
            onChange(
              field.name,
              field.name === "symbol"
                ? e.target.value.toUpperCase()
                : e.target.value
            )
          }
          placeholder={placeholder}
          disabled={isDisabled}
        />
        {helperText && <div className="helper">{helperText}</div>}
      </div>
    );
  };

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          Order Macro App <span className="badge">Binance 1m OHLC</span>
        </div>
        <div className="tabs">
          <button
            className={activeTab === "macros" ? "tab active" : "tab"}
            onClick={() => setActiveTab("macros")}
          >
            Macro Generator
          </button>
          <button
            className={activeTab === "lookup" ? "tab active" : "tab"}
            onClick={() => setActiveTab("lookup")}
          >
            Price Lookup
          </button>
          <button
            className={activeTab === "funding" ? "tab active" : "tab"}
            onClick={() => setActiveTab("funding")}
          >
            Funding Macro
          </button>
        </div>
      </div>

      {activeTab === "macros" && (
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

            <div className="col-12">
              <label className="label">Output Mode</label>
              <select
                className="select"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="detailed">Detailed / Professional</option>
                <option value="summary">Summary / Simplified</option>
              </select>
            </div>

            {activeMacro && activeMacro.formConfig.map(renderFormField)}

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
      )}

      {activeTab === "lookup" && <PriceLookup />}
      {activeTab === "funding" && <FundingMacro />}
    </div>
  );
}
