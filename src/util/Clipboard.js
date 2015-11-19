var exec = require('child_process').exec;
var fs = require('fs');
var clipboard = {};
var LMQ = require('l-mq');
var queue = new LMQ(1);

clipboard.copyImageByUrl = function(mediaUrl, callback){
    //TODO check image file's existence
    fs.stat(mediaUrl, function(err, stat) {
        if(err == null) {
            queue.enqueue(function(mediaUrl, cb){
                copyToClipboard(mediaUrl, function(){
                    readFromClipboard(cb)
                });
            }, {args:[mediaUrl]}, callback);
        } else if(err.code == 'ENOENT') {
            callback(new Error('Failed to copy image to clipboard, image is not exist'));
        } else {
            callback(new Error('Failed to check image\'s existence error code is ' + err.code));
        }
    });
};
function copyToClipboard(mediaUrl,  callback){
    exec('python ' + __dirname + '/copyToClipboard.py ' + mediaUrl,
        function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.error('[flow]: Failed to copy image to clipboard');
            return callback(new Error('[flow]: Failed to copy image to clipboard'))
        }
        console.info('[flow]: Succeed to copy image to clipboard');
        callback(null)
    })
}

function readFromClipboard(callback){
    exec('python ' + __dirname + '/pasteFromClipboard.py',
        function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.info('[flow]: Failed to copy image to clipboard');
            }
            console.info('[flow]: Succeed to copy image to clipboard');
            callback(null, stdout)
        })
}

//clipboard.copyImageByUrl = function(mediaUrl, callback){
//    //TODO check image file's existence
//    fs.stat(mediaUrl, function(err, stat) {
//        if(err == null) {
//            var stream = fs.createReadStream(mediaUrl);
//            queue.enqueue(function(stream, cb){
//                copyPaste.copy(stream, cb);
//            }, {args:[stream]}, callback);
//        } else if(err.code == 'ENOENT') {
//            console.error('Some other error: ', err.code);
//            callback(new Error('Failed to check image\'s existence error code is ' + err.code));
//        } else {
//            console.error('Some other error: ', err.code);
//            callback(new Error('Failed to check image\'s existence error code is ' + err.code));
//        }
//    });
//};

module.exports = clipboard;