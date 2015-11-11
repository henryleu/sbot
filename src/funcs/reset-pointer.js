var webdriver = require('selenium-webdriver');
var settings = require('../app/settings');
var receiveRestLocator = webdriver.By.css('div.chat_list div.top');
module.exports = function(self, callback, err){
    var error = err ? err : null;
    return self.driver.findElement(webdriver.By.className('title_name'))
        .then(function(titleEL){
            return titleEL.getText()
        })
        .then(function(title){
            if(title === settings.RESET_TITLE){
                return callback(error);
            } else {
                return self.driver.findElement(receiveRestLocator)
                    .then(function(item) {
                        return item.click()
                    })
                    .then(function(){
                        return callback(error);
                    })
            }
        })
        .thenCatch(function(err){
            console.warn("Failed to reset in list [code]-------");
            console.warn(err);
        })
};