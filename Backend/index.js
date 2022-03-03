const axios = require('axios');

const Alpaca = require('@alpacahq/alpaca-trade-api');


class DataStream {
    constructor({ apiKey, secretKey, feed }) {
      this.alpaca = new Alpaca({
        keyId: apiKey,
        secretKey,
        feed,
      });
  
      const socket = this.alpaca.data_stream_v2;
  
      socket.onConnect(function () {
        console.log("Connected");
        socket.subscribeForQuotes(["AAPL"]);
        socket.subscribeForStatuses(["*"]);
      });
  
      socket.onError((err) => {
        console.log(err);
      });
  
      socket.onStockTrade((trade) => {
        console.log(trade);
      });
  
      socket.onStockQuote((quote) => {
        console.log(quote);
      });
  
      socket.onStockBar((bar) => {
        console.log(bar);
      });
  
      socket.onStatuses((s) => {
        console.log(s);
      });
  
      socket.onStateChange((state) => {
        console.log(state);
      });
  
      socket.onDisconnect(() => {
        console.log("Disconnected");
      });
  
      socket.connect();
  
      // unsubscribe from FB after a second
      setTimeout(() => {
        socket.unsubscribeFromTrades(["FB"]);
      }, 1000);
    }
  }
  
  let stream = new DataStream({
    apiKey: process.env.ALPACA_API_KEY,
    secretKey: process.env.ALPACA_SECRET_KEY,
    feed: "sip",
    paper: true,
  });
  



const alpaca = new Alpaca({
    keyId: process.env.ALPACA_API_KEY,
    secretKey: process.env.ALPACA_SECRET_KEY,
    paper: true,
    baseUrl: 'https://paper-api.alpaca.markets'
  })


async function placeOrder(symbol){
    const account = await alpaca.getAccount()
    const order = await alpaca.createOrder({
        symbol: symbol,
        qty: 1,
        //notional: account.buying_power * 0.9, // will buy fractional shares
        side: 'buy',
        type: 'market',
        time_in_force: 'day',
      });
      if(process.env.Development){
          console.log("Order for "+symbol+" Placed")
      }
}


//placeOrder("AMD")
 async function getData(){
    alpaca.lastTrade('AAPL').then((response) => {
        console.log(response)
      })
}
getData()
