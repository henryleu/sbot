var http = require('http');
var server = http.createServer();
require('./pub-sub');
server.listen(3000, '127.0.0.1', '0.0.0.0', ()=>{
    console.log('system is up')
});