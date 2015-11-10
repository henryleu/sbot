var webdriver = require('selenium-webdriver');
var receiveRestLocator = webdriver.By.css('div.chat_list div.top');
module.exports = function(self, callback, err){
    var error = err ? err : null;
    return self.driver.findElement(webdriver.By.className('title_name'))
        .then(function(titleEL){
            return titleEL.getText()
        })
        .then(function(title){
            console.warn(title)
            if(title === 'File Transfer'){
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
            console.log("Failed to reset in list [code]-------");
            console.warn(err);
        })
};