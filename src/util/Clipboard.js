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
                copyToClipboard(mediaUrl, cb);
            }, {args:[mediaUrl]}, callback);
        } else if(err.code == 'ENOENT') {
            console.error('Some other error: ', err.code);
            callback(new Error('Failed to check image\'s existence error code is ' + err.code));
        } else {
            console.error('Some other error: ', err.code);
            callback(new Error('Failed to check image\'s existence error code is ' + err.code));
        }
    });
};
function copyToClipboard(mediaUrl,  callback){
    exec('python ' + __dirname + '/copypaste.py ' + mediaUrl,
        function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
        callback(null)
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