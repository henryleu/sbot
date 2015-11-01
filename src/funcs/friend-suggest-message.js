var reset = require('./reset-pointer');
var PromiseBB = require('bluebird');
var webdriver = require('selenium-webdriver');
var _modifyRemarkAsync = require('./modify-user-remark-decorator');

module.exports = function(self, item, parentItem, callback){
    parentItem.click()
        .then(function(){
            return self.driver.sleep(500);
        })
        .then(function(){
            return _findElementsInChatAysnc(self)
                .then(function(items){
                    var promiseArr = [];
                    items.forEach(function(item){
                        promiseArr.push(addOneUserAsync(self, item));
                    });
                    PromiseBB.all(promiseArr).then(function(arr){
                        return arr;
                    })
                })
                .then(function() {
                    return self.driver.sleep(1000)
                })
                .then(function(){
                    return clearPanelAsync();
                })
                .then(function() {
                    return reset(self, callback);
                })
                .thenCatch(function(err){
                    console.log("Failed to add contact----");
                    console.log(err);
                    callback();
                })
        });
    function addOneUserAsync(self, item){
        return item.click()
            .then(function(){
                return _modifyRemarkAsync(self, null, item);
            })
            .then(function(profile){
                console.log("profile--------------");
                console.log(profile);
                self.emit('contactAdded', {err: null, data: {botid: self.id, bid: profile.code, nickname: profile.nickName}});

            })
    }
    function clearPanelAsync(){
        var chatArea, posX;
        return self.driver.findElement({css: '.chat_bd'})
            .then(function(item){
                chatArea = item;
                return self.driver.executeScript('return document.querySelector(".chat_bd").clientWidth')
            })
            .then(function(width){
                posX = parseInt(width, 10) - 100;
                console.log(posX);
                return new webdriver.ActionSequence(self.driver)
                    .mouseMove(chatArea, {x: posX, y:100})
                    .click(webdriver.Button.RIGHT)
                    .perform();
            })
            .then(function(){
                console.log("action execute ok**************************");
                return self.driver.findElement({css: 'a[ng-click="item.callback()"]'})
            })
            .then(function(item){
                return item.click();
            })
            .then(function(){
                return self.driver.sleep(500);
            })
            .thenCatch(function(e){
                console.error("Failed to clear the panel after add a contact");
                console.error(e);
            })
    }
};

function _findElementsInChatAysnc(self){
    return self.driver.findElements({'css': '#chatArea div.card>div.card_bd>div.info>h3'})
        .then(function(items){
            return items
        })
        .thenCatch(function(e){
            console.log('Failed to findOne in chat[code]-----' + JSON.stringify(e))
        })
}