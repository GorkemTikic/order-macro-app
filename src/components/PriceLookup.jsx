import React, { useRef, useState } from "react";
import { getTriggerMinuteCandles, getRangeHighLow } from "../pricing";

export default function PriceLookup() {
  const [symbol, setSymbol] = useState("ETHUSDT");
  const [singleTime, setSingleTime] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [result, setResult] = useState("");
  const outRef = useRef(null);

  async function handleSingle() {
    setResult("");
    try {
      const { mark, last } = await getTriggerMinuteCandles(symbol, singleTime);
      const msg = `${singleTime} UTC+0 = At this date and time, the Mark Price and Last Price details are:

**Mark Price:**
Opening: ${mark.open}
Highest: ${mark.high}
Lowest: ${mark.low}
Closing: ${mark.close}

**Last Price:**
Opening: ${last.open}
Highest: ${last.high}
Lowest: ${last.low}
Closing: ${last.close}`;
      setResult(msg);
      setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setResult("Error: " + e.message);
    }
  }

  async function handleRange() {
    setResult("");
    try {
      const { highestMark, lowestMark, highestLast, lowestLast } = await getRangeHighLow(symbol, rangeFrom, rangeTo);
      const msg = `When we check the ${symbol} Price Chart

From: ${rangeFrom}
To: ${rangeTo}

${highestMark.time} > At this date and time, the highest Mark Price ${highestMark.price} was reached.
${highestLast.time} > At this date and time, the highest Last Price ${highestLast.price} was reached.

${lowestMark.time} > At this date and time, the lowest Mark Price ${lowestMark.price} was reached.
${lowestLast.time} > At this date and time, the lowest Last Price ${lowestLast.price} was reached.`;
      setResult(msg);
      setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setResult("Error: " + e.message);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    const btn = document.getElementById("copy-btn-lookup");
    const old = btn.textContent;
    btn.textContent = "Copied!";
    setTimeout(() => (btn.textContent = old), 1000);
  }

  return (
    <div className="panel">
      <h3>Single Candle Lookup</h3>
      <div className="grid">
        <div className="col-6">
          <label className="label">Symbol</label>
          <input className="input" value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())}/>
        </div>
        <div className="col-6">
          <label className="label">DateTime (UTC)</label>
          <input className="input" value={singleTime} onChange={e=>setSingleTime(e.target.value)} placeholder="YYYY-MM-DD HH:MM:SS"/>
        </div>
        <div className="col-12">
          <button className="btn" onClick={handleSingle}>Fetch Candle</button>
        </div>
      </div>

      <h3 style={{marginTop:20}}>Range High/Low Lookup</h3>
      <div className="grid">
        <div className="col-6">
          <label className="label">From (UTC)</label>
          <input className="input" value={rangeFrom} onChange={e=>setRangeFrom(e.target.value)} placeholder="YYYY-MM-DD HH:MM:SS"/>
        </div>
        <div className="col-6">
          <label className="label">To (UTC)</label>
          <input className="input" value={rangeTo} onChange={e=>setRangeTo(e.target.value)} placeholder="YYYY-MM-DD HH:MM:SS"/>
        </div>
        <div className="col-12">
          <button className="btn" onClick={handleRange}>Fetch Range</button>
        </div>
      </div>

      <div ref={outRef} className="grid" style={{marginTop: 20}}>
        <div className="col-12">
          <label className="label">Result</label>
          <textarea className="textarea" value={result} readOnly />
        </div>
        <div className="col-12">
          <button className="btn secondary" id="copy-btn-lookup" onClick={handleCopy} disabled={!result}>Copy</button>
        </div>
      </div>
    </div>
  );
}
