var webdriver = require('selenium-webdriver');
webdriver.promise.Promise.prototype.catchErr = function(msg){
    var self = this;
    if (self instanceof webdriver.promise.Promise) {
        console.error("@@@@@@@@@");
        self.thenCatch(function(err){
            console.error(err);
            return webdriver.promise.rejected(new webdriver.error.Error(msg));
        })
    }
    else {
        throw new Error('illegal call [method]=catchErr');
    }
}

module.exports = null;