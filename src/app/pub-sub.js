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
            pubSubService.pubClient.publish('onReceive', JSON.stringify({err: err, data: data}));
        });
    });
    return;
}
function onAddContact(channel, msg){
    service.onAddContact((err, data)=>{
        if(err) return console.log(err);
        pubSubService.pubClient.publish('onAddContact', JSON.stringify({err: err, data: data}));
    });
    return;
}
function sendHandler(channel, msg){
    console.log("***********************");
    console.log(msg)
    //msg = { ToUserName:xxx, MsgType:'text/voice/image', Content:String, Url:MediaUrl}
    var msgJson = JSON.parse(msg);
    if(msgJson.MsgType === 'text'){
        service.send({sendTo: msgJson.ToUserName, content: msgJson.Content}, (err, data)=>{
            if(err) console.log('error occur------' + JSON.stringify(err));
            pubSubService.pubClient.publish(channel, JSON.stringify({err: err, data: data}));
        });
    }
    if(msgJson.MsgType === 'image' || msgJson.MsgType === 'voice' && msgJson.Url){
        service.send({sendTo: msgJson.ToUserName, content: msgJson.Url}, (err, data)=>{
            if(err) console.log('error occur------' + JSON.stringify(err));
            pubSubService.pubClient.publish(channel, JSON.stringify({err: err, data: data}));
        });
    }
    return;
}
function readProfileHandler(channel, msg){
    //msg = {bid: String}
    var msgJson = JSON.parse(msg);
    service.readProfile(msgJson.bid, (err, data)=>{
        if(err) console.log('error occur------' + JSON.stringify(err));
        pubSubService.pubClient.publish(channel, JSON.stringify({err: err, data: data}));
    });
    return;
}
module.exports = pubSubService;