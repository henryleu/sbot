var webdriver= require('selenium-webdriver');
var loadingLocator = webdriver.By.css('.ngdialog-content .dialog_bd .loading');
var imgLocator = webdriver.By.css('.ngdialog-content .dialog_bd img:nth-child(2)');
var sendLocator = webdriver.By.css('.dialog_ft .btn_primary');
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
driver.get('http://wx.qq.com');
driver.call(function(){
    console.log("start")
});
driver.call(recur);
function recur(){
    driver.wait(webdriver.until.elementLocated(loadingLocator), 1000)
        .then(function(){
            driver.call(function(){
                console.log("loggedin");
                var loadingNode = driver.findElement(loadingLocator);
                driver.wait(waitForLoadingHide(loadingNode), 20000);
                driver.call(function(){
                    console.log("wait loading complete")
                });
                driver.wait(webdriver.until.elementLocated(imgLocator), 5000);
                driver.call(function(){
                    console.log("prepare to click")
                });
                driver.findElement(sendLocator).click()
            })
            .thenCatch(function(err){
                console.error(err)
            })
        })
        .thenCatch(function(err){
            driver.call(recur)
        });
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