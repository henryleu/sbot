var webdriver= require('selenium-webdriver');
var chrome =  require('selenium-webdriver/chrome');
var opts = new chrome.Options();
opts.addArguments(['user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10240"']);
var baseCapabilities = webdriver.Capabilities.chrome();

var driver = new webdriver.Builder()
    .withCapabilities(opts.toCapabilities().setEnableNativeEvents(true))
    .build();
driver.get('http://wx.qq.com');