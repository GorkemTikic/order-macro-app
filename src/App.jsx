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
  executed_price: "",
  placed_at_utc: "",
  triggered_at_utc: "",
  status: "OPEN"
};

function getDynamicTimestampLabel(status) {
  switch (status) {
    case "OPEN":
      return "To (UTC, YYYY-MM-DD HH:MM:SS)";
    case "CANCELED":
      return "Canceled At (UTC, YYYY-MM-DD HH:MM:SS)";
    case "EXPIRED":
      return "Expired At (UTC, YYYY-MM-DD HH:MM:SS)";
    case "TRIGGERED":
      return "Triggered At (UTC, YYYY-MM-DD HH:MM:SS)";
    case "EXECUTED":
      return "Executed At (UTC, YYYY-MM-DD HH:MM:SS)";
    default:
      return "Timestamp (UTC, YYYY-MM-DD HH:MM:SS)";
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

  useEffect(() => {
    if (!activeMacro) return;
    const newDefaults = {};
    activeMacro.formConfig.forEach((field) => {
      if (field.defaultValue !== undefined) {
        newDefaults[field.name] = field.defaultValue;
      }
    });
    setInputs((prev) => ({
      ...initialInputs, // ✅ ÖNEMLİ: Formu sıfırla ki eski makrodan 'executed_price' gibi alanlar kalmasın
      ...newDefaults, // Sadece yeni makronun varsayılanlarını uygula
      // Kasıtlı olarak korunacak alanlar:
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
    let toTime = inputs.triggered_at_utc;

    if (inputs.status === "OPEN") {
      toTime = new Date().toISOString().slice(0, 19).replace("T", " ");
      effectiveInputs.triggered_at_utc = toTime;
    }

    try {
      if (!activeMacro) throw new Error("Select a macro.");
      if (!effectiveInputs.symbol) throw new Error("Symbol is required.");

      if (!toTime) {
        throw new Error(
          `${getDynamicTimestampLabel(
            inputs.status
          )} is required. Format: YYYY-MM-DD HH:MM:SS`
        );
      }

      if (
        macroId === "mark_not_reached_user_checked_last" &&
        !effectiveInputs.placed_at_utc
      ) {
        throw new Error(
          "Placed At (UTC) is required for this macro. Format: YYYY-MM-DD HH:MM:SS"
        );
      }

      let prices = {};
      const priceSource = activeMacro.price_required;

      if (macroId === "mark_not_reached_user_checked_last") {
        const range = await getRangeHighLow(
          effectiveInputs.symbol,
          effectiveInputs.placed_at_utc,
          toTime
        );
        if (!range) throw new Error("No data found for this range.");
        prices = range;
      } else {
        // Diğer tüm makrolar (Stop Loss, Take Profit) 1 dakikalık mum kullanır
        const { mark, last } = await getTriggerMinuteCandles(
          effectiveInputs.symbol,
          toTime
        );
        const tMinute = new Date(msMinuteStartUTC(toTime))
          .toISOString()
          .slice(0, 16)
          .replace("T", " ");

        // ✅ DÜZELTME: Fiyatları makronun 'price_required' ihtiyacına göre paketle
        if (priceSource === "both") {
          // Hem Mark hem Last bekleyen makrolar
          prices = { triggered_minute: tMinute, mark, last };
        } else if (priceSource === "last") {
          // Sadece Last bekleyen makrolar
          prices = { triggered_minute: tMinute, last };
        } else {
          // Eski 'else' bloğu kaldırıldı (hataya neden olan blok)
          prices = { triggered_minute: tMinute, mark, last }; // Güvenli varsayılan
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

  const timestampLabel = getDynamicTimestampLabel(inputs.status);
  const timestampValue =
    inputs.status === "OPEN"
      ? "(Auto-populates on Generate)"
      : inputs.triggered_at_utc;

  const renderFormField = (field) => {
    // Dinamik 'timestamp' alanı
    if (field.name === "triggered_at_utc") {
      return (
        <div className={`col-${field.col || 6}`} key={field.name}>
          <label className="label">{timestampLabel}</label>
          <input
            className="input"
            value={timestampValue}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={inputs.status === "OPEN"}
          />
          <div className="helper">
            {inputs.status === "OPEN"
              ? "For 'OPEN' orders, we check the range from 'Placed At' to the current time."
              : `Enter the time the order was ${inputs.status.toLowerCase()}.`}
          </div>
        </div>
      );
    }

    const value = inputs[field.name] ?? "";

    // Select (Dropdown)
    if (field.type === "select") {
      return (
        <div className={`col-${field.col || 6}`} key={field.name}>
          <label className="label">{field.label}</label>
          <select
            className="select"
            value={value}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={field.locked}
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
        <label className="label">{field.label}</label>
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
          placeholder={field.placeholder}
          disabled={field.locked}
        />
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
