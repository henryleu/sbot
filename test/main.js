var WcBot = require('./wcbot');
var wcBot = new WcBot();
var json = {
    content: '忙着了吗',
    sendTo: '老婆'
}
wcBot.start();
//wcBot.readProfile('老婆', function(err, data){
//    console.log(data);
//
//})

wcBot.onReceive(function(err, data){
    if(err) return console.log(err);
    return console.log(data);

})
wcBot.onAddContact(function(err, data){
    console.log(data);
})
//wcBot.send(json, function(){
//    console.log("send ---ok")
//});
//
//wcBot.addContact('独自等待', 'a123', function(){
//    console.log("addContact ok");
//})



//websocket connect
