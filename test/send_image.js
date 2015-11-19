var webdriver= require('selenium-webdriver');
var clipboard = require('../src/util/Clipboard');
var copyImageByUrl = require('bluebird').promisify(clipboard.copyImageByUrl);
var editorLocator = webdriver.By.css('#editArea');
var sendLocator = webdriver.By.css('.dialog_ft .btn_primary');
var loadingLocator = webdriver.By.css('.ngdialog-content .dialog_bd .loading');
var imgLocator = webdriver.By.css('.ngdialog-content .dialog_bd img:nth-child(2)');
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
var target = '酒剑仙';
var imageUrl = '/Users/bjhl/dev/codebase/athena/public/uploads/upload_ef618467ce1d7d9016999841b3905eef.jpg';
driver.get('http://wx.qq.com');
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
var searchInput = driver.findElement(webdriver.By.className('frm_search'));
searchInput.sendKeys(target);
driver.sleep(1000);
driver.findElements({'css': 'div.contact_item.on'}).then(function(items){
    console.log(items);
    return items[0].click()
});
var editEl = driver.findElement(webdriver.By.css('#editArea'));
driver.call(copyImageByUrl, null, imageUrl);
editEl.sendKeys(webdriver.Key.chord(webdriver.Key.CONTROL, 'v'));
driver.wait(webdriver.until.elementLocated(loadingLocator), 5000)
var loadingNode = driver.findElement(loadingLocator);
driver.wait(waitForLoadingHide(loadingNode), 5000)
driver.wait(webdriver.until.elementLocated(imgLocator), 5000)
driver.findElement(sendLocator).click();
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


