//var copy_paste = require('copy-paste');
//
//var stream = require('fs').createReadStream('./clipboard.jpg');
//
//copy_paste.copy(stream, function(){
//    console.log('ok')
//})
var exec = require('child_process').exec;

exec('xclip -selection clipboard clipboard.jpg',
    function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
    })