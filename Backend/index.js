const Alpaca = require('@alpacahq/alpaca-trade-api');

const getNews = require('./hype')
// const {getNews} = pkg
getNews().then((data)=>{
  console.log(data)
});
const alpaca = new Alpaca({
  keyId: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  paper: true,
})

//Sets development status variable for console.logs
if(process.env.Development=="true"){
  var developmentStatus = true
}else{
  var developmentStatus = false
}

//Get Account Object
alpaca.getAccount().then((account) => {
  if(developmentStatus){
    console.log('Current Account:', account)
  }
})
//Place Order Function
async function placeOrder(symbol,amount_usd){
  const order = await alpaca.createOrder({
      symbol: symbol,
      //qty: 1,
      notional: amount_usd, // will buy fractional shares
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    });
    if(developmentStatus){
        console.log(`\n Order for ${order.symbol}:`)
        console.log(order)
    }
}
//Cancel Order Function
async function cancelOrder(uuid){
   await alpaca.cancelOrder(uuid).then(console.log("Order Canceld"))
}

async function getPostions(){
  var postitions = await alpaca.getPositions()
   console.log("My positions:")
   console.log(postitions)
}
async function time(){
  await alpaca.getClock().then((resp)=>{
    console.log(resp)
  })
}
time()



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
      getNews().then((data)=>{
        for(var i =0; i>10; i++){
          socket.subscribeForBars([data[i].symbol])
        }
      });
      // socket.subscribeForQuotes(["AAPL"]);
      // socket.subscribeForTrades(["FB"]);
      // socket.subscribeForBars(["AAPL"]);
      // socket.subscribeForStatuses(["*"]);
    });

    socket.onError((err) => {
      console.log(err);
    });

    // socket.onStockTrade((trade) => {
    //   console.log(trade);
    // });

    // socket.onStockQuote((quote) => {
    //   console.log(quote);
    // });

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
    // setTimeout(() => {
    //   socket.unsubscribeFromTrades(["FB"]);
    // }, 1000);
  }
}

let stream = new DataStream({
  apiKey: process.env.ALPACA_API_KEY,
  secretKey: process.env.ALPACA_SECRET_KEY,
  feed: "iex",
  paper: true,
});
  







