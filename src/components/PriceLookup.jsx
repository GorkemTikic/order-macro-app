import React, { useState } from "react";
import { getTriggerMinuteCandles, getRangeHighLow, getLastPrice1s } from "../pricing";

function PriceLookup() {
  const [symbol, setSymbol] = useState("ETHUSDT");
  const [datetime, setDatetime] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mode, setMode] = useState("minute"); // minute | second
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSingle() {
    setLoading(true);
    try {
      if (mode === "minute") {
        const { mark, last } = await getTriggerMinuteCandles(symbol, datetime);
        const msg = `${datetime} UTC+0 = At this date and time, the Mark Price and Last Price details are:\n
**Mark Price:**\nOpening: ${mark.open}\nHighest: ${mark.high}\nLowest: ${mark.low}\nClosing: ${mark.close}\n
**Last Price:**\nOpening: ${last.open}\nHighest: ${last.high}\nLowest: ${last.low}\nClosing: ${last.close}`;
        setResult(msg);
      } else if (mode === "second") {
        const data = await getLastPrice1s(symbol, datetime);
        if (!data) {
          setResult("No trade data found for that second.");
        } else {
          const msg = `${datetime} UTC+0 = At this date and time, the Last Price details (1s) are:\n
**Last Price (1s):**\nOpening: ${data.open}\nHighest: ${data.high}\nLowest: ${data.low}\nClosing: ${data.close}\n(from ${data.count} trades)`;
          setResult(msg);
        }
      }
    } catch (err) {
      setResult("Error: " + err.message);
    }
    setLoading(false);
  }

  async function handleRange() {
    setLoading(true);
    try {
      const data = await getRangeHighLow(symbol, from, to);
      const msg = `When we check the ${symbol} Price Chart\nFrom: ${from}\nTo: ${to}\n\n` +
      `${data.highestMark.time} > At this date and time, the highest Mark Price ${data.highestMark.price} was reached.\n` +
      `${data.highestLast.time} > At this date and time, the highest Last Price ${data.highestLast.price} was reached.\n\n` +
      `${data.lowestMark.time} > At this date and time, the lowest Mark Price ${data.lowestMark.price} was reached.\n` +
      `${data.lowestLast.time} > At this date and time, the lowest Last Price ${data.lowestLast.price} was reached.`;
      setResult(msg);
    } catch (err) {
      setResult("Error: " + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="panel">
      <h2>Price Lookup</h2>
      <div className="grid">
        <div className="col-6">
          <label>Symbol</label>
          <input className="input" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}/>
        </div>

        <div className="col-6">
          <label>Mode</label>
          <select className="select" value={mode} onChange={e => setMode(e.target.value)}>
            <option value="minute">1m Mark & Last Price</option>
            <option value="second">1s Last Price (from trades)</option>
          </select>
        </div>

        <div className="col-12">
          <label>Single Candle (UTC YYYY-MM-DD HH:MM:SS)</label>
          <input className="input" value={datetime} onChange={e => setDatetime(e.target.value)}/>
          <button className="btn" onClick={handleSingle} disabled={loading}>Fetch Single</button>
        </div>

        <div className="col-12">
          <label>Range High/Low (UTC)</label>
          <input className="input" placeholder="From" value={from} onChange={e => setFrom(e.target.value)}/>
          <input className="input" placeholder="To" value={to} onChange={e => setTo(e.target.value)}/>
          <button className="btn" onClick={handleRange} disabled={loading}>Fetch Range</button>
        </div>

        <div className="col-12">
          <label>Result</label>
          <textarea className="textarea" value={result} readOnly />
        </div>
      </div>
    </div>
  );
}

export default PriceLookup;
