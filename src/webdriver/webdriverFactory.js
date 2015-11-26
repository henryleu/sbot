var webdriver = require('selenium-webdriver');
var chromeDriver = require('selenium-webdriver/chrome');
var source = {
    'WebDriver': ['get'],
    'WebElement': ['sendKeys', 'click']
};

//build webdriver proxy
require('./proxy/shareIO')(webdriver, source, {shareIO: true});

module.exports = function createDriver(){
    var chromeCapabilities = webdriver.Capabilities.chrome();
    var options = chromeDriver.Options.fromCapabilities(chromeCapabilities);
    options.addArguments('--lang=en_US');
    options.addArguments('--disable-user-media-security=true');
    options.setUserPreferences({'intl.accept_languages': 'zh_CN'});
    var driver = new webdriver.Builder()
        .withCapabilities(options.toCapabilities())
        .setControlFlow(new webdriver.promise.ControlFlow())
        .build();
    return driver;
};
