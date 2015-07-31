var taskQueue = require('./TasksQueue');
var webdriver = require('selenium-webdriver');
var genHelper = require('./webdriver-helper');
var EventEmitter = require('events').EventEmitter;
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
var helper = genHelper(webdriver, driver);
var flow = webdriver.promise.controlFlow();
var initialed = false;
var loggedIn = false;
var avatarLocator = webdriver.By.css('div.header > div.avatar');
var searchLocator = webdriver.By.className('frm_search');
var receiveRestLocator = webdriver.By.css('div.chat_list div.top');
//var searchedContactLocator = webdriver.By.css('div.contact_item:');
var searchedContactLocator = webdriver.By.css(' div[data-height-calc=heightCalc]:nth-child(2) > div');
var blackList = {};
var waitFor = function(seconds) {
    var delay = seconds*1000;
    var timeout = false;
    return function(){
        driver.wait(function() {
            setTimeout(function(){timeout=true}, delay);
            return timeout;
        }, 100000);
    };
};
var chatCache = {};
var currInteral = {};
function WcBot(id){
    EventEmitter.call(this);
    this.id = id;
    this.currentState = {};
    this.sendTo = null;
}
var util = require('util');
util.inherits(WcBot, EventEmitter);
WcBot.prototype.start = function(){
    var self = this;
    self._login(function(){
        //var count = 0;
        function polling(){
            console.log("polling---------------")
            setTimeout(function(){
                //if(isEven(count)){
                //    return taskQueue.enqueue(self._walkCurrList.bind(self), function(){
                //        count++;
                //        polling();
                //    })
                //}
                return taskQueue.enqueue(self._walkChatList.bind(self), function(){
                    //count++;
                    polling();

                })
            }, 1000);
        }
        polling();
    });

}
function isEven(num){
    if(!isNaN(num)){
        return num%2 === 1;
    }
    throw new Error('arguments type is not a Number');
}
WcBot.prototype._listenChatList = function(){

}
WcBot.prototype._listenCurrUser = function(){
    var self = this;
    currInteral = setInterval(self._walkCurrList.bind(this), 200);
}
WcBot.prototype.send = function(json) {
    var self = this;
    var content = json.content;
    if(!initialed || json.sendTo != self.sendTo){
        self.sendTo = json.sendTo;
        taskQueue.enqueue(self._findOne.bind(self));
    }
    taskQueue.enqueue(function(cb){
        driver.findElement({'id':'editArea'}).sendKeys(content);
        driver.findElement({css:'.btn_send'}).click().then(function(){
            chatCache[self.sendTo] = !chatCache[self.sendTo]? 1 : chatCache[self.sendTo]+1;
            cb();
        });
    });
    initialed = true;
}
WcBot.prototype._login = function(callback){
    driver.get('https://wx.qq.com');
    driver.wait(function() {
        driver.isElementPresent(avatarLocator).then(function(present) {
            if(!loggedIn && present){
                //loggedIn = present;
                setTimeout(function(){
                    loggedIn = present;
                    callback()
                }, 3000);
            }
        });

        return loggedIn;
    }, 60*1000);
}
WcBot.prototype._findOne = function(callback){
    var self = this;
    driver.findElement(searchLocator).sendKeys(self.sendTo);
    driver.sleep(1000);
    driver.findElements({
        'css': 'div.contact_item.on'
    }).
        then (function (collection) {
        collection.map(function (item) {
            //flow.execute(function () {
            var contactItem = item;
            item.findElement({'css': 'h4.nickname'}).then(function(infoItem){
                infoItem.getText().
                    then(function (value) {
                        //console.log('comparing ' + value);
                        if (value === self.sendTo) {
                            contactItem.click().then(function(){
                                callback();
                            })
                        }
                    });
            });
            //});
        });
    });
}
WcBot.prototype._walkChatList = function(callback){
    var self = this;
    driver.findElements({'css': 'div[ng-repeat*="chatContact"]'})
        .then(function(collection){
            function iterator(index){
                var item = currItem = collection[index];
                item.findElement({'css': 'i.web_wechat_reddot_middle.icon'})
                    .then(function(iblock){
                        var iblockTemp = iblock;
                        item.findElement({'css': 'span.nickname_text'})
                            .then(function(h3El){
                                self.sendTo = h3El;
                                iblockTemp.getText().then(function(count){
                                    currItem.click().then(function(){
                                        spiderContent()
                                        return receiveReset(callback);
                                    });
                                    //replayMsg(self, count)

                                    //self.emit('continue', {count: count});
                                })
                            })
                    })
                    .thenCatch(function(){
                        return iterator(index+1)
                    })
            }
            iterator(0);
        })
        .thenCatch(function(err){
            return callback(err);
        })
}
function spiderContent(unReadCount, callback){
    //walk in dom
    driver.findElement({'css': '#chatArea'})
        .then(function(chatwrapper){
            chatwrapper.findElements({'css': '.bubble_default'}).then(function(collection){
                var unreadArr = collection.slice(-unReadCount);
                var unreadMsgs = [];
                Promise.map(unreadArr, function(item, index, unreadArr){
                    item.findElement({'css': 'pre.js_message_plain'}).then(function(preEl){
                        preEl.getText().then(function(payLoad){
                            //self.emit('receive', {
                            //    from: self.sendTo,
                            //    payLoad: payLoad
                            //});
                            replayMsg(self, null, callback);
                            //return callback();
                        })
                    })
                })
            })
        })
        .thenCatch(function(err){
            return callback(err);
        })
}
function receiveReset(callback){
    driver.findElement(receiveRestLocator).click().then(function(){
        callback();
    });
}
function replayMsg(self, count){
    //self._walkCurrList(count, callback);
    self._reply(count);
}
WcBot.prototype._reply = function(count){
    driver.findElement({'id':'editArea'}).sendKeys("这个一个检测机器人，主人正在睡觉，请勿打扰");
    driver.findElement({css:'.btn_send'}).click();
}
WcBot.prototype.onReceive = function(id, handler){

}
WcBot.prototype.onReceive = function(handler){
    this.on('receive', handler);
}
WcBot.prototype._walkCurrList = function(unReadCount, callback){
    if(!callback){
        callback = unReadCount;
        unReadCount = null;
    }
    var self = this;
    //init chat cache
    !chatCache[self.sendTo] && (chatCache[self.sendTo] = 0);
    //cache update
    unReadCount && (chatCache[self.sendTo] = (chatCache[self.sendTo] || 0) + unReadCount);
    //walk dom
    driver.findElement({'css': '#chatArea'})
        .then(function(chatwrapper){
            chatwrapper.findElements({'css': '.bubble_default'}).then(function(collection){
                var currCount = collection.length,
                    readedCount = chatCache[self.sendTo];
                if(!unReadCount){
                    if(readedCount === currCount){
                        return callback();
                    }
                    unReadCount = currCount - readedCount;
                    chatCache[self.sendTo] = currCount;
                }
                var unreadArr = collection.slice(-unReadCount);
                if(unreadArr.length === 0) return callback();
                unreadArr.map(function(item){
                    item.findElement({'css': 'pre.js_message_plain'}).then(function(preEl){
                        preEl.getText().then(function(payLoad){
                            //self.emit('receive', {
                            //    from: self.sendTo,
                            //    payLoad: payLoad
                            //});
                            replayMsg(self, null, callback);
                            //return callback();
                        })
                    })
                })
            })
        })
        .thenCatch(function(){
            return callback();
        })
}
WcBot.prototype._analysisPayload =function(){

}
module.exports = WcBot;

