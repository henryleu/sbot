var webdriver = require('selenium-webdriver');
var genHelper = require('./webdriver-helper');
var driver = new webdriver.Builder().
    withCapabilities(webdriver.Capabilities.chrome()).
    build();
var helper = genHelper(webdriver, driver);
var flow = webdriver.promise.controlFlow();
driver.get('https://wx.qq.com');
//driver.findElement(webdriver.By.name('q')).sendKeys('webdriver');
//driver.findElement(webdriver.By.name('btnK')).click();
var loggedIn = false;
var avatarLocator = webdriver.By.css('div.header > div.avatar');
var searchLocator = webdriver.By.className('frm_search');
//var searchedContactLocator = webdriver.By.css('div.contact_item:');
var searchedContactLocator = webdriver.By.css(' div[data-height-calc=heightCalc]:nth-child(2) > div');

var waitFor = function(seconds) {
    var delay = seconds*1000;
    var timeout = false;
    return function(){
        driver.wait(function() {
            console.log("-------")
            setTimeout(function(){timeout=true}, delay);
            return timeout;
        }, 100000);
    };
};

driver.wait(function() {
    driver.isElementPresent(avatarLocator).then(function(present) {
        if(!loggedIn && present){
            console.log('web weixin has logged in');
                //loggedIn = present;
            setTimeout(function(){
                loggedIn = present;
            }, 3000);
        }
    });

    return loggedIn;
}, 60*1000);



var nickname = '独自等待';
driver.findElement(searchLocator).sendKeys(nickname);
//var result =false;
//driver.wait(function(){
//    setTimeout(function(){
//        result = true;
//    }, 5000)
//    return result;
//}, 100000)
waitFor(1)();

//driver.findElements(searchedContactLocator).click();
//var findContactByNickname = function(nickname){
//    return helper.findElementInCollectionByText({
//            'css': 'div[data-height-calc=heightCalc]'
//        }, {
//            'css': 'h4.nickname'
//        },
//        nickname
//    );
//};
driver.findElements({
    'css': 'div.contact_item.on'
}).
    then (function (collection) {
        collection.map(function (item) {
            //flow.execute(function () {
            var contactItem = item;
            item.findElement({'css': 'h4.nickname'}).then(function(infoItem){
                infoItem.getText().
                    then(function (value) {
                        //console.log('comparing ' + value);
                        if (value === nickname) {
                            contactItem.click();
                        }
                    });
            });
            //});
        });
    });

waitFor(1)();
var sendMsg = "机器人测试";
var sendCount = 10;
function iterator(index){
    if(index === sendCount)
    return;
    driver.findElement({'id':'editArea'}).sendKeys(sendMsg);
    driver.findElement({css:'.btn_send'}).click();
    iterator(index + 1)
}
iterator(0)



//var contact = findContactByNickname(nickname);
//contact(function(item){
//    item.click();
//});

driver.wait(function() {return false;}, 30*60*1000);



//var childProcess = require('child_process')
//setTimeout(function(){
//    //driver.quit();
//    console.log('take snapshot begin');
//    childProcess.exec('screencapture ~/Documents/wx/qr.png', function (error, stdout, stderr){
//        console.log('stdout: ' + stdout);
//        console.log('stderr: ' + stderr);
//        if (error !== null) {
//            console.log('exec error: ' + error);
//        }
//        else{
//            console.log('ok');
//        }
//    });
//
//},8000);

//setTimeout(function(){
//    driver.quit();
//}, 10000);

