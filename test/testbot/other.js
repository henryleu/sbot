var webdriver= require('selenium-webdriver');
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
var itemEl = null;
goto(driver);
test(driver);
driver.sleep(5000);
driver.quit();

function goto(driver){
    driver.get('http://www.baidu.com');
}
function test(driver){
    var inputEl = driver.findElement({css: '#kw'});
    inputEl.sendKeys('ok');
}

