var subClient = require('../app/redis-client')('sub');
var pubClient = require('../app/redis-client')('pub');
var service = require('./service');
const pubSubService = {
    pubClient: pubClient,
    subClient: subClient
};
const passiveChannels = [
    'onReceive',
    'onAddContact'
];
const activeChannels = [
    'send',
    'readProfile'
];
service.start();
//echo test system
service.onReceive((err, data)=>{
    console.log("?????????????????????????????????");
    console.log(data)
    //if(err) return console.log(err);
    service.send({sendTo: data.bid, content: data.msgArr[0].payLoad}, ()=>{});
});
activeChannels.forEach((channel)=>{
    pubSubService.subClient.subscribe(channel);
});
pubSubService.subClient.subscribe('onReceive');
pubSubService.subClient.subscribe('onAddContact');

pubSubService.subClient.on('message', (channel, msg)=>{
    if(channel === 'onReceive'){
        service.onReceive(function(err, data){
            if(err) return console.log(err);
            pubSubService.pubClient.publish('onReceive', JSON.stringify(data));
        });
        return;
    }
    if(channel === 'onAddContact'){
        service.onReceive(function(err, data){
            if(err) return console.log(err);
            pubSubService.pubClient.publish('onAddContact', JSON.stringify(data));
        });
        return;
    }
    if(activeChannels.indexOf(channel) != -1){
        service[channel].call(service, JSON.parse(msg), (err, data)=>{
            if(err) console.log('error occur------' + JSON.stringify(e));
            pubSubService.pubClient.publish(channel, JSON.stringify(data));
        });
        return;
    }
    console.log('has not such channel');
});
module.exports = pubSubService;