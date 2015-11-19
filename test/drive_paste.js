var webdriver = require('selenium-webdriver');
var supportedBrowsers = {
    chrome: webdriver.Capabilities.chrome(),
    firefox: webdriver.Capabilities.firefox()
};
var browserName = process.argv[2] || 'chrome';
var browser = supportedBrowsers[browserName] || supportedBrowsers.chrome;
var driver = new webdriver.Builder().withCapabilities(browser).build();
var websiteUrl = 'https://www.baidu.com/';
driver.get(websiteUrl);
console.log('requesting ' + websiteUrl + ' with ' + browserName);
driver.call(function(){
    console.log('loading complete...')
});
var itemEl = driver.findElement(webdriver.By.id('kw'));
itemEl.sendKeys('ta');
driver.call(function(){
    console.log('type text ta...')
});
driver.sleep(1000);
itemEl.sendKeys(webdriver.Key.chord(webdriver.Key.CONTROL, 'a'));
driver.call(function(){
    console.log('type ctrl a...')
});
driver.sleep(1000);
itemEl.sendKeys(webdriver.Key.chord(webdriver.Key.CONTROL, 'c'));
driver.call(function(){
    console.log('type ctrl c...')
});
driver.sleep(1000);
itemEl.sendKeys(webdriver.Key.chord(webdriver.Key.CONTROL, 'v'));
driver.call(function(){
    console.log('type ctrl v...')
});
driver.sleep(1000);
itemEl.sendKeys(webdriver.Key.chord(webdriver.Key.CONTROL, 'v'));
driver.call(function(){
    console.log('type ctrl v...')
});

driver.findElement(webdriver.By.id('su')).click();

driver.wait(function () {
    return driver.getTitle().then(function (title) {
        console.log(title);
        var ret = title === 'tata_百度搜索';
        ret && console.log('drive successfully!');
        return ret;
    });
}, 10000);

driver.quit();