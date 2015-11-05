var webdriver = require('selenium-webdriver');
var supportedBrowsers = {
    chrome: webdriver.Capabilities.chrome(),
    firefox: webdriver.Capabilities.firefox()
};
var browserName = process.argv[2] || 'chrome';
var browser = supportedBrowsers[browserName] || supportedBrowsers.chrome;
var driver = new webdriver.Builder().withCapabilities(browser).build();
var websiteUrl = 'http://www.haosou.com/';
driver.get(websiteUrl);
console.log('requesting ' + websiteUrl + ' with ' + browserName);

driver.findElement(webdriver.By.name('q')).sendKeys('webdriver');
driver.findElement(webdriver.By.id('search-button')).click();

driver.wait(function () {
    return driver.getTitle().then(function (title) {
        var ret = title === 'webdriver_好搜';
        ret && console.log('drive successfully!');
        return ret;
    });
}, 10000);

driver.quit();