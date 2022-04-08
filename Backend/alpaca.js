
//Import 
const Alpaca = require('@alpacahq/alpaca-trade-api');
const { get } = require('@alpacahq/alpaca-trade-api/dist/resources/account');
const getNews = require('./hype')


getNews().then((data)=>{
  console.log(data)
}).catch((err)=>{
  console.log("Could not get News: "+err)
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
var GlobalBuyingPower
async function BuyingPower(){
  const account = await alpaca.getAccount();
  return account["buying_power"]-25000
}

//Get Account Object
BuyingPower().then((data)=>{
  console.log(data)
}).catch((err)=>{
  console.log("Could not print buying power: "+err)
});

async function order(symbol,amount_usd){
    const order =  await alpaca.createOrder({
      symbol: symbol,
      //qty: 1,
      notional: amount_usd, // will buy fractional shares
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    }).then((error)=>{
      console.log("Could not create "+symbol+ " order: "+error);
    });
    if(developmentStatus){
      try{
        console.log(`\n Order for ${order.symbol}:`)
      }catch{
        console.log("ORDER CANCELED")
      }
    }

  
}
//Place Order Function
async function placeOrder(symbol,amount_usd){
  alpaca.getPositions().then(function(positions){
    if(positions.length==0){
      order(symbol,amount_usd)
    }else{
      for(var i=0; i<positions.length; i++){
        if(positions[i]["symbol"]!=symbol){
            order(symbol,amount_usd)
          }
        }
    }
  }).catch((error)=>{
    console.log("Could not get positions:"+error)
  });
}



//Cancel Order Function
async function cancelOrder(uuid){
   await alpaca.cancelOrder(uuid).then(console.log("Order Canceld"))
}
async function sellAsset(symbol){
  alpaca.getPositions().then(function(positions){
  for(var i=0; i<positions.length; i++){
    if(positions[i]["symbol"]==symbol){
      alpaca.closePosition(symbol).then(console.log("Closed Postion: "+symbol)).catch((error)=>{
        console.log("FAILED TO CLOASE POSTION WITH: "+error)
      })
    }
  }
  }).catch((error)=>{
    console.log("COULD NOT GET POSTIONS: "+error)
  })
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
function currentStocks(){
  return new Promise((res,rej)=>{
    var currentStocks =[]
    getNews().then((data)=>{
    for(var i=0; i<20; i++){
      currentStocks.push(data[i]["symbol"]);
    }
    alpaca.getPositions().then((positions)=>{
      for(var i=0; i<positions.length; i++){
        if(currentStocks.indexOf(positions[i]["symbol"])==-1){
          currentStocks.push(positions[i]["symbol"]);
        }
      }
      return res(currentStocks)
    }).catch((err)=>{
      return rej(err)
    })
  }).catch((err)=>{
    return rej(err)
  })
  })
}

currentStocks().then((data)=>{
  console.log(data)
});
async function trade(bar){

}



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
      // getNews().then((data)=>{
      //   for(var i =0; i<20; i++){
      //     socket.subscribeForBars([data[i].symbol])
      //     console.log("Connectd to: "+data[i].symbol)
      //   }
      // }).catch((err)=>{
      //   console.log("Could not get news: "+err)
      // });
      currentStocks().then((data)=>{
        for(var i=0; i<data.length; i++){
          socket.subscribeForBars([data[i]])
          console.log("Connectd to: "+data[i])
        }
      });
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
       console.log(bar)
      if(bar["ClosePrice"]>bar["OpenPrice"]){
        BuyingPower().then((data)=>{
          console.log("Buying Power: "+data)
          if(data!=0){
            placeOrder(bar["Symbol"],(data)/30)
          }
        }).catch(console.log("COULD NOT FETCH BUYING POWER"));
      }
      if(bar["ClosePrice"]<bar["OpenPrice"]){
        console.log("short"+bar["Symbol"])
        sellAsset(bar["Symbol"])
      }
      
      console.log(bar)
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
async function run(){
  await alpaca.getClock().then((resp) =>{
    closingTime = new Date(resp.next_close.substring(0, resp.next_close.length - 6));
    currTime = new Date(resp.timestamp.substring(0, resp.timestamp.length - 6));
  }).catch((err) => {console.log(err.error);});
  this.timeToClose = closingTime - currTime;
  
  if(this.timeToClose < (60000 * 15)) {
    // Close all positions when 15 minutes til market close.
    console.log("Market closing soon.  Closing positions.")
  }
}
run()
  







