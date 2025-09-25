// src/macros/stop_market_loss_higher_than_expected_last_price.js
import { fmtNum } from "./helpers";

function buildLastPriceBlock(prices) {
  return (
`*Last Price:*  
Opening: ${fmtNum(prices?.last?.open)}  
Highest: ${fmtNum(prices?.last?.high)}  
Lowest: ${fmtNum(prices?.last?.low)}  
Closing: ${fmtNum(prices?.last?.close)}`
  );
}

export const stopMarketLossHigherThanExpectedLastPrice = {
  id: "stop_market_loss_higher_than_expected_last_price",
  title: "Stop-Market Loss is Higher Than Expected (Trigger Last Price)",
  price_required: "both",
  fields: [
    "order_id",
    "symbol",
    "side",
    "placed_at_utc",
    "triggered_at_utc",
    "trigger_type",
    "trigger_price",
    "executed_price",
    "status"
  ],
  templates: {
    detailed: ({ inputs, prices }) => {
      const lastBlock = buildLastPriceBlock(prices);

      return (
`All the dates and times below are UTC+0, so please adjust them to your own time-zone:  

**Order ID:** ${inputs.order_id}  
${inputs.placed_at_utc} UTC+0 = You placed this Stop-Market order.  

**Trigger Condition:** ${inputs.trigger_type}  
**Trigger Price:** ${inputs.trigger_price}  

When you place a Stop-Market order with the Last Price trigger condition, it will trigger a market order as soon as Last Price reaches the trigger level, and the market order will be executed immediately.  

${inputs.triggered_at_utc} UTC+0 = The Last Price reached your trigger price and the Market order was triggered.  
Market order executed from the price of: **${inputs.executed_price}**  

The Last Price details for that minute were:  

${lastBlock}  

So the reason your stop order was filled at a different price and resulted in higher losses is because a **Stop-Market order is a conditional market order**.  
Unlike limit orders, a market order doesn’t guarantee the filling price but ensures immediate execution at the best available price. This difference is called *slippage* and is expected when using stop-market orders.  

For more information, you may check:  

[What Are Stop Orders in Binance Futures?](https://www.binance.com/blog/futures/what-are-stop-orders-in-binance-futures-2094497753519691034)  

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`
      );
    },
    summary: ({ inputs, prices }) => {
      const lastBlock = buildLastPriceBlock(prices);

      return (
`**Order ID:** ${inputs.order_id}  
Placed: ${inputs.placed_at_utc} UTC+0  
Triggered: ${inputs.triggered_at_utc} UTC+0  
Executed at: ${inputs.executed_price}  

**Trigger:** ${inputs.trigger_type} @ ${inputs.trigger_price}  

${lastBlock}  

➡️ The Stop-Market order was triggered by **Last Price** and executed immediately at the best available market price.  
This caused the execution price to differ from your trigger level (*slippage*), resulting in a higher loss than expected.  

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`
      );
    }
  }
};
