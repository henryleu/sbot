var copy_paste = require('copy-paste');

var stream = require('fs').createReadStream('./clipboard.jpg');

copy_paste.copy(stream, function(){
    console.log('ok')
})