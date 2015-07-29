var webdriverio = require('webdriverio');
var options = {
    desiredCapabilities: {
        browserName: 'firefox'
    }
};

webdriverio
    .remote(options)
    .init()
    //.url('https://wx.qq.com')
    .url('https://wx.qq.com', function(result){
        console.log(result);
    })
    .title(function(err, res) {
        console.log('Title was: ' + res.value);
    })
    .end();