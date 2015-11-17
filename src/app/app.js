var http = require('http');
var server = http.createServer(function(req, res){
    console.log('system is up');
});
require('./init');
require('./pub-sub');
server.listen(3040, '127.0.0.1');