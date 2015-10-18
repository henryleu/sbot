var subClient = require('../app/redis-client')('sub');
var pubClient = require('../app/redis-client')('pub');
var service = require('./service');
var pubSubService = {
    pubClient: pubClient,
    subClient: subClient
};
var channelMap = {
    send: 'send',
    readProfile: 'readProfile',
    onReceive: 'onReceive',
    onAddContact: 'onAddContact',
    onDisconnect: 'onDisconnect'
};

//subscribe channel send and channel readProfile
pubSubService.subClient.subscribe('send');
pubSubService.subClient.subscribe('readProfile');

//listen message event from athena
pubSubService.subClient.on('message', function(channel, msg){
    channelMap[channel + 'Handler'].call(null, channel, msg);
});

//launch chrome client and ready to login
service.start();

//event handler
function onDisconnectHandler(channel, msg){
    service.onDisconnect(function(data){
        pubSubService.pubClient.publish('sbot:onDisconnect', data.weChatBotId);
    })
}
function onReceiveHandler(channel, msg){
    service.onReceive(function(err, msgPack){
        msgPack.msgArr.forEach(function(data){
            pubSubService.pubClient.publish('sbot:onReceive', JSON.stringify({err: err, data: data}));
        });
    });
    return;
}
function onAddContactHandler(channel, msg){
    service.onAddContact(function(err, data){
        if(err) return console.log(err);
        pubSubService.pubClient.publish('sbot:onAddContact', JSON.stringify({err: err, data: data}));
    });
    return;
}
function sendHandler(channel, msg){
    var msgJson = JSON.parse(msg);
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
    var msgJson = JSON.parse(msg);
    service.readProfile(msgJson.bid, function(err, data){
        if(err) console.log('error occur------' + JSON.stringify(err));
        pubSubService.pubClient.publish('sbot:' + channel, JSON.stringify({err: err, data: data}));
    });
    return;
}
module.exports = pubSubService;