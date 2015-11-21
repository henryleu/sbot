var webdriver= require('selenium-webdriver');
var exec = require('child_process').exec;
var fs = require('fs');
var LMQ = require('l-mq');
var queue = new LMQ(1);

var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
var copyToClipboardAsync =require('bluebird').promisify(copyToClipboard);

driver.get('https://www.baidu.com');
driver.call(function(){
    console.log("get ok")
})
driver.call(copyToClipboardAsync, null).thenCatch(function(e){ console.error(e) })
driver.call(function(){
    console.log("copy ok")
})
var input = driver.findElement(webdriver.By.id('kw'));
input.sendKeys(webdriver.Key.chord(webdriver.Key.CONTROL, 'v'));
var suEl = driver.findElement({css: '#su'});
suEl.click();
driver.sleep(2000);
driver.getTitle().then(function(title){
    console.log(title)
});
driver.quit();

function copyToClipboard(callback){
    console.log("begin to copy")
    exec('xclip -selection clipboard test.txt',
        {
            timeout: 1000
        },
        function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.error('[flow]: Failed to copy text to clipboard');
                return callback(new Error('[flow]: Failed to copy text to clipboard'))
            }
            console.info('[flow]: Succeed to copy text to clipboard');
            callback(null)
        })
}