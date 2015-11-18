var webdriver = require('selenium-webdriver');
var sendLocator = '.dialog_ft .btn_primary';
var loadingLocator = webdriver.By.css('.ngdialog-content .dialog_bd .loading');
var imgLocator = webdriver.By.css('.ngdialog-content .dialog_bd img:nth-child(2)');
var clipboard = require('../util/Clipboard');
var copyImageByUrl = require('bluebird').promisify(clipboard.copyImageByUrl);

module.exports = function(mediaUrl){
    var driver = this;
    driver.call(copyImageByUrl, null, mediaUrl).catchErr('[flow]: Failed to copy image to clipboard');
    var editEl = driver.findElement(webdriver.By.css('#editArea'));
    editEl.sendKeys(webdriver.Key.chord(webdriver.Key.CONTROL, 'v')).catchErr('[flow]: Failed to sendKeys');
    driver.wait(webdriver.until.elementLocated(loadingLocator), 5000).catchErr('[flow]: Failed to wait loadingLocator');
    var loadingNode = driver.findElement(loadingLocator);
    driver.wait(waitForLoadingHide(loadingNode), 5000).catchErr('[flow]: Failed to waitEl hidden loadingNode');
    driver.wait(webdriver.until.elementLocated(imgLocator), 5000).catchErr('[flow]: Failed to waitEl present loadingNode');
    driver.findElement(webdriver.By.css(sendLocator)).click().catchErr('[flow]: Failed to click sendLocator');
};

function waitForLoadingHide(loadingNode){
    return function(){
        var result = false;
        var clazzes = loadingNode.getAttribute('class')[' '];
        clazzes.forEach(function(clazz){
            result = clazz === "ng-hide";
        });
        return result;
    }
}