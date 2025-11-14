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
    fundingApply: "Apply Precision",
    // Modal
    pasteModalTitle: "Paste Order Grid Data",
    pasteModalButton: "✨ Parse & Auto-fill",
    // ✅ GÜNCELLENDİ (Yardımcı Metin)
    pasteModalHelper: "Paste 26 or 27 lines of *values only* (detects if 'Liquidation' is empty).",
    pasteButtonLabel: "📋 Paste Grid Data",
    pasteGridTitle: "Title (Fixed)",
    pasteGridValue: "Value (Pasted)",
    pasteGridPreview: "Data Mapping Preview"
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
    fundingApply: "Kesinlik Uygula",
    // Modal
    pasteModalTitle: "Emir Verisini Yapıştır",
    pasteModalButton: "✨ Ayrıştır & Doldur",
    // ✅ GÜNCELLENDİ (Yardımcı Metin)
    pasteModalHelper: "26 veya 27 satırlık *sadece değerleri* yapıştırın ('Liquidation' boş olsa da algılar).",
    pasteButtonLabel: "📋 Emir Verisini Yapıştır",
    pasteGridTitle: "Başlık (Sabit)",
    pasteGridValue: "Değer (Yapıştırılan)",
    pasteGridPreview: "Veri Eşleştirme Önizlemesi"
  }
};

// Başlık şablonu (27 başlık)
const GRID_KEYS = [
  "Future UID",
  "Order ID",
  "Order Update Time (UTC)",
  "Symbol",
  "Side",
  "Price",
  "Orig. Qty.",
  "Executed Qty.",
  "Exec. Quote Qty.",
  "Position Side",
  "Status",
  "Expired Reason",
  "Time In Force",
  "Expire Time",
  "Type",
  "Working Type",
  "Stop Price",
  "Liquidation", // 18. Başlık (index 17)
  "ADL",
  "ReduceOnly",
  "Client Order ID",
  "Activate Price",
  "Price Rate",
  "Price Protect",
  "Price Match",
  "Self Protection Mode",
  "Order Place Time(UTC)" // 27. Başlık
];


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

/**
 * ✅ GÜNCELLENDİ: Grid verisini (kaymış mantığa göre) eşleştiren fonksiyon
 * Artık 26 VEYA 27 satırı akıllıca algılıyor.
 */
function mapGridData(rawText) {
  const values = rawText.split('\n').map(v => v.trim()).filter(v => v);
  const dataMap = {};

  if (values.length === 0) return dataMap;

  if (values.length === 27) {
    // --- Durum 1: Liquidation "Yes" (27 satır) ---
    // Tüm veriler tam, 1'e 1 eşleştir
    for (let i = 0; i < GRID_KEYS.length; i++) {
      dataMap[GRID_KEYS[i]] = values[i] || "";
    }
  } else if (values.length === 26) {
    // --- Durum 2: Liquidation boş (26 satır) ---
    // 1. İlk 17 veriyi (0-16) doğrudan eşleştir (Stop Price'a kadar)
    for (let i = 0; i <= 16; i++) {
      dataMap[GRID_KEYS[i]] = values[i] || "";
    }
    
    // 2. 18. başlığı (Liquidation) atla
    dataMap[GRID_KEYS[17]] = "N/A (Boşluk Atlandı)"; // GRID_KEYS[17] = "Liquidation"

    // 3. Kalan 9 veriyi (17-25) kaydırarak eşleştir
    // values[17] (ADL) -> keys[18] (ADL)
    // ...
    // values[25] (Place Time) -> keys[26] (Place Time)
    for (let i = 17; i <= 25; i++) {
      if (values[i] !== undefined) {
          dataMap[GRID_KEYS[i + 1]] = values[i];
      }
    }
  } else {
    // --- Durum 3: Geçersiz veri ---
    throw new Error(`Geçersiz satır sayısı. 26 veya 27 satır bekleniyordu, ${values.length} bulundu.`);
  }

  return dataMap;
}

/**
 * Eşleşen veriyi form state'ine dönüştüren fonksiyon
 * (Bu fonksiyonda değişiklik yok, 'mapGridData' düzeltmesi yeterli)
 */
function parseDataMap(dataMap) {
  const parsed = {};
  
  // 1. Order ID
  if (dataMap['Order ID']) parsed.order_id = dataMap['Order ID'];
  
  // 2. Symbol
  if (dataMap['Symbol']) parsed.symbol = dataMap['Symbol'];
  
  // 3. Side
  if (dataMap['Side']) parsed.side = dataMap['Side'].toUpperCase();
  
  // 4. Order Place Time(UTC) -> placed_at_utc
  if (dataMap['Order Place Time(UTC)']) parsed.placed_at_utc = dataMap['Order Place Time(UTC)'];

  // 5. Status
  if (dataMap['Status']) {
    const status = dataMap['Status'].toUpperCase();
    if (status === 'FILLED') parsed.status = 'EXECUTED';
    else if (status === 'CANCELED') parsed.status = 'CANCELED';
    else if (status === 'OPEN') parsed.status = 'OPEN';
    else parsed.status = status;
  }

  // 6. Working Type -> trigger_type
  if (dataMap['Working Type']) {
    const wt = dataMap['Working Type'].toUpperCase();
    if (wt === 'MARK_PRICE') parsed.trigger_type = 'MARK';
    else if (wt === 'LAST_PRICE') parsed.trigger_type = 'LAST';
    else parsed.trigger_type = wt;
  }

  // 7. Order Update Time (UTC) -> [status_time]
  if (dataMap['Order Update Time (UTC)']) {
    const updateTime = dataMap['Order Update Time (UTC)'];
    const currentStatus = parsed.status || 'OPEN';
    
    if (currentStatus === 'EXECUTED') {
      parsed.executed_at_utc = updateTime; // Bu, handleParseAndFill içinde 'triggered_at_utc'ye yönlendirilecek
      parsed.final_status_utc = updateTime; 
    } else if (currentStatus === 'CANCELED') {
      parsed.final_status_utc = updateTime; 
    } else if (currentStatus === 'EXPIRED') {
      parsed.final_status_utc = updateTime;
    }
  }

  // 8. Stop Price (Tricky Part) -> trigger_price AND triggered_at_utc
  if (dataMap['Stop Price']) {
    const stopPriceParts = dataMap['Stop Price'].split('|').map(p => p.trim());
    const price = parseFloat(stopPriceParts[0]);
    
    if (!isNaN(price) && price > 0) {
      parsed.trigger_price = stopPriceParts[0];
    }
    if (stopPriceParts.length > 1 && stopPriceParts[1].includes('-')) {
      parsed.triggered_at_utc = stopPriceParts[1];
    }
  }
  
  // 9. Price -> limit_price (Stop-Limit emirleri için)
  if (dataMap['Price']) {
       const price = parseFloat(dataMap['Price']);
       if (!isNaN(price) && price > 0) {
          parsed.limit_price = dataMap['Price'];
       }
  }

  return parsed;
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

  // Modal state'leri
  const [showParseModal, setShowParseModal] = useState(false);
  const [pasteData, setPasteData] = useState("");
  const [parseError, setParseError] = useState("");

  const t = uiStrings[lang] || uiStrings['en'];

  useEffect(() => {
    setMacros(listMacros(lang));
  }, [lang]);

  // Modal'daki önizleme tablosu için veri
  const previewDataMap = useMemo(() => {
    try {
      // Metin yapıştırıldıkça hatayı temizle
      setParseError("");
      return mapGridData(pasteData);
    } catch (e) {
      // Sadece 'Eksik veri' hatasını göster
      if (pasteData.trim().length > 0) {
        setParseError(e.message);
      }
      return {};
    }
  }, [pasteData]);

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

  // Modal'ı açan fonksiyon
  function openParseModal() {
    setPasteData("");
    setParseError("");
    setShowParseModal(true);
  }

  // Ayrıştırmayı tetikleyen fonksiyon
  function handleParseAndFill() {
    setParseError("");
    try {
      // 1. Eşleşen haritayı (previewDataMap) al
      const dataMap = previewDataMap;
      if (Object.keys(dataMap).length < 27) {
         throw new Error("Lütfen veriyi yapıştırın.");
      }
      
      // 2. Haritayı form state'ine dönüştür
      const parsedData = parseDataMap(dataMap);
      
      // 3. Formu doldur
      setInputs(prev => {
        const newDefaults = {};
        if (activeMacro) {
          activeMacro.formConfig.forEach((field) => {
            if (field.defaultValue !== undefined) {
              newDefaults[field.name] = field.defaultValue;
            }
          });
        }
        
        const baseInputs = { ...initialInputs, ...newDefaults };
        const finalParsed = { ...parsedData };
        
        // Mantık: 'Stop Price'dan gelen tetiklenme zamanı ('triggered_at_utc')
        // 'Order Update Time'dan gelen 'executed_at_utc'den daha önceliklidir.
        if (finalParsed.status === 'EXECUTED' && finalParsed.executed_at_utc && !finalParsed.triggered_at_utc) {
           finalParsed.triggered_at_utc = finalParsed.executed_at_utc;
        }

        return {
          ...baseInputs, 
          ...finalParsed
        };
      });
      
      setShowParseModal(false);
      setPasteData("");

    } catch (e) {
      setParseError(e.message);
    }
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
  
  // Modal içindeki tabloyu oluşturur
  const renderPreviewGrid = () => {
     if (pasteData.trim().length === 0) return null;
     
     // Forma aktarılacak anahtar başlıklar
     const keysToShow = [
       "Order ID", "Symbol", "Side", "Status", "Working Type", 
       "Price", "Stop Price", "Order Place Time(UTC)", "Order Update Time (UTC)"
     ];
     
     // Önizlemede vurgulanacak anahtar başlıklar
     const highlightRows = {
       "Order Place Time(UTC)": true,
       "Stop Price": true,
       "Order ID": true,
       "Symbol": true,
       "Liquidation": true
     };

     return (
       <div className="modal-preview-grid">
         <label className="label">{t.pasteGridPreview}</label>
         <table>
           <thead>
             <tr>
               <th>{t.pasteGridTitle}</th>
               <th>{t.pasteGridValue}</th>
             </tr>
           </thead>
           <tbody>
             {GRID_KEYS.map((key) => (
               <tr 
                 key={key} 
                 className={highlightRows[key] ? 'highlight' : ''}
                 title={keysToShow.includes(key) ? "Bu veri forma aktarılacak" : "Bu veri forma aktarılmayacak"}
                 style={{ opacity: keysToShow.includes(key) || key === "Liquidation" ? 1 : 0.4 }}
               >
                 <td>{key}</td>
                 <td>{previewDataMap[key] || ""}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
     );
  };


  return (
    <div className="container">
      {/* Grid Ayrıştırma Modalı */}
      {showParseModal && (
        <div className="modal-overlay" onClick={() => setShowParseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowParseModal(false)}>×</button>
            <h3>{t.pasteModalTitle}</h3>
            <p className="helper">{t.pasteModalHelper}</p>
            
            <div className="modal-grid">
              <div className="modal-grid-col">
                <textarea
                  className="textarea"
                  rows="15"
                  value={pasteData}
                  onChange={(e) => {
                    setPasteData(e.target.value);
                  }}
                  placeholder="Buraya yapıştırın..."
                />
              </div>
              <div className="modal-grid-col">
                {/* Önizleme Tablosu */}
                {renderPreviewGrid()}
              </div>
            </div>
            
            {parseError && (
              <div className="helper" style={{ color: "#ffb4b4", marginTop: 10 }}>
                <strong>{t.error}</strong> {parseError}
              </div>
            )}
            <button className="btn" style={{ marginTop: 12 }} onClick={handleParseAndFill}>
              {t.pasteModalButton}
            </button>
          </div>
        </div>
      )}
    
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

      {/* Makro Oluşturucu Paneli */}
      <div style={{ display: activeTab === "macros" ? "block" : "none" }}>
        <div className="panel">
          
          {/* Grid Verisi Yapıştırma Butonu */}
          <div className="col-12" style={{marginBottom: 16}}>
            <button className="btn secondary" onClick={openParseModal}>
              {t.pasteButtonLabel}
            </button>
          </div>
          <div className="hr" style={{margin: "0 0 18px 0"}}/>

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
      </div>

      {/* Fiyat Sorgulama Paneli */}
      <div style={{ display: activeTab === "lookup" ? "block" : "none" }}>
        <PriceLookup lang={lang} uiStrings={t} />
      </div>

      {/* Funding Makrosu Paneli */}
      <div style={{ display: activeTab === "funding" ? "block" : "none" }}>
        <FundingMacro lang={lang} uiStrings={t} />
      </div>
    </div>
  );
}
