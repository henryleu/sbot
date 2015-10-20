var subClient = require('../app/redis-client')('sub');
var pubClient = require('../app/redis-client')('pub');
var Service = require('./service');
var pubSubService = {
    pubClient: pubClient,
    subClient: subClient
};
var Bots = (function(){
    var botsContainer = {};
    function Bots(){}
    Bots.prototype.getBotById = function(id){
        return botsContainer[id];
    };
    Bots.prototype.setBot = function(bot){
        botsContainer[bot.id] = bot;
    };
    Bots.prototype.getBots = function(){
        return botsContainer;
    };
    return Bots;
}());
var bots = new Bots();
var channelMap = {
    start: startHandler,
    stop: stopHandler,
    send: sendHandler,
    readProfile: readProfileHandler
};

//subscribe channel start, send and channel readProfile
pubSubService.subClient.subscribe('sbot:start');
pubSubService.subClient.subscribe('sbot:stop');
pubSubService.subClient.subscribe('sbot:send');
pubSubService.subClient.subscribe('sbot:readProfile');

//listen message event from athena
pubSubService.subClient.on('message', function(channel, msg){
    var cn = channel.split(':')[1];
    channelMap[cn].call(null, cn, msg);
});

//event handler
function startHandler(channel, msg){
    //msg = {id:'id'}
    var json = JSON.parse(msg);
    var service = new Service(json.botid);
    service.onNeedLogin(function(err ,data){
        if(err) return console.log(err);
        pubSubService.pubClient.publish('sbot:onNeedLogin', JSON.stringify({err: err, data: data}));
    });
    service.onReceive(function(err, msgPack){
        msgPack.msgArr.forEach(function(data){
            pubSubService.pubClient.publish('sbot:onReceive', JSON.stringify({err: err, data: data}));
        });
    });
    service.onAddContact(function(err, data){
        if(err) return console.log(err);
        pubSubService.pubClient.publish('sbot:onAddContact', JSON.stringify({err: err, data: data}));
    });
    service.onDisconnect(function(data){
        pubSubService.pubClient.publish('sbot:onDisconnect', JSON.stringify({err: err, data: data}));
    });
    bots.setBot(service);
    service.start();
}

function stopHandler(channel, msg){
    //TODO
}

function sendHandler(channel, msg){
    var msgJson = JSON.parse(msg);
    var service = bots.getBotById(msgJson.id);
    //msg = { ToUserName:xxx, MsgType:'text/voice/image', Content:String, Url:MediaUrl}
    if(msgJson.MsgType === 'text'){
        service.send({sendTo: msgJson.ToUserName, content: msgJson.Content}, function(err, data){
            if(err) console.log('error occur------' + JSON.stringify(err));
            pubSubService.pubClient.publish('sbot:' + channel, JSON.stringify({err: err, data: msgJson}));
        });
    }
    if(msgJson.MsgType === 'image' || msgJson.MsgType === 'voice' && msgJson.Url){
        service.send({sendTo: msgJson.ToUserName, content: msgJson.Url}, function(err, data){
            if(err) console.log('error occur------' + JSON.stringify(err));
            pubSubService.pubClient.publish('sbot:' + channel, JSON.stringify({err: err, data: msgJson}));
        });
    }
    return;
}

function readProfileHandler(channel, msg){
    //msg = {bid: String}
    var service = bots.getBotById(msgJson.botid);
    var msgJson = JSON.parse(msg);
    service.readProfile(msgJson.bid, function(err, data){
        if(err) console.log('error occur------' + JSON.stringify(err));
        pubSubService.pubClient.publish('sbot:' + channel, JSON.stringify({err: err, data: data}));
    });
    return;
}

setTimeout(function(){
    pubSubService.pubClient.publish('sbot:start', JSON.stringify({botid: 1}));
}, 1000);
setTimeout(function(){
    pubSubService.pubClient.publish('sbot:start', JSON.stringify({botid: 2}));
}, 3000);
setTimeout(function(){
    console.log(bots.getBots())
}, 5000);
module.exports = pubSubService;