var webdriver = require('selenium-webdriver');
var Queue = require('../app/TasksQueue');
var queue = new Queue(1);
['sendKeys', 'click'].forEach(function(method){
    var methodOrigin = webdriver.WebElement.prototype[method];
    webdriver.WebElement.prototype[method] = function(){
        var self = this;
        var args = [].slice.call(arguments, 0);
        return new webdriver.promise.Promise(function(resolve, reject){
            queue.enqueue(
                function(cb){
                    var promise = methodOrigin.call(self, args);
                    promise.then(function(result){
                        resolve(result);
                        cb();
                    })
                        .thenCatch(function(e){
                            reject(e);
                        })
                }
            )
        });
    };
});
module.exports = function createDriver(){
    var driver = new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities.chrome())
        .setControlFlow(new webdriver.promise.ControlFlow())
        .build();
    return driver;
};
