
function calcPERatio(sharePrice,Earnings,numOfShares){
    earningsPerShare = Earnings/numOfShares
    return sharePrice/earningsPerShare
}


var https = require('follow-redirects').https;


var options = {
  'method': 'GET',
  'hostname': 'data.alpaca.markets',
  'path': '/v1beta1/news?limit=50&include_content=false',
  'headers': {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY
  },
  'maxRedirects': 20
};

function getNews(){
  return new Promise((resolve,reject)=> {
    const req = https.request(options, (res)=>{
      if(res.statusCode <200 || res.statusCode >= 300){
        return reject(new Error('statusCode='+res.statusCode))
      }
      var body = [];
      res.on("data", function(chunk){
        body.push(chunk);
      });
      res.on('end',function(){
        try {
          body = JSON.parse(Buffer.concat(body));
          var symbols = []
          for(x in body["news"]){
              symbols=symbols.concat(body["news"][x].symbols)
          }
          body = rank(symbols)
        }catch(e){
          reject(e);
        }
        resolve(body);
      });
    });
    req.on('error',(e)=>{
      reject(e.message);
    });
    req.end();
  });
}
// getNews().then((data)=>{
//   console.log(data)
// });

function rank(symbols){
    class SymbolCount{
        constructor(symbol,count){
            this.symbol=symbol;
            this.count=count;
        }
    }
    countx =[]
    myList = []
    symbols.forEach(function (x){ countx[x] = (countx[x] || 0) + 1; });
    symbols_key = Object.keys(countx)
    countx = Object.values(countx)
    for(var i =0; i<countx.length; i++){
        myList[i] = new SymbolCount(symbols_key[i],countx[i])
    }
    myList.sort((a,b)=>{
        return b.count - a.count;
    })
    return myList
}

module.exports = getNews