var subClient = require('../app/redis-client')('sub');
var pubClient = require('../app/redis-client')('pub');
var Service = require('./service');
var botManagar = require('./BotManagar');
var pubSubService = {
    pubClient: pubClient,
    subClient: subClient
};
var channelMap = {
    'sbot:start': startHandler,
    'sbot:stop': stopHandler,
    'sbot:message-send': sendHandler,
    'sbot:profile-request': readProfileHandler,
    'sbot:group-list-request': groupListHandler,
    'sbot:contact-list-remark-request': contactListRemarkHandler,
    'sbot:contact-list-request': contactListHandler
};

//subscribe channel start, send and channel readProfile
pubSubService.subClient.subscribe('sbot:start');
pubSubService.subClient.subscribe('sbot:stop');
pubSubService.subClient.subscribe('sbot:message-send');
pubSubService.subClient.subscribe('sbot:profile-request');
pubSubService.subClient.subscribe('sbot:group-list-request');
pubSubService.subClient.subscribe('sbot:contact-list-request');
pubSubService.subClient.subscribe('sbot:contact-list-remark-request');

//do some test
//pubSubService.pubClient.publish('sbot:start', JSON.stringify({
//    botid: 'qtds'
//}));
//pubSubService.pubClient.publish('sbot:message-send', JSON.stringify({
//    botid: 'qtds',
//    Url: ''
//}));

//listen message event from athena
pubSubService.subClient.on('message', function(channel, message){
    console.log("redis recieve a message, channel is " + channel + " , message is " + message)
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
    console.log("[system]: the bot[id]=" + msg.botid + " is starting...");
    if(botManagar.getBotById(msg.botid)){
        console.warn('[system]: the bot is started already.');
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
    service.onLogin(function(err, data){
        console.log("login-data is " + require('util').inspect(data));
        if(err) return console.log(err);
        pubSubService.pubClient.publish('sbot:login', JSON.stringify({err: err, data: data}));
    });
    service.onAbort(function(err, data){
        console.log(data);
        if(err) return console.log(err);
        pubSubService.pubClient.publish('sbot:abort', JSON.stringify({err: err, data: data}));
    });
    service.onRemarkContact(function(err, data){
        console.error(data);
        if(err) return console.log(err);
        pubSubService.pubClient.publish('sbot:contact-remarked', JSON.stringify({err: err, data: data}));
    });
    service.onContactProfile(function(err, data){
        console.error(data);
        if(err) return console.log(err);
        pubSubService.pubClient.publish('sbot:contact-profile', JSON.stringify({err: err, data: data}));
    });
    botManagar.setBot(service);
    service.start();
}

function stopHandler(channel, msg){
    var service = botManagar.getBotById(msg.botid);
    if(!service){
        console.warn('has no such bot[botid] = ' + msg.botid);
        return;
    }
    if(!service.loggedIn){
        console.warn('the bot[botid] = ' + msg.botid + ' haven,t login');
        return;
    }
    service.stop().then(function(){
        botManagar.removeBot(msg.botid);
    });
}

function sendHandler(channel, msg){
    console.info("handing the send message request...");
    var service = botManagar.getBotById(msg.FromUserName);
    if(!service){
        console.warn('has no such bot[botid] = ' + msg.FromUserName);
        return;
    }
    if(!service.loggedIn){
        console.warn('the bot[botid] = ' + msg.botid + ' haven,t login');
        return;
    }
    //msg = { ToUserName:xxx, MsgType:'text/voice/image', Content:String, Url:MediaUrl}
    var allowType = {
        text: buildSendFn('text')(msg.Content),
        image: buildSendFn('image')(msg.Url)
    };
    if(!(msg.MsgType in allowType)){
        return console.warn('[system]: send message failed, the message type is invalid');
    }
    allowType[msg.MsgType]();
    function buildSendFn(type){
        return function(content){
            return function(){
                console.log("************");
                console.log(type);
                console.log(content);
                console.log(service["send" + firstCharToUppercase(type)]);
                service["send" + firstCharToUppercase(type)].call(service, {sendTo: msg.ToUserName, content: content}, function(err){
                    if(err) console.log('error occur------' + JSON.stringify(err));
                });
            }
        }
    }
    function firstCharToUppercase(str){
        var fc = str.substr(0, 1);
        var rs = str.substr(1);
        return fc.toUpperCase() + rs;
    }
}

function readProfileHandler(channel, msg){
    console.info("handing the read profile request...");
    var service = botManagar.getBotById(msg.botid);
    if(!service){
        console.warn('has no such bot[botid] = ' + msg.botid);
        return;
    }
    if(!service.loggedIn){
        console.warn('the bot[botid] = ' + msg.botid + ' haven,t login');
        return;
    }
    //msg = {bid: String}
    service.readProfile(msg.bid, function(err, data){
        console.log(data);
        if(err) console.log('error occur------' + JSON.stringify(err));
        pubSubService.pubClient.publish('sbot:profile', JSON.stringify({err: err, data: data}));
    });
}

function contactListHandler(channel, msg){
    console.info("handing the contact list request...");
    var service = botManagar.getBotById(msg.botid);
    if(!service){
        console.warn('has no such bot[botid] = ' + msg.botid);
        return;
    }
    if(!service.loggedIn){
        console.warn('the bot[botid] = ' + msg.botid + ' haven,t login');
        return;
    }
    service.contactList(function(err, data){
        if(err) {
            return console.log('failed to contact list error occur------' + JSON.stringify(err));
        }
        console.log("succeed to remark contact list");
    });
}

function contactListRemarkHandler(channel, msg){
    console.info("handing the contact list remark request...");
    var service = botManagar.getBotById(msg.botid);
    if(!service){
        console.warn('has no such bot[botid] = ' + msg.botid);
        return;
    }
    if(!service.loggedIn){
        console.warn('the bot[botid] = ' + msg.botid + ' haven,t login');
        return;
    }
    service.contactListRemark(function(err, data){
        if(err) {
            return console.log('failed to contact list error occur------' + JSON.stringify(err));
        }
        console.log("succeed to remark contact list");
    });
}

function groupListHandler(channel, msg){
    console.info("handing the group list request...");
    var service = botManagar.getBotById(msg.botid);
    if(!service){
        console.warn('has no such bot[botid] = ' + msg.botid);
        return;
    }
    if(!service.loggedIn){
        console.warn('the bot[botid] = ' + msg.botid + ' haven,t login');
        return;
    }
    service.groupList(function(err, data){
        if(err) {
            return console.log('failed to group list error occur------' + JSON.stringify(err));
        }
        console.log("succeed to get group list info");
        console.log(data);
        pubSubService.pubClient.publish('sbot:group-list', JSON.stringify({err: err, data: data}));
    });
}

module.exports = pubSubService;