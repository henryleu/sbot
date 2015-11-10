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

var itemEl = driver.findElement(webdriver.By.name('wd'));
itemEl.sendKeys('webdriver');
driver.sleep(2000);
itemEl.sendKeys(webdriver.Key.CONTROL, "a", webdriver.Key.NULL);
driver.sleep(2000);
itemEl.sendKeys(webdriver.Key.CONTROL, "v", webdriver.Key.NULL);
driver.sleep(2000);
itemEl.sendKeys(webdriver.Key.CONTROL, "v", webdriver.Key.NULL);

driver.findElement(webdriver.By.id('su')).click();

driver.wait(function () {
    return driver.getTitle().then(function (title) {
        var ret = title === 'tesla_百度搜索';
        ret && console.log('drive successfully!');
        return ret;
    });
}, 10000);

driver.quit();