var webdriver= require('selenium-webdriver');
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
var itemEl = null;
driver.get('http://www.baidu.com');
driver.findElement({css: '#kw'})
    .then(function(item){
        itemEl = item;
        itemEl.sendKeys('keyword1');
        driver.sleep(2000);
        itemEl.sendKeys(webdriver.Key.CONTROL, "a", webdriver.Key.NULL);
        driver.sleep(2000);
        itemEl.sendKeys(webdriver.Key.CONTROL, "v", webdriver.Key.NULL);
        driver.sleep(2000);
        itemEl.sendKeys(webdriver.Key.CONTROL, "v", webdriver.Key.NULL);
        driver.sleep(2000);
    })
    .thenCatch(function(e){
        console.error(e);
    });
driver.sleep(5000);
driver.quit();



