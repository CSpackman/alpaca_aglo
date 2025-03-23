
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

async function BuyingPower(){
  const account = await alpaca.getAccount();
  return (account["cash"])
}

//Get Account Object
BuyingPower().then((data)=>{
  console.log(data)
  GlobalBuyingPower = data
  console.log("Global Buying Power: "+GlobalBuyingPower)
}).catch((err)=>{
  console.log("Could not print buying power: "+err)
});

async function order(symbol,amount_usd){
    console.log("Tracked Power:"+GlobalBuyingPower)
    const order =  await alpaca.createOrder({
      symbol: symbol,
      //qty: 1,
      notional: amount_usd, // will buy fractional shares
      side: 'buy',
      type: 'market',
      time_in_force: 'day',
    }).then(()=>{
      console.log("Order for "+symbol+" Placed")
    }

    ).catch((error)=>{
      console.log("Could not create "+symbol+ " order: "+error);
    });

  
}
//Place Order Function
async function placeOrder(symbol){
  BuyingPower().then((data)=>{
    console.log("Buying Power Fetched: "+data)
    if(data>10000){
    alpaca.getPositions().then(function(positions){
      if(positions.length==0){
        order(symbol,10000)
      }else{
        for(var i=0; i<positions.length; i++){
          if(positions[i]["symbol"]!=symbol){
              order(symbol,10000)
            }
          }
      }
    }).catch((error)=>{
      console.log("Could not get positions:"+error)
    });
  }
  })
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
      BuyingPower().then((data)=>console.log("Buying Power",data))
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
    var currentBars = []
    socket.onStockBar((bar) => {
      console.log(bar)
      BuyingPower().then((data)=>console.log(data))
      currentBars.push(bar)


      if(bar["ClosePrice"]<bar["OpenPrice"]){
          placeOrder(bar["Symbol"]).catch((err)=>{
            console.log(err)
          })
        }
      // if(bar["ClosePrice"]>bar["OpenPrice"]){
      //   console.log("Sell: "+bar["Symbol"])
      //   sellAsset(bar["Symbol"])
      // }
      
      // console.log(bar)
    });
    setTimeout(() => {
      console.log("Delayed for 1 second.");
    }, "1000") 

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


// async function run(){
//   await alpaca.getClock().then((resp) =>{
//     closingTime = new Date(resp.next_close.substring(0, resp.next_close.length - 6));
//     currTime = new Date(resp.timestamp.substring(0, resp.timestamp.length - 6));
//   }).catch((err) => {console.log(err.error);});
//   this.timeToClose = closingTime - currTime;
  
//   if(this.timeToClose < (60000 * 15)) {
//     // Close all positions when 15 minutes til market close.
//     console.log("Market closing soon.  Closing positions.")
//   }
// }
// run()
  







