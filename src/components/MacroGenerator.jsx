import React, { useState } from "react";
import { getTriggerMinuteCandles, getRangeHighLow } from "../pricing";
import { generateMacro } from "../macros";

export default function MacroGenerator() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [orderId, setOrderId] = useState("");
  const [orderType, setOrderType] = useState("Stop-Market");
  const [orderSide, setOrderSide] = useState("LONG");
  const [triggerCondition, setTriggerCondition] = useState("Mark Price");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [executedPrice, setExecutedPrice] = useState("");
  const [status, setStatus] = useState("Canceled"); // Canceled / Triggered / Executed

  const [placedAt, setPlacedAt] = useState("");
  const [triggeredAt, setTriggeredAt] = useState("");
  const [executedAt, setExecutedAt] = useState("");
  const [canceledAt, setCanceledAt] = useState("");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // scenario modifiers
  const [higherLoss, setHigherLoss] = useState(false);
  const [lessProfit, setLessProfit] = useState(false);
  const [endedLoss, setEndedLoss] = useState(false);
  const [slippage, setSlippage] = useState(false);

  const [result, setResult] = useState("");

  async function handleGenerate() {
    try {
      const macro = await generateMacro({
        symbol,
        orderId,
        orderType,
        orderSide,
        triggerCondition,
        triggerPrice,
        executedPrice,
        status,
        placedAt,
        triggeredAt,
        executedAt,
        canceledAt,
        from,
        to,
        modifiers: { higherLoss, lessProfit, endedLoss, slippage },
      });
      setResult(macro);
    } catch (err) {
      setResult("❌ Error: " + err.message);
    }
  }

  return (
    <div className="panel">
      <h3>📑 Macro Generator</h3>

      <div className="grid">
        <div className="col-6">
          <label className="label">Order ID</label>
          <input className="input" value={orderId} onChange={e=>setOrderId(e.target.value)} />
        </div>
        <div className="col-6">
          <label className="label">Symbol</label>
          <input className="input" value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())} />
        </div>

        <div className="col-6">
          <label className="label">Order Type</label>
          <select className="select" value={orderType} onChange={e=>setOrderType(e.target.value)}>
            <option>Stop-Market</option>
            <option>Stop-Limit</option>
            <option>TP/SL</option>
            <option>Trailing Stop</option>
          </select>
        </div>

        <div className="col-6">
          <label className="label">Side</label>
          <select className="select" value={orderSide} onChange={e=>setOrderSide(e.target.value)}>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>

        <div className="col-6">
          <label className="label">Trigger Condition</label>
          <select className="select" value={triggerCondition} onChange={e=>setTriggerCondition(e.target.value)}>
            <option>Mark Price</option>
            <option>Last Price</option>
          </select>
        </div>
        <div className="col-6">
          <label className="label">Trigger Price</label>
          <input className="input" value={triggerPrice} onChange={e=>setTriggerPrice(e.target.value)} />
        </div>

        {status === "Executed" && (
          <div className="col-6">
            <label className="label">Executed Price</label>
            <input className="input" value={executedPrice} onChange={e=>setExecutedPrice(e.target.value)} />
          </div>
        )}

        <div className="col-6">
          <label className="label">Status</label>
          <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
            <option>Canceled</option>
            <option>Triggered</option>
            <option>Executed</option>
          </select>
        </div>

        {/* Timeline */}
        <div className="col-6">
          <label className="label">Placed At (UTC)</label>
          <input className="input" placeholder="YYYY-MM-DD HH:mm:ss" value={placedAt} onChange={e=>setPlacedAt(e.target.value)} />
        </div>
        {status === "Triggered" && (
          <div className="col-6">
            <label className="label">Triggered At (UTC)</label>
            <input className="input" value={triggeredAt} onChange={e=>setTriggeredAt(e.target.value)} />
          </div>
        )}
        {status === "Executed" && (
          <div className="col-6">
            <label className="label">Executed At (UTC)</label>
            <input className="input" value={executedAt} onChange={e=>setExecutedAt(e.target.value)} />
          </div>
        )}
        {status === "Canceled" && (
          <div className="col-6">
            <label className="label">Canceled At (UTC)</label>
            <input className="input" value={canceledAt} onChange={e=>setCanceledAt(e.target.value)} />
          </div>
        )}

        <div className="col-6">
          <label className="label">From (Chart UTC)</label>
          <input className="input" value={from} onChange={e=>setFrom(e.target.value)} />
        </div>
        <div className="col-6">
          <label className="label">To (Chart UTC)</label>
          <input className="input" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
      </div>

      <div className="hr" />

      {/* Scenario Modifiers */}
      <div className="grid">
        <div className="col-6">
          <label className="label">
            <input type="checkbox" checked={higherLoss} onChange={e=>setHigherLoss(e.target.checked)} /> Higher Loss Than Expected
          </label>
        </div>
        <div className="col-6">
          <label className="label">
            <input type="checkbox" checked={lessProfit} onChange={e=>setLessProfit(e.target.checked)} /> Take Profit With Less Profit
          </label>
        </div>
        <div className="col-6">
          <label className="label">
            <input type="checkbox" checked={endedLoss} onChange={e=>setEndedLoss(e.target.checked)} /> Take Profit Ended With Loss
          </label>
        </div>
        <div className="col-6">
          <label className="label">
            <input type="checkbox" checked={slippage} onChange={e=>setSlippage(e.target.checked)} /> Triggered Late (Slippage)
          </label>
        </div>
      </div>

      <div className="col-12" style={{marginTop:12}}>
        <button className="btn" onClick={handleGenerate}>✨ Generate Macro</button>
      </div>

      {result && (
        <div style={{marginTop:16}}>
          <label className="label">Generated Macro</label>
          <textarea className="textarea" rows="12" value={result} readOnly />
        </div>
      )}
    </div>
  );
}
