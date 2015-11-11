var webdriver= require('selenium-webdriver');
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
driver.call(function(){
    driver.get('http://www.baidu.com');
    var inputEl = driver.findElement({css: '#kw1'});
    inputEl.sendKeys('ok');
    driver.sleep(5000);
    driver.quit();
})
.thenCatch(function(e){
    console.error(e)
});
driver.controlFlow().execute(function(){
    driver.get('http://www.baidu.com');
    var inputEl = driver.findElement({css: '#kw1'});
    inputEl.sendKeys('ok');
    driver.sleep(5000);
    driver.quit();
})
.thenCatch(function(e){
    console.error(e)
});



