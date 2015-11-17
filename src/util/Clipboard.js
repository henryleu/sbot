var copyPaste = require('copy-paste');
var fs = require('fs');
var clipboard = {};
var LMQ = require('l-mq');
var queue = new LMQ(1);

clipboard.copyImageByUrl = function(mediaUrl, callback){
    //TODO check image file's existence
    fs.stat(mediaUrl, function(err, stat) {
        if(err == null) {
            var stream = fs.createReadStream(mediaUrl);
            queue.enqueue(function(stream, cb){
                console.error(stream);
                copyPaste.copy(stream, cb);
            }, {args:[stream]}, callback);
        } else if(err.code == 'ENOENT') {
            console.error('Some other error: ', err.code);
            callback(new Error('Failed to check image\'s existence error code is ' + err.code));
        } else {
            console.error('Some other error: ', err.code);
            callback(new Error('Failed to check image\'s existence error code is ' + err.code));
        }
    });
};

module.exports = clipboard;