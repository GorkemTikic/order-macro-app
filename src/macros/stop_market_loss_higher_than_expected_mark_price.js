// src/macros/stop_market_loss_higher_than_expected_mark_price.js
import { fmtNum, upper } from "./helpers";

function buildPriceBlock(inputs, prices) {
  // ... (içerik değişmedi, gizlendi)
  const side = upper(inputs.side);

  if (side === "SELL") {
    return (
`> Lowest **Mark Price**: ${fmtNum(prices?.mark?.low)}  
> Lowest **Last Price**: ${fmtNum(prices?.last?.low)}`
    );
  } else if (side === "BUY") {
    return (
`> Highest **Mark Price**: ${fmtNum(prices?.mark?.high)}  
> Highest **Last Price**: ${fmtNum(prices?.last?.high)}`
    );
  }
  return (
`> Mark High/Low: ${fmtNum(prices?.mark?.high)} / ${fmtNum(prices?.mark?.low)}  
> Last High/Low: ${fmtNum(prices?.last?.high)} / ${fmtNum(prices?.last?.low)}`
  );
}

export const stopMarketLossHigherThanExpectedMarkPrice = {
  id: "stop_market_loss_higher_than_expected_mark_price",
  title: "Stop-Market Loss is Higher Than Expected (Trigger Mark Price)",
  price_required: "both",
  
  // ✅ YENİ: Form Yapılandırması
  formConfig: [
    {
      name: "order_id",
      label: "Order ID",
      type: "text",
      placeholder: "8389...",
      col: 6
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["EXECUTED"], // Sadece EXECUTED
      defaultValue: "EXECUTED",
      locked: true,
      col: 6
    },
    {
      name: "symbol",
      label: "Symbol",
      type: "text",
      placeholder: "ETHUSDT",
      defaultValue: "ETHUSDT",
      col: 6
    },
    {
      name: "side",
      label: "Side",
      type: "select",
      options: ["SELL", "BUY"],
      defaultValue: "SELL",
      col: 6
    },
    {
      name: "placed_at_utc",
      label: "Placed At (UTC, YYYY-MM-DD HH:MM:SS)",
      type: "text",
      placeholder: "2025-09-11 06:53:08",
      col: 6
    },
    {
      name: "trigger_type",
      label: "Trigger Type",
      type: "text",
      defaultValue: "MARK",
      locked: true, // Bu makro sadece MARK içindir
      col: 6
    },
    {
      name: "trigger_price",
      label: "Trigger Price",
      type: "text",
      placeholder: "e.g. 4393.00",
      col: 6
    },
    {
      name: "executed_price",
      label: "Executed Price",
      type: "text",
      placeholder: "e.g. 4331.67",
      col: 6
    },
    {
      name: "triggered_at_utc", // App.jsx bu adı özel olarak ele alır
      label: "Executed At (UTC, YYYY-MM-DD HH:MM:SS)", // App.jsx bu etiketi ezecek
      type: "text",
      placeholder: "2025-09-11 12:30:18",
      col: 12
    }
  ],
  
  templates: {
    detailed: ({ inputs, prices }) => {
      // ... (içerik değişmedi, gizlendi)
      const priceBlock = buildPriceBlock(inputs, prices);

      return (
`All the dates and times below are UTC+0, so please adjust them to your own time-zone:  

**Order ID:** ${inputs.order_id}  
${inputs.placed_at_utc} UTC+0 = You placed this Stop-Market order.  

**Trigger Condition:** ${inputs.trigger_type}  
**Trigger Price:** ${inputs.trigger_price}  

When you place a Stop-Market order with the Mark Price trigger condition, it will trigger a market order when Mark Price reaches trigger price and market order will be executed from *Last Price.* ${inputs.triggered_at_utc} UTC+0 = The Mark Price reached your trigger price and the Market order was triggered.  
Market order executed from the price of: **${inputs.executed_price}** The reason of this difference can be seen on the price chart as well, if you check the Mark Price and Last Price Chart on that minute:  

${priceBlock}  

So there are 2 reasons why your stop order was filled at a different price and increased the losses from the expected amount, as we will explain below.  

**1 -) Stop Market order:** Please keep in mind that a stop-market order is a conditional market order, a market order is a quick trading action to allow traders to buy or sell, and unlike limit orders, a market order doesn’t guarantee the filling price but ensures the timing to enter the market. *This implies that a stop market order will be immediately executed and filled in the market after stop condition satisfied at the best available price of that moment.* So what happened to you is pretty much this: You set a trigger price for your stop market order and once the trigger price is reached, the system will automatically execute a market order, and so there is no way to guarantee what the filling price will be.  

**2 -) Trigger set as Mark Price:** We have also noticed that you are using Mark Price as the trigger for your Stop orders, in these cases the order is triggered by Mark price and filled by Last price, that's another reason for the difference you are seeing in the execution price.  

We kindly ask you to understand that Mark Price is not the same price that is shown on the trading page, and it is the price used in Binance to trigger liquidations and to calculate unrealized PNL - as it is also an option for the trigger price for stop-orders (Users can choose between Mark Price or Last Price when creating Stop-Price).  

For a better understanding of all these concepts, you can check these links:  

[What Is the Difference Between a Futures Contract’s Last Price and Mark Price?](https://www.binance.com/blog/futures/what-is-the-difference-between-a-futures-contracts-last-price-and-mark-price-5704082076024731087)  

[What Are Stop Orders in Binance Futures?](https://www.binance.com/blog/futures/what-are-stop-orders-in-binance-futures-2094497753519691034)  

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`
      );
    },
    summary: ({ inputs, prices }) => {
      // ... (içerik değişmedi, gizlendi)
      const priceBlock = buildPriceBlock(inputs, prices);

      return (
`**Order ID:** ${inputs.order_id}  
Placed: ${inputs.placed_at_utc} UTC+0  
Triggered: ${inputs.triggered_at_utc} UTC+0  
Executed at: ${inputs.executed_price}  

**Trigger:** ${inputs.trigger_type} @ ${inputs.trigger_price}  

${priceBlock}  

➡️ Your Stop-Market order was triggered when **Mark Price** reached the trigger, but it was executed at **Last Price**.  
Since a Stop-Market is a conditional market order, it fills at the best available market price, which may differ from your trigger level.  

As a result, the execution price differed from your expectation, causing a higher loss.  

Hope this clarifies your queries 🙏 If you have any further questions, don’t hesitate to share them with me.`
      );
    }
  }
};
