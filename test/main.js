var WcBot = require('./wcbot');
var wcBot = new WcBot();
var json = {
    content: '这是机器人测试',
    sendTo: '独自等待'
}
wcBot.start();
wcBot.send(json);
wcBot.onReceive(function(json){

})
//websocket connect
