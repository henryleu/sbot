var http = require('http');
var server = http.createServer(function(req, res){
    console.log('system is up');
});
require('./pub-sub');
server.listen(3000, '127.0.0.1');