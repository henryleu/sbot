var webdriver= require('selenium-webdriver');
var exec = require('child_process').exec;
var fs = require('fs');
var LMQ = require('l-mq');
var queue = new LMQ(1);
var copyImageByUrlAsync =require('bluebird').promisify(copyImageByUrl);
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
driver.get('https://www.baidu.com');
driver.call(copyImageByUrlAsync, null, 'hello');
var input = driver.findElement({css: '#kw'});
input.sendKeys(webdriver.Key.chord('a', 'v'));
input.sendKeys(webdriver.Key.chord(webdriver.Key.CONTROL, 'v'));
var suEl = driver.findElement({css: '#su'});
suEl.click();
driver.sleep(2000)
driver.getTitle().then(function(title){
    console.log(title)
});
driver.quit();

function copyImageByUrl(mediaUrl, callback){
    //TODO check image file's existence
    copyToClipboard(mediaUrl, callback);
};
function copyToClipboard(mediaUrl,  callback){
    exec('python ' + __dirname + '/copy_paste_text.py',
        function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.error('[flow]: Failed to copy image to clipboard');
                return callback(new Error('[flow]: Failed to copy image to clipboard'))
            }
            console.info('[flow]: Succeed to copy image to clipboard');
            callback(null)
        })
}