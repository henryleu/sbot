var webdriver = require('selenium-webdriver');
var receiveRestLocator = webdriver.By.css('div.chat_list div.top');
module.exports = function(self, callback){
    return self.driver.findElement(receiveRestLocator)
        .then(function(item){
            console.log(item);
            return item.click()
                .then(function(){
                    item.click()
                        .then(function(){
                            return callback()
                        })
                })
        })
        .thenCatch(function(err){
            console.log("Failed to reset in list [code]-------");
            console.error(err);
        })
};