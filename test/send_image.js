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
//request once
driver.call(function(){
    return new webdriver.promise.Promise(function(resolve, reject){
        requestOptions(function(err, res, body){
            if(err){
                console.error("Failed to request options");
                console.error(err);
                return reject(err)
            }else{
                console.info(body);
                resolve()
            }
        })
    })
});
driver.call(function(){
    console.log("request 1 ok");
});
//request second
driver.call(function(){
    return new webdriver.promise.Promise(function(resolve, reject){
        requestUpload(function(err, res, body){
            if(err){
                console.error("Failed to request options");
                console.error(err);
                return reject(err)
            }else{
                console.info(body);
                resolve()
            }
        })
    })
});
driver.call(function(){
    console.log("request 2 ok");
});

driver.wait(webdriver.until.elementLocated(loadingLocator), 10000000000);
var loadingNode = driver.findElement(loadingLocator);
driver.wait(waitForLoadingHide(loadingNode), 5000);
driver.wait(webdriver.until.elementLocated(imgLocator), 5000);
driver.findElement(sendLocator).click();
driver.quit();

function requestOptions(callback){
    var requestHeader = {
        "Accept-Encoding": "gzip, deflate, sdch",
        "Access-Control-Request-Headers": "content-type",
        "Access-Control-Request-Method": "POST",
        Connection: "keep-alive",
        Host: "file.wx.qq.com",
        Origin: "https://wx.qq.com",
        Referer: "https://wx.qq.com/?&lang=zh_CN"
    };
    request({
        method: "OPTIONS",
        url: "https://file.wx.qq.com/cgi-bin/mmwebwx-bin/webwxuploadmedia?f=json",
        jar: j,
        headers: requestHeader
    }, callback)
}
function requestUpload(callback){
    var file = "/Users/bjhl/dev/codebase/athena/public/uploads/upload_ffbcc160c4a2f0d1330987a198b6b5a8.jpg"
    var requestHeader = {
        "Accept-Encoding": "gzip, deflate",
        "Access-Control-Request-Headers": "content-type",
        "Access-Control-Request-Method": "POST",
        Connection: "keep-alive",
        "Content-Length": 38195,
        "Content-Type": "multipart/form-data",
        Host: "file.wx.qq.com",
        Origin: "https://wx.qq.com",
        Referer: "https://wx.qq.com/?&lang=zh_CN"
    };
    var count = 4;
    var formData = {
        id: "WU_FILE_" + (count++),
        name: "untitled" + (count++),
        uploadmediarequest: require('fs').createReadStream(file)
    };
    request.post({
        url: "https://file.wx.qq.com/cgi-bin/mmwebwx-bin/webwxuploadmedia?f=json",
        jar: j,
        headers: requestHeader,
        formData: formData
    }, callback)
}
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


