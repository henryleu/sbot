var subClient = require('../app/redis-client')('sub');
var pubClient = require('../app/redis-client')('pub');
var service = require('../modules/didi');
var pubSubService = {
    pubClient: pubClient,
    subClient: subClient
};
var passiveChannels = [
    'submitFastCarOrder',
    'cancelOrder'
];
var activeChannels = [
    'OrderRejected',
    'OrderApplying',
    'OrderUndertaken',
    'OrderCancelled',
    'OrderApplyingTimeout',
    'OrderInService',
    'OrderCompleted'
];
//didi Service
passiveChannels.forEach(function(channel){
    pubSubService.subClient.subscribe('DD' + channel);
});
pubSubService.subClient.on('message', function(channel, msg){
    var cmd = channel.substring(3);
    service[cmd](JSON.parse(msg));
});
activeChannels.forEach(function(channel){
    service.on(channel, function(order){
        pubSubService.pubClient.publish('DD' + channel, JSON.stringify(order));
    });
});
module.exports = null;