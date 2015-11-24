var webdriver = require('selenium-webdriver');
var editorLocator = webdriver.By.css('#editArea');

module.exports = function(mediaUrl){
    console.info('[flow]: Start to send image to contact url is ' + mediaUrl);
    var driver = this;
    var editEl = driver.findElement(editorLocator);
    editEl.click();
    var fileEl = driver.findElement(webdriver.By.name('file'));
    fileEl.sendKeys(mediaUrl)
        .catchErr('[flow]: Failed to set the file path to the input file');
};

