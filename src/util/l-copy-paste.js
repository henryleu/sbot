var exec = require('child_process').exec;
var cmd = "xclip";
var optsC = {
    "-d": ":10",
    "-t": "image/jpg",
    "-selection": "c"
};
var optsP = {
    "-d": ":10",
    "-t": "image/jpg",
    "-selection": "p"
};
var options = {
    timeout: 1000
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
var copyToPrimary = buildFullCommand(optsP);

exports.copy = function(url, callback){
    if(process.platform != "linux"){
        callback(new Error("your os is not supported"));
    }
    exec(copyToClipboard + ' ' + url, options,
        function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.error('[flow]: Failed to copy image to clipboard');
                return callback(new Error('[flow]: Failed to copy image to clipboard'))
            }
            exec(copyToPrimary + ' ' + url, options, function(err, stdout, stderr){
                if(err){
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    return callback(new Error('[flow]: Failed to copy image to clipboard'))
                }
                console.info('[flow]: Succeed to copy image to clipboard');
                callback(null)
            })
        }
    );
}
