var exec = require('child_process').exec;
var cmd = "xclip";
var cmdArgs = {
    "-d": ":10",
    "-t": "image/jpg",
    "-selection": "c"
};
var options = {
    timeout: 1000
};
var fullCommand = (function(){
    var resultArr  = [cmd];
    var argsArr = Object.keys(cmdArgs);
    for(var i=0, len=argsArr.length; i<len; i++){
        resultArr.push(argsArr[i]);
        resultArr.push(cmdArgs[argsArr[i]]);
    }
    return resultArr.join(' ');
}());

exports.copy = function(url, callback){
    if(process.platform != "linux"){
        callback(new Error("your os is not supported"));
    }
    exec(fullCommand + ' ' + url, options,
        function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.error('[flow]: Failed to copy text to clipboard');
                return callback(new Error('[flow]: Failed to copy text to clipboard'))
            }
            console.info('[flow]: Succeed to copy text to clipboard');
            callback(null)
        }
    );
}
