import { fmtNum } from "./helpers";

function decideSides(fundingRateNum) {
  const rate = Number(fundingRateNum);
  if (!Number.isFinite(rate)) {
    return { payer: "N/A", receiver: "N/A" };
  }
  if (rate < 0) {
    return { payer: "Short", receiver: "Long" };
  } else {
    return { payer: "Long", receiver: "Short" };
  }
}

// 📌 Funding rate UI precision ile truncate
function formatFundingRatePct(fundingRateStr) {
  const rateNum = parseFloat(fundingRateStr);
  const rawPct = rateNum * 100;
  const truncated = Math.floor(rawPct * 1e6) / 1e6; // 6 decimal truncate
  return truncated.toFixed(6);
}

export const fundingMacro = {
  id: "funding_macro",
  title: "Funding Rate · Fee Calculation",
  price_required: "funding",
  fields: [
    "symbol",
    "funding_time",
    "funding_rate",   // string geliyor
    "mark_price",
    "position_size",
    "funding_interval",
    "price_dp",
    "qty_dp"
  ],
  templates: {
    detailed: ({ inputs }) => {
      const {
        symbol,
        funding_time,
        funding_rate, // string
        mark_price,
        position_size,
        funding_interval,
        qty_dp
      } = inputs;

      const rateNum = parseFloat(funding_rate);
      const ratePctStr = formatFundingRatePct(funding_rate);
      const mark = mark_price; // ✅ RAW string olarak bırak
      const size = Number(position_size);

      const { payer, receiver } = decideSides(rateNum);

      const notional =
        Number.isFinite(size) && Number.isFinite(Number(mark)) ? size * Number(mark) : NaN;
      const fundingFee =
        Number.isFinite(notional) && Number.isFinite(rateNum)
          ? notional * rateNum
          : NaN;

      const userSide =
        payer === "Long" ? "Long" : payer === "Short" ? "Short" : "Unknown";

      return (
`You can see the Funding Countdown and Current Funding Rate for each symbol/contract on the Futures Trading page.  

When that countdown is finished (every ${funding_interval || 8} hours for ${symbol}) if you have any open positions, you get affected by the funding fee payment.  

If the funding rate is **negative**, all open **Short** positions will pay funding fees to the **Long** position holders.  

If the funding rate is **positive**, all open **Long** positions will pay funding fees to the **Short** position holders.  

If we check the funding rate history:  
[Funding Fee History](https://www.binance.com/en/futures/funding-history/perpetual/funding-fee-history)  

We can see that on **${funding_time}**:  

- **${symbol} Funding Rate:** ${ratePctStr}%  
- **Mark Price:** ${mark} USDT  

So all **${payer}** positions which were open at funding time had to pay funding fees to **${receiver}** position holders, based on their position size.  

Your position was a **${userSide}** position, so you had to pay it to ${receiver} position holders.  

**Your Position Size:** ${fmtNum(size, qty_dp)} ${symbol}  

**Calculation:**  
- ${fmtNum(size, qty_dp)} × ${mark} = ${fmtNum(notional, 8)} USDT → Notional size of the position  
- ${fmtNum(notional, 8)} × ${ratePctStr}% = ${fmtNum(fundingFee, 8)} USDT → Funding fee payment from this position  

For further details, you may check the official guide:  
[What Is Futures Funding Rate And Why It Matters](https://www.binance.com/en/blog/futures/what-is-futures-funding-rate-and-why-it-matters-421499824684903247)  

⚠️ *If you don’t want to pay or receive funding fees, you should not have any open positions 1 minute before and after the funding countdown interval.*  

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`
      );
    },
    summary: ({ inputs }) => {
      const {
        symbol,
        funding_time,
        funding_rate, // string
        mark_price,
        position_size,
        funding_interval,
        qty_dp
      } = inputs;

      const rateNum = parseFloat(funding_rate);
      const ratePctStr = formatFundingRatePct(funding_rate);
      const mark = mark_price; // ✅ RAW string
      const size = Number(position_size);

      const { payer } = decideSides(rateNum);

      const notional =
        Number.isFinite(size) && Number.isFinite(Number(mark)) ? size * Number(mark) : NaN;
      const fundingFee =
        Number.isFinite(notional) && Number.isFinite(rateNum)
          ? notional * rateNum
          : NaN;

      const userSide =
        payer === "Long" ? "Long" : payer === "Short" ? "Short" : "Unknown";

      return (
`**Contract:** ${symbol}  
**Funding Time (UTC+0):** ${funding_time}  
**Funding Rate:** ${ratePctStr}%  
**Mark Price:** ${mark}  
**Funding Interval:** Every ${funding_interval || 8} hours  

**Position Size:** ${fmtNum(size, qty_dp)} ${symbol}  
Notional: ${fmtNum(notional, 8)} USDT  
Your position: **${userSide}**  
Funding Fee: ${fmtNum(fundingFee, 8)} USDT`
      );
    }
  }
};
