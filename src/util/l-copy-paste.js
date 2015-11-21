var exec = require('child_process').exec;
var cmd = "xclip";
var optsC = {
    "-t": "image/jpeg",
    "-selection": "c"
};
var options = {
    timeout: 3000
};
var buildFullCommand = function(opts){
    var resultArr  = [cmd];
    var argsArr = Object.keys(opts);
    for(var i=0, len=argsArr.length; i<len; i++){
        resultArr.push(argsArr[i]);
        resultArr.push(opts[argsArr[i]]);
    }
    return resultArr.join(' ');
};
var copyToClipboard = buildFullCommand(optsC);

exports.copy = function(url, callback){
    if(process.platform != "linux"){
        callback(new Error("your os is not supported"));
    }
    exec(copyToClipboard + ' -i < ' + url, options, function(err, stdout, stderr){
        if(err){
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            return callback(new Error('[flow]: Failed to copy image to clipboard'))
        }
        console.info('[flow]: Succeed to copy image to clipboard');
        callback(null)
    })
};
