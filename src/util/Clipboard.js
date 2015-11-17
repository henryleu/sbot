var copyPaste = require('copy-paste');
var fs = require('fs');
var clipboard = {};

clipboard.copyImageByUrl = function(mediaUrl, callback){
    //TODO check image file's existence
    //see http://stackoverflow.com/questions/17699599/node-js-check-exist-file
    var stream = fs.createReadStream(mediaUrl);
    copyPaste.copy(stream, callback);
};

module.exports = clipboard;