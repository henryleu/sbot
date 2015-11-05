var chatCache = {};
var currInteral = {};
/**
 * Add a contact actively
 * @param id
 * @param encodeId
 * @param callback
 */
WcBot.prototype.addContact = function(id, encodeId, callback){
    var self = this;
    self.taskQueue.enqueue(_addContact.bind(self), {args:[id, encodeId], priority: 1, context: self}, callback);
};
/**
 * listen the current user whether a message came in
 * @private
 */
WcBot.prototype._listenCurrUser = function(){
    var self = this;
    currInteral = setInterval(self._walkCurrList.bind(self), 200);
};
/**
 * walk in right chat area, check to whether messages arrived
 * @param unReadCount
 * @param callback
 * @private
 */
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
    self.driver.findElement({'css': '#chatArea'})
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
                            replayMsg(self, null, callback);
                        })
                    })
                })
            })
        })
        .thenCatch(function(){
            return callback();
        })
};
/**
 * reply a message to the current user
 * @param count
 * @private
 */
WcBot.prototype._reply = function(count){
    this.driver.findElement({'id':'editArea'}).sendKeys("这个一个检测机器人，主人正在睡觉，请勿打扰");
    this.driver.findElement({css:'.btn_send'}).click();
};
function _addContact(id, encodeId, callback){
    var self = this;
    var nickname = id;
    var code = encodeId;
    _findOneInListAsync(self, '朋友推荐消息')
        .then(function(){
            return _findOneInChatAysnc(self, nickname)
        })
        .then(function(){
            return _modifyRemarkAsync(self, code)
        })
        .then(function(){
            callback(null);
        })
        .thenCatch(function(err){
            console.log('error occur ---- ' + err);
            callback(err)
        })
}
function _findOneInListAsync(self, id){
    return self.driver.findElements({'css': 'div[ng-repeat*="chatContact"]'})
        .then(function(collection) {
            collection.map(function(item){
                item.findElement({'css': 'div.chat_item >div.info >h3 >span'})
                    .then(function(span){
                        return span.getText();
                    })
                    .then(function(txt){
                        if(txt === id){
                            return item.click();
                        }
                    })
                    .thenCatch(function(err){
                        console.log(err)
                    })
            })
        })
}
function _findOneInChatAysnc(self, id){
    return self.driver.findElement({'css': '#chatArea div.card>div.card_bd>div.info>h3'})
        .then(function(item){
            item.getText()
                .then(function(txt){
                    !id && item.click();
                    if(id && txt === id){
                        return item.click()
                    }
                })
        })
        .thenCatch(function(e){
            console.log('Failed to findOne in chat[code]-----' + JSON.stringify(e))
        })
}
function replayMsg(self, count){
    //self._walkCurrList(count, callback);
    self._reply(count);
}