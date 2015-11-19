var webdriver = require('selenium-webdriver');
var editorLocator = webdriver.By.css('#editArea');
var sendLocator = webdriver.By.css('.dialog_ft .btn_primary');
var loadingLocator = webdriver.By.css('.ngdialog-content .dialog_bd .loading');
var imgLocator = webdriver.By.css('.ngdialog-content .dialog_bd img:nth-child(2)');
var clipboard = require('../util/Clipboard');
var copyImageByUrl = require('bluebird').promisify(clipboard.copyImageByUrl);


module.exports = function(mediaUrl){
    console.info('[flow]: Start to send image to contact url is ' + mediaUrl);
    var driver = this;
    driver.call(copyImageByUrl, null, mediaUrl)
        .then(function(data){ console.info('[flow]: Image width is ' + data) })
        .catchErr('[flow]: Failed to copy image to clipboard');
    var editEl = driver.findElement(editorLocator);
    editEl.sendKeys(webdriver.Key.chord(webdriver.Key.CONTROL, 'v'))
        .catchErr('[flow]: Failed to sendKeys');
    driver.wait(webdriver.until.elementLocated(loadingLocator), 5000)
        .catchErr('[flow]: Failed to wait loadingLocator');
    var loadingNode = driver.findElement(loadingLocator);
    driver.wait(waitForLoadingHide(loadingNode), 5000)
        .catchErr('[flow]: Failed to waitEl hidden loadingNode');
    driver.wait(webdriver.until.elementLocated(imgLocator), 5000)
        .catchErr('[flow]: Failed to waitEl present loadingNode');
    driver.findElement(sendLocator).click()
        .catchErr('[flow]: Failed to click sendLocator');
};

function waitForLoadingHide(loadingNode){
    var result = false;
    return function(){
        loadingNode.getAttribute('class')
            .then(function(clazzes) {
                if(!result){
                    var arr = clazzes.split(' ');
                    arr.some(function(clazz){
                        result = "ng-hide" === clazz;
                    })
                }
            });
        return result
    }
}