var subClient = require('../app/redis-client')('sub');
var pubClient = require('../app/redis-client')('pub');
var service = require('./service');
const pubSubService = {
    pubClient: pubClient,
    subClient: subClient
};
const channels = [
    'send',
    'readProfile',
    'onReceive',
    'onAddContact'
];
service.start();
channels.forEach((channel)=>{
    pubSubService.subClient.subscribe(channel);
});
pubSubService.subClient.on('message', (channel, msg)=>{
    eval(channel + 'Handler').call(null, channel, msg);
});
function onReceiveHandler(channel, msg){
    service.onReceive((err, msgPack)=>{
        console.log("receive-----------------------")
        console.log(msgPack)
        msgPack.msgArr.forEach((data)=>{
            pubSubService.pubClient.publish('sbot:onReceive', JSON.stringify({err: err, data: data}));
        });
    });
    return;
}
function onAddContactHandler(channel, msg){
    console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&");
    console.log(msg);
    service.onAddContact((err, data)=>{
        if(err) return console.log(err);
        pubSubService.pubClient.publish('sbot:onAddContact', JSON.stringify({err: err, data: data}));
    });
    return;
}
function sendHandler(channel, msg){
    var msgJson = JSON.parse(msg);
    //msg = { ToUserName:xxx, MsgType:'text/voice/image', Content:String, Url:MediaUrl}
    if(msgJson.MsgType === 'text'){
        service.send({sendTo: msgJson.ToUserName, content: msgJson.Content}, (err, data)=>{
            console.log("---------------------------");
            console.log(err)
            console.log(data);
            if(err) console.log('error occur------' + JSON.stringify(err));
            pubSubService.pubClient.publish('sbot:' + channel, JSON.stringify({err: err, data: msgJson}));
        });
    }
    if(msgJson.MsgType === 'image' || msgJson.MsgType === 'voice' && msgJson.Url){
        service.send({sendTo: msgJson.ToUserName, content: msgJson.Url}, (err, data)=>{
            if(err) console.log('error occur------' + JSON.stringify(err));
            pubSubService.pubClient.publish('sbot:' + channel, JSON.stringify({err: err, data: msgJson}));
        });
    }
    return;
}
function readProfileHandler(channel, msg){
    //msg = {bid: String}
    console.log("&&&&&&&&&&&&&&&&&&&&&&");
    console.log(msg);
    var msgJson = JSON.parse(msg);
    console.log(msgJson);
    service.readProfile(msgJson.bid, (err, data)=>{
        if(err) console.log('error occur------' + JSON.stringify(err));
        pubSubService.pubClient.publish('sbot:' + channel, JSON.stringify({err: err, data: data}));
    });
    return;
}
module.exports = pubSubService;