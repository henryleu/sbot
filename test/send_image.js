var webdriver= require('selenium-webdriver');
var clipboard = require('../src/util/Clipboard');
var copyImageByUrl = require('bluebird').promisify(clipboard.copyImageByUrl);
var editorLocator = webdriver.By.css('#editArea');
var sendLocator = webdriver.By.css('.dialog_ft .btn_primary');
var loadingLocator = webdriver.By.css('.ngdialog-content .dialog_bd .loading');
var imgLocator = webdriver.By.css('.ngdialog-content .dialog_bd img:nth-child(2)');
var request = require('request');
var j = request.jar();
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
var target = 'ALAN';
var imageUrl = '/home/www/athena/public/uploads/upload_8d5dbeddf0c4616dcd1eff7ebefe909f.jpeg';
//var imageUrl = '/Users/bjhl/dev/codebase/athena/public/uploads/upload_ef618467ce1d7d9016999841b3905eef.jpg';
driver.get('http://wx.qq.com');
driver.wait(webdriver.until.elementLocated(webdriver.By.css('.nickname span')));
driver.wait(function(){
    return driver.findElement({css: '.nickname span'})
        .then(function(span){
            return span.getText()
        })
        .then(function(txt){
            if(txt != ""){
                return true;
            }
            return false;
        })
});
driver.sleep(5000);
driver.manage().getCookies().then(function(cookies){
    cookies.forEach(function(cookie){
        var requestCookie = request.cookie(cookie.name + '=' + cookie.value);
        j.setCookie(requestCookie, 'http://wx.qq.com');
    });
});
var searchInput = driver.findElement(webdriver.By.className('frm_search'));
searchInput.sendKeys(target);
driver.sleep(1000);
driver.findElements({'css': 'div.contact_item.on'}).then(function(items){
    console.log(items);
    return items[0].click()
});
var editEl = driver.findElement(webdriver.By.css('#editArea'));
driver.call(function(){
    console.log("ready to send");
});

var fileEl = driver.findElement(webdriver.By.name('file'));
fileEl.sendKeys('http://download.sucaitianxia.com/yinxiaosucai/dongwu/%E7%89%9B%E8%9B%99.wav');

driver.wait(webdriver.until.elementLocated(loadingLocator), 10000000000);
//var loadingNode = driver.findElement(loadingLocator);
//driver.wait(waitForLoadingHide(loadingNode), 5000);
//driver.wait(webdriver.until.elementLocated(imgLocator), 5000);
//driver.findElement(sendLocator).click();
driver.quit();

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


