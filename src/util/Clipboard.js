var exec = require('child_process').exec;
var fs = require('fs');
var clipboard = {};
var LMQ = require('l-mq');
var queue = new LMQ(1);
var copyToClipboard = require('./l-copy-paste');

clipboard.copyImageByUrl = function(mediaUrl, callback){
    //TODO check image file's existence
    fs.stat(mediaUrl, function(err, stat) {
        if(err == null) {
            queue.enqueue(copyToClipboard, {args:[mediaUrl]}, callback);
        } else if(err.code == 'ENOENT') {
            callback(new Error('Failed to copy image to clipboard, image is not exist'));
        } else {
            callback(new Error('Failed to check image\'s existence error code is ' + err.code));
        }
    });
};

module.exports = clipboard;