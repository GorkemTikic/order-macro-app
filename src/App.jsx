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
  limit_price: "",
  executed_price: "",
  placed_at_utc: "",
  triggered_at_utc: "",
  final_status_utc: "",
  status: "OPEN"
};

// Arayüz metinleri
const uiStrings = {
  en: {
    badge: "Binance 1m OHLC",
    tabMacro: "Macro Generator",
    tabLookup: "Price Lookup",
    tabFunding: "Funding Macro",
    macroLabel: "Macro",
    modeLabel: "Output Mode",
    modeDetailed: "Detailed / Professional",
    modeSummary: "Summary / Simplified",
    generate: "Generate",
    generating: "Generating...",
    copy: "Copy",
    copied: "Copied! (Markdown-ready for chat)",
    error: "Error:",
    errorTip: "Tip: If you see 451 or CORS errors, set a corporate CORS proxy in src/pricing.js (PROXY constant).",
    resultLabel: "Result",
    // Price Lookup
    lookupTitle: "Price Lookup Tool",
    lookupSymbol: "Symbol",
    lookupMode: "Mode",
    lookupModeTrigger: "Trigger Minute (Mark+Last)",
    lookupModeRange: "Range (High/Low)",
    lookupModeLast1s: "Last Price 1s (max 7d)",
    lookupAt: "At (UTC)",
    lookupFrom: "From (UTC)",
    lookupTo: "To (UTC)",
    lookupDateTime: "DateTime (UTC)",
    lookupButton: "Lookup",
    // Funding
    fundingTitle: "Funding Macro",
    fundingSymbol: "Symbol",
    fundingTime: "Funding Time (UTC)",
    fundingPosSize: "Position Size",
    fundingInterval: "Funding Interval (hours)",
    fundingButton: "✨ Generate Funding Macro",
    fundingLoading: "Loading...",
    fundingApply: "Apply Precision"
  },
  tr: {
    badge: "Binance 1m OHLC",
    tabMacro: "Makro Oluşturucu",
    tabLookup: "Fiyat Sorgulama",
    tabFunding: "Funding Makrosu",
    macroLabel: "Makro",
    modeLabel: "Çıktı Modu",
    modeDetailed: "Detaylı / Profesyonel",
    modeSummary: "Özet / Basitleştirilmiş",
    generate: "Oluştur",
    generating: "Oluşturuluyor...",
    copy: "Kopyala",
    copied: "Kopyalandı! (Sohbete hazır)",
    error: "Hata:",
    errorTip: "İpucu: 451 veya CORS hatası alırsanız, src/pricing.js dosyasındaki PROXY sabitine bir proxy adresi girin.",
    resultLabel: "Sonuç",
    // Price Lookup
    lookupTitle: "Fiyat Sorgulama Aracı",
    lookupSymbol: "Sembol",
    lookupMode: "Mod",
    lookupModeTrigger: "Tetiklenme Dakikası (Mark Price + Last Price)",
    lookupModeRange: "Aralık (Yüksek/Düşük)",
    lookupModeLast1s: "Last Price 1s (max 7g)",
    lookupAt: "Tarih/Zaman (UTC)",
    lookupFrom: "Başlangıç (UTC)",
    lookupTo: "Bitiş (UTC)",
    lookupDateTime: "Tarih/Zaman (UTC)",
    lookupButton: "Sorgula",
    // Funding
    fundingTitle: "💰 Funding Makrosu",
    fundingSymbol: "Sembol",
    fundingTime: "Funding Zamanı (UTC)",
    fundingPosSize: "Pozisyon Büyüklüğü",
    fundingInterval: "Funding Aralığı (saat)",
    fundingButton: "✨ Funding Makrosu Oluştur",
    fundingLoading: "Yükleniyor...",
    fundingApply: "Kesinlik Uygula"
  }
};

// Dinamik zaman damgası etiketleri
function getDynamicTimestampLabel(fieldName, status, lang, macroId) {
  const labels = {
    en: {
      OPEN: "To (UTC, YYYY-MM-DD HH:MM:SS)",
      CANCELED: "Canceled At (UTC, YYYY-MM-DD HH:MM:SS)",
      EXPIRED: "Expired At (UTC, YYYY-MM-DD HH:MM:SS)",
      TRIGGERED: "Triggered At (UTC, YYYY-MM-DD HH:MM:SS)",
      EXECUTED: "Executed At (UTC, YYYY-MM-DD HH:MM:SS)",
      FINAL_STATUS: "Final Status At (Open/Canceled/Expired)",
      TRIGGER_HIT: "Triggered At (Stop Price Hit)"
    },
    tr: {
      OPEN: "Bitiş (UTC, YYYY-AA-GG SS:DD:ss)",
      CANCELED: "İptal Zamanı (UTC, YYYY-AA-GG SS:DD:ss)",
      EXPIRED: "Süre Doldu (UTC, YYYY-AA-GG SS:DD:ss)",
      TRIGGERED: "Tetiklenme Zamanı (UTC, YYYY-AA-GG SS:DD:ss)",
      EXECUTED: "Gerçekleşme Zamanı (UTC, YYYY-AA-GG SS:DD:ss)",
      FINAL_STATUS: "Son Durum Zamanı (Açık/İptal/Süresi Doldu)",
      TRIGGER_HIT: "Tetiklenme Zamanı (Stop Fiyatına Ulaştı)"
    }
  };
  const l = labels[lang] || labels['en'];

  if (fieldName === "final_status_utc") {
    return l[status] || l.FINAL_STATUS;
  }
  if (fieldName === "triggered_at_utc") {
    if (macroId.includes("stop_limit")) {
        return l.TRIGGER_HIT;
    }
    return l[status] || l.EXECUTED;
  }
  return "Timestamp (UTC)";
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
  const [lang, setLang] = useState('en');

  const t = uiStrings[lang] || uiStrings['en'];

  useEffect(() => {
    setMacros(listMacros(lang));
  }, [lang]);

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
    const usesFinalStatusTime = macroId.includes("not_reached") || macroId.includes("stop_limit");
    let rangeEndTime = inputs.final_status_utc;
    let triggerCandleTime = inputs.triggered_at_utc;

    if (inputs.status === "OPEN") {
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      if (usesFinalStatusTime) {
        rangeEndTime = now;
        effectiveInputs.final_status_utc = now;
      }
    } else if (usesFinalStatusTime) {
       rangeEndTime = inputs.final_status_utc;
    }

    try {
      if (!activeMacro) throw new Error("Select a macro.");
      if (!effectiveInputs.symbol) throw new Error("Symbol is required.");

      if (usesFinalStatusTime && !rangeEndTime) {
         throw new Error(
          `Final Status At (Open/Canceled/Expired) is required. Format: YYYY-MM-DD HH:MM:SS`
        );
      }
      const needsTriggerTime = !usesFinalStatusTime || macroId.includes("stop_limit");
      if (needsTriggerTime && !triggerCandleTime) {
           throw new Error(
          `Triggered/Executed At is required. Format: YYYY-MM-DD HH:MM:SS`
        );
      }
       if (macroId.includes("not_reached") && !inputs.placed_at_utc) {
         throw new Error(
          `Placed At (UTC) is required for this macro. Format: YYYY-MM-DD HH:MM:SS`
        );
      }

      let prices = {};
      const priceSource = activeMacro.price_required;

      if (macroId.includes("not_reached")) {
        const range = await getRangeHighLow(
          effectiveInputs.symbol,
          effectiveInputs.placed_at_utc,
          rangeEndTime
        );
        if (!range) throw new Error("No data found for this range.");
        prices = range;
      } else {
        const { mark, last } = await getTriggerMinuteCandles(
          effectiveInputs.symbol,
          inputs.triggered_at_utc
        );
        const tMinute = new Date(msMinuteStartUTC(inputs.triggered_at_utc))
          .toISOString()
          .slice(0, 16)
          .replace("T", " ");

        if (priceSource === "both") {
          prices = { triggered_minute: tMinute, mark, last };
        } else if (priceSource === "last") {
          prices = { triggered_minute: tMinute, last };
        } else {
          prices = { triggered_minute: tMinute, mark, last };
        }
      }

      const msg = renderMacro(macroId, effectiveInputs, prices, mode, lang);
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
    btn.textContent = t.copied;
    setTimeout(() => (btn.textContent = t.copy), 1500);
  }

  const renderFormField = (field) => {
    let value = inputs[field.name] ?? "";
    let label = field.label;
    let placeholder = field.placeholder;
    let isDisabled = field.locked;
    let helperText = field.helper;

    if (field.name === "triggered_at_utc" || field.name === "final_status_utc") {
      label = getDynamicTimestampLabel(field.name, inputs.status, lang, macroId);
    }
    
    if (field.name === "final_status_utc") {
      if (inputs.status === "OPEN") {
        value = "(Auto-populates on Generate)";
        isDisabled = true;
      }
      helperText = (inputs.status === "OPEN")
        ? (lang === 'tr' ? "'AÇIK' emirler için 'Verilme Zamanı'ndan şu anki zamana kadar kontrol edilir." : "For 'OPEN' orders, we check from 'Placed At' to the current time.")
        : (lang === 'tr' ? `Emrin ${inputs.status.toLowerCase()} olduğu zamanı girin.` : `Enter the time the order was ${inputs.status.toLowerCase()}.`);
    }

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
          Order Macro App <span className="badge">{t.badge}</span>
        </div>
        <div className="tabs">
          <button
            className={activeTab === "macros" ? "tab active" : "tab"}
            onClick={() => setActiveTab("macros")}
          >
            {t.tabMacro}
          </button>
          <button
            className={activeTab === "lookup" ? "tab active" : "tab"}
            onClick={() => setActiveTab("lookup")}
          >
            {t.tabLookup}
          </button>
          <button
            className={activeTab === "funding" ? "tab active" : "tab"}
            onClick={() => setActiveTab("funding")}
          >
            {t.tabFunding}
          </button>
        </div>
        <div className="lang-switcher">
          <button 
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`} 
            onClick={() => setLang('en')}
            title="Switch to English"
          >
            EN
          </button>
          <button 
            className={`lang-btn ${lang === 'tr' ? 'active' : ''}`}
            onClick={() => setLang('tr')}
            title="Türkçe'ye geç"
          >
            TR
          </button>
        </div>
      </div>

      {activeTab === "macros" && (
        <div className="panel">
          <div className="grid">
            <div className="col-12">
              <label className="label">{t.macroLabel}</label>
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
              <label className="label">{t.modeLabel}</label>
              <select
                className="select"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="detailed">{t.modeDetailed}</option>
                <option value="summary">{t.modeSummary}</option>
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
                {loading ? t.generating : t.generate}
              </button>
            </div>

            <div className="col-12">
              <button
                className="btn secondary"
                id="copy-btn"
                onClick={handleCopy}
                disabled={!result}
              >
                {t.copy}
              </button>
            </div>
          </div>

          <div className="hr" />

          {err && (
            <div className="helper" style={{ color: "#ffb4b4" }}>
              <strong>{t.error}</strong> {err}
              <div className="helper" style={{ marginTop: 6 }}>
                {t.errorTip}
              </div>
            </div>
          )}

          <div ref={outRef} className="grid" style={{ marginTop: 10 }}>
            <div className="col-12">
              <label className="label">{t.resultLabel}</label>
              <textarea className="textarea" value={result} readOnly />
            </div>
          </div>
        </div>
      )}

      {activeTab === "lookup" && <PriceLookup lang={lang} uiStrings={t} />}
      {activeTab === "funding" && <FundingMacro lang={lang} uiStrings={t} />}
    </div>
  );
}
