var exec = require('child_process').exec;
var fs = require('fs');
var clipboard = {};
var LMQ = require('l-mq');
var queue = new LMQ(1);
//var copyToClipboard = require('bluebird').promisify(require('./l-copy-paste').copy);
var copyToClipboard = require('bluebird').promisify(copyIt);

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
function copyIt(url, callback){
    exec('cat ' + url + ' | xclip -selection c', function(err){
        if(err){
            console.error(err);
            callback(err)
        }else{
            callback(null)
        }
    })
}

module.exports = clipboard;