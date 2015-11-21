var copy_paste = require('copy-paste');

var stream = require('fs').createReadStream(__dirname + '/xxx.png');

copy_paste.copy(stream, function(){
    console.log('ok')
});
