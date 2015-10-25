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
    Bots.prototype.removeBot = function(id){
        delete botsContainer[id];
    };
    Bots.prototype.getBots = function(){
        return botsContainer;
    };
    return Bots;
}());
var bots = new Bots();
var channelMap = {
    'sbot:start': startHandler,
    'sbot:stop': stopHandler,
    'sbot:message-send': sendHandler,
    'sbot:profile-request': readProfileHandler
};

//subscribe channel start, send and channel readProfile
pubSubService.subClient.subscribe('sbot:start');
pubSubService.subClient.subscribe('sbot:stop');
pubSubService.subClient.subscribe('sbot:message-send');
pubSubService.subClient.subscribe('sbot:profile-request');

//listen message event from athena
pubSubService.subClient.on('message', function(channel, message){
    console.log(message);
    try{
        var msg = JSON.parse(message);
        if(channelMap[channel]){
            channelMap[channel].call(null, channel, msg);
        }else{
            throw new Error('channel ' + channel + ': does not exist');
        }
    }catch(e){
        console.warn(e.message);
    }
});

//event handler
function startHandler(channel, msg){
    //msg = {id:'id'}
    if(bots.getBotById(msg.botid)){
        console.warn('the bot is started already.');
        return;
    }
    var service = new Service(msg.botid);
    service.onNeedLogin(function(err, data){
        if(err) return console.log(err);
        pubSubService.pubClient.publish('sbot:need-login', JSON.stringify({err: err, data: data}));
    });
    service.onReceive(function(err, msgPack){
        console.log(msgPack);
        msgPack.msgArr.forEach(function(data){
            pubSubService.pubClient.publish('sbot:message', JSON.stringify({err: err, data: data}));
        });
    });
    service.onAddContact(function(err, data){
        console.log(data);
        if(err) return console.log(err);
        pubSubService.pubClient.publish('sbot:contact-added', JSON.stringify({err: err, data: data}));
    });
    bots.setBot(service);
    service.start();
}

function stopHandler(channel, msg){
    var service = bots.getBotById(msg.botid);
    if(!service){
        console.warn('has no such bot[botid] = ' + msg.botid);
        return;
    }
    service.stop().then(function(){
        bots.removeBot(msg.botid);
    });
}

function sendHandler(channel, msg){
    var service = bots.getBotById(msg.botid);
    if(!service){
        console.warn('has no such bot[botid] = ' + msg.botid);
        return;
    }
    //msg = { ToUserName:xxx, MsgType:'text/voice/image', Content:String, Url:MediaUrl}
    service.send({sendTo: msg.ToUserName, content: msg.Content}, function(err, data){
        if(err) console.log('error occur------' + JSON.stringify(err));
    });
}

function readProfileHandler(channel, msg){
    var service = bots.getBotById(msg.botid);
    if(!service){
        console.warn('has no such bot[botid] = ' + msg.botid);
        return;
    }
    //msg = {bid: String}
    service.readProfile(msg.bid, function(err, data){
        console.log(data);
        if(err) console.log('error occur------' + JSON.stringify(err));
        pubSubService.pubClient.publish('sbot:profile', JSON.stringify({err: err, data: data}));
    });
}

module.exports = pubSubService;