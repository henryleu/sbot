var exec = require('child_process').exec;
var path = require('path')
function copyToClipboard(mediaUrl,  callback){
    exec('python ' + path.join(__dirname, '../src/util/copypaste.py ')  + mediaUrl,
        function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
            callback(null)
        })
}
copyToClipboard('./clipboard.jpg', function(){

});