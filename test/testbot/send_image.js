var webdriver= require('selenium-webdriver');
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
driver.get('http://wx.qq.com');
