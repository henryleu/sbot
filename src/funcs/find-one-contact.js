var webdriver = require('selenium-webdriver');
var MYERROR = require('../app/myerror');
//external services
var reset = require('./reset-pointer');
//locators
var searchLocator = webdriver.By.className('frm_search');

module.exports = _findOnePro;

function _findOnePro(self, id, callback){
    var searchInput = null;
    self.driver.findElement(searchLocator)
        .then(function(searchItem){
            searchInput = searchItem;
            return searchItem.sendKeys(id)
                .thenCatch(function(e){
                    console.error(e)
                })
        })
        .then(function(){
            console.log('[flow]: search keys '+ id);
            return self.driver.sleep(1000);
        })
        .then(function(){
            return self.driver.findElements({
                'css': 'div.contact_item.on'
            })
        })
        .then(function (collection) {
            if(collection.length <= 0){
                //no search contact to send
                return webdriver.promise.rejected(new webdriver.error.Error(801, 'no_result'))
            }
            var len = collection.length;
            var i=0;
            collection.map(function (item) {
                var contactItem = item;
                item.findElement({'css': 'h4.nickname'})
                    .then(function(infoItem){
                        return infoItem.getText()
                            .then(function (value) {
                                i++;
                                if (value === id) {
                                    contactItem.click()
                                        .then(function(){
                                            callback(null, null);
                                        })
                                        .thenCatch(function(e){
                                            console.log(e);
                                            callback(e, null);
                                        });
                                }
                                else if(i === len){
                                    //send to is not exist
                                        searchInput.clear()
                                            .then(function(){
                                                return self.driver.findElement(webdriver.By.css('.header')).click();
                                            })
                                            .then(function(){
                                                reset(self, function(){
                                                    callback(new Error('user does not exist'));
                                                });
                                            })
                                            .thenCatch(function(e){
                                                callback(new Error('Failed to clear search input'));
                                            })
                                }
                                else{
                                    //unknow error
                                    console.error('[flow]: process stop error: unknown error');
                                }
                            })
                            .thenCatch(function(e){
                                console.log('error occur-----------');
                                console.log(e);
                                callback(e, null)
                            })
                    });
            });
        })
        .thenCatch(function(e){
            if(e.code != MYERROR.NO_RESULT){
                console.error(e);
            }
            searchInput.clear()
                .then(function(){
                    reset(self, callback, e);
                })
        })
}