var WcBot = require('./wcbot');
var wcBot = new WcBot();
var json = {
    content: '这是机器人测试',
    sendTo: '老婆'
}
wcBot.start();

wcBot.send(json, function(){
    console.log("send ---ok")
});

//websocket connect
