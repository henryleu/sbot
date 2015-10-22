var TaskQueue = require('./TasksQueue');
var codeService = require('../services/codeService');
var PromiseBB = require('bluebird');
var settings = require('../app/settings');
var webdriver = require('selenium-webdriver');
var EventEmitter = require('events').EventEmitter;
var waitFor = require('../util').waitFor;
var getCount = require('../util').getCount;
var request = require('request');
var j = request.jar();
var fs = require('fs');
var findSuffix = require('./suffix-map').findSuffix;
var avatarLocator = webdriver.By.css('div.header > div.avatar');
var searchLocator = webdriver.By.className('frm_search');
var receiveRestLocator = webdriver.By.css('div.chat_list div.top');
var searchedContactLocator = webdriver.By.css(' div[data-height-calc=heightCalc]:nth-child(2) > div');
var fsServer = settings.fsUrl;
var chatCache = {};
var currInteral = {};
var reconnectTime = settings.reconnectTime;

function WcBot(id){
    EventEmitter.call(this);
    this.id = id;
    this.sendTo = null;
    this.driver = new webdriver.Builder()
        .withCapabilities(webdriver.Capabilities.chrome())
        .setControlFlow(new webdriver.promise.ControlFlow())
        .build();
    this.taskQueue = new TaskQueue(1);
    this.loggedIn = false;
    this.callCsToLogin = null;
    this.waitForLogin = null;
}
var util = require('util');
util.inherits(WcBot, EventEmitter);
/**
 * Launch the chrome client and get ready to polling
 */
WcBot.prototype.start = function(){
    var self = this;
    self._login(function(err, data){
        console.log('login ok');
        if(err) {

        }else{
            self._polling();
        }
    });
};

/**
 * Close the browser and reset bot,s data
 * @return Promise
 */
WcBot.prototype.stop = function(){
    var self = this;
    return self.driver.close()
        .then(function(){
            return new Promise(function(resolve, reject){
                setTimeout(function(){
                    resolve();
                }, 2000)
            })
        })
        .then(function(){
            self.sendTo = null;
            self.driver = new webdriver.Builder()
                .withCapabilities(webdriver.Capabilities.chrome())
                .setControlFlow(new webdriver.promise.ControlFlow())
                .build();
            self.taskQueue = new TaskQueue(1);
            self.loggedIn = false;
            self.callCsToLogin = null;
            self.waitForLogin = null;
        })
};

/**
 * Send a msg to a contact
 * @param json {sendTo, content}
 * @param callback
 */
WcBot.prototype.send = function(json, callback) {
    var self = this;
    self.sendTo = json.sendTo;
    var content = json.content;
    self.taskQueue.enqueue(self._findOne.bind(self), null, callback);
    self.taskQueue.enqueue(function(cb){
        self.driver.findElement({'id':'editArea'}).sendKeys(content);
        self.driver.findElement({css:'.btn_send'}).click()
            .then(function(){
                chatCache[self.sendTo] = !chatCache[self.sendTo]? 1 : chatCache[self.sendTo]+1;
                receiveReset(self, function(){
                    cb()
                })
            });
    }, null, callback);
};

/**
 * Read a contact,s profile
 * @param bid String
 * @param callback
 */
WcBot.prototype.readProfile = function(bid, callback){
    var self = this;
    self.taskQueue.enqueue(_readProfile.bind(self),{args:[bid, self], priority: 1, context:self}, callback);
};

/**
 * Attach a listener to WcBot, onReceive is invoke when a msg being received.
 * @param handler
 */
WcBot.prototype.onReceive = function(handler){
    var self = this;
    this.removeAllListeners('receive').on('receive', function(data){
        var err = data.err;
        var data = data.data;
        handler.call(self, err, data);
    });
};

/**
 * emit a needLogin event, allow cs to login
 * @param handler
 */
WcBot.prototype.onNeedLogin = function(handler){
    var self = this;
    this.removeAllListeners('needLogin').on('needLogin', function(data){
        var err = data.err;
        var data = data.data;
        handler.call(self, err, data);
    });
};

/**
 * Attach a listener to WcBot, onAddContact is invoke when a contact being added.
 * @param handler
 */
WcBot.prototype.onAddContact = function(handler){
    var self = this;
    this.removeAllListeners('contactAdded').on('contactAdded', function(data){
        var err = data.err;
        var data = data.data;
        handler.call(self, err, data);
    });
};

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
 * Attach a listener to a disconnect event
 * @param handler
 */
WcBot.prototype.onDisconnect = function(handler){
    this.removeAllListeners('disconnect').on('disconnect', handler);
};

/**
 * ready to polling
 * @private
 */
WcBot.prototype._polling = function(){
    var self = this;
    var url = 'http://wx.qq.com/?lang=zh_CN';
    setCookiesAndPolling();
    function setCookiesAndPolling(){
        self.driver.manage().getCookies().then(function(cookies){
            cookies.forEach(function(cookie){
                var requestCookie = request.cookie(cookie.name + '=' + cookie.value);
                j.setCookie(requestCookie, url);
            });
            polling();
        });
    }
    function polling(){
        if(!self.loggedIn){
            return;
        }
        console.log("polling---------------");
        setTimeout(function(){
            //pre task, check the client disconnected or not
            if(getCount()%3 === 0){
                return self.taskQueue.enqueue(self._LoginOrNot.bind(self), null, function(err, data){
                    if(err || data === true){
                        self.loggedIn = false;
                        //client is disconnected, close the driver and start again
                        self.emit('disconnect', {err: null, data:{botid: self.id}});
                        self.stop().then(function(){
                            self.start();
                        });
                    } else {
                        //connection is ok, check whether msgs are arrived
                        return self.taskQueue.enqueue(self._walkChatList.bind(self), null, polling);
                    }
                });
            }
            return self.taskQueue.enqueue(self._walkChatList.bind(self), null, polling);
        }, 1000);
    }
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
 * launch a chrome client and ready to login
 * @param callback
 * @private
 */
WcBot.prototype._login = function(callback){
    var self = this;
    self.driver.get('https://wx.qq.com/?lang=zh_CN')
        .then(function(){
            needLogin(self, function(err, media_id){
                if(err){
                    return console.warn(err);
                }
                return;
            });
            self.callCsToLogin = setInterval(function(){
                needLogin(self, function(err, media_id){
                    if(err){
                        return console.warn(err);
                    }
                });
            }, 15*60*1000);
            self.waitForLogin = setInterval(function(){
                self.driver.findElement({css: '.nickname span'})
                    .then(function(span){
                        return span.getText()
                    })
                    .then(function(txt){
                        if(!self.loggedIn && txt != ""){
                            console.log(self.id);
                            clearInterval(self.waitForLogin);
                            clearInterval(self.callCsToLogin);
                            self.loggedIn = true;
                            callback(null, null);
                        }
                    })
                    .thenCatch(function(e){
                        //TODO
                        self.stop()
                            .then(function(){
                                self.start();
                            });
                        console.error(e);
                    })
            }, 2000);
        })
        .thenCatch(function(e){
            console.error(e);
            callback(e, null);
        });
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

/**
 * search the sender in contacts
 * @param callback
 * @returns {Promise}
 * @private
 */
WcBot.prototype._findOne = function(callback){
    var self = this;
    return _findOnePro(self, self.sendTo, callback)
};

/**
 * walk in left panel, check to whether messages arrived
 * @param callback
 * @private
 */
WcBot.prototype._walkChatList = function(callback){
    var self = this;
    self.driver.findElements({'css': 'div[ng-repeat*="chatContact"]'})
        .then(function(collection){
            function iterator(index){
                var item = currItem = collection[index];
                item.findElement({'css': 'i.web_wechat_reddot_middle.icon'})
                    .then(function(iblock){
                        var iblockTemp = iblock;
                        item.findElement({'css': 'span.nickname_text'})
                            .then(function(h3El){
                                h3El.getText()
                                    .then(function(txt){
                                        return pollingDispatcher(txt)(self, iblockTemp, currItem, callback);
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
};

/**
 * analysis the payload in message
 * @private
 */
WcBot.prototype._analysisPayload =function(){
    //TODO
};

/**
 * validator of login or not
 * @param callback
 * @private
 */
WcBot.prototype._LoginOrNot = function(callback){
    var self = this;
    self.driver.findElement({css: '.nickname span'})
        .then(function(span){
            return span.getText()
        })
        .then(function(txt){
            if(txt != '' && self.loggedIn){
                return callback(null, null);
            }
            needLogin(self, callback);
        })
        .thenCatch(function(e){
            if(e.code == 7){
                return needLogin(self, callback);
            }
            callback(e, null);
        });
};

function getLoginQr(wcBot, callback){
    var self = wcBot;
    console.log("enter git login qr");
    waitFor(self.driver, {css: '.qrcode img'}, 50000)
        .then(function(){
            console.log("wait ok qr img node ready");
            return self.driver.findElement({css: '.qrcode img'});
        })
        .then(function(img){
            console.log("img enter-------");
            img.getAttribute('src')
                .then(function(src){
                    console.log(src)
                    var formData = {
                        file: {
                            value: request({url: src, jar: j, encoding: null}),
                            options: {
                                filename: 'xxx.jpg'
                            }
                        }
                    };
                    request.post({url: fsServer, formData: formData}, function(err, res, body) {
                        if(err){
                            console.error('Failed to upload qr img when client disconnect');
                            console.error(err);
                            return callback(err, null);
                        }
                        var json = JSON.parse(body);
                        if(json.err){
                            return callback(json.err, null);
                        }
                        callback(null, json['media_id']);
                    });
                })
                .thenCatch(function(e){
                    console.error('Failed to get img attribute when client disconnect');
                    return callback(e, null);
                })
        })
        .thenCatch(function(e){
            console.error('Failed to find img node when client disconnect');
            return callback(e, null);
        })
}

function needLogin(wcBot, callback){
    var self = wcBot;
    getLoginQr(self, function(err, media_id){
        if(!err){
            console.log(media_id);
            self.emit('needLogin', {err: null, data:{media_id: media_id, botid: self.id}});
            return callback(null, null);
        }
        self.stop().then(function(){
            callback(err, null);
        });
    })
}

function _readProfile(bid, self, callback){
    var box;
    _findOnePro(self, bid, function(){
        self.driver.sleep(500);
        self.driver.findElement({'css': '#chatArea>.box_hd'})
            .then(function(boxItem){
                box = boxItem;
                return box.findElement({'css': 'div.title_wrap>div.title.poi'})
                    .then(function(clickbtn1){
                        return clickbtn1.click()
                    })
            })
            .then(function(){
                return box.findElement({'css': 'div#chatRoomMembersWrap div.member:nth-child(2)>img'})
                    .then(function(clickbtn2){
                        self.driver.sleep(500).then(function(){
                            return clickbtn2.click()
                        })
                        .then(function(){
                            return self.driver.sleep(2000);
                        })
                    })
                    .thenCatch(function(err){
                        console.log("err --------"+err)
                    })
            })
            .then(function(){
                _readProfileChain(self, function(err, data){
                    if(err){
                        throw new Error('Failed to read Profile Chain');
                        return;
                    }
                    return callback(null, data);
                })
            })
            .thenCatch(function(err){
                console.log("readprofile err---------" + err)
                return callback(err)
            })
    });
}

function _readProfileChain(self, callback){
    var data = {},
        pop;
    self.driver.findElement({'css': 'div#mmpop_profile>div.profile_mini'})
        .then(function(popItem){
            pop = popItem;
            return pop.findElement({'css': 'div.profile_mini_hd img'})
                .then(function(headImg){
                    return headImg.getAttribute('src')
                })
                .then(function(src){
                    return data.headIconUrl = src;
                })
        })
        .then(function(src){
            return pop.findElement({'css': 'div.profile_mini_bd>div.nickname_area h4'})
                .then(function(h4){
                    h4.getText()
                        .then(function(txt){
                            return data.nickname = txt;
                        })
                })
        })
        .then(function(){
            return pop.findElement({'css': 'div.profile_mini_bd>div.meta_area>div.meta_item:nth-child(1) p'})
                .then(function(bidItem){
                    return bidItem.getText()
                })
                .then(function(bidtxt){
                    return data.bid = bidtxt;
                })
        })
        .then(function(){
            return pop.findElement({'css': 'div.profile_mini_bd>div.meta_area>div.meta_item:nth-child(2) p'})
                .then(function(placeItem){
                    return placeItem.getText()
                })
                .then(function(placetxt){
                    data.place = placetxt;
                    data.botid = self.id;
                    receiveReset(self, function(){
                        return callback(null, data);
                    });
                })
        })
        .thenCatch(function(err){
            return callback(err)
        })
}

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
            console.log(collection.length);
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

function _findElementsInChatAysnc(self){
    return self.driver.findElements({'css': '#chatArea div.card>div.card_bd>div.info>h3'})
        .then(function(items){
            return items
        })
        .thenCatch(function(e){
            console.log('Failed to findOne in chat[code]-----' + JSON.stringify(e))
        })
}

function _modifyRemarkAsync(self, codeTmp){
    var item, code, nickName;
    if(!codeTmp){
        code = codeService.fetch();
    }
    return self.driver.findElement({'css' :'#mmpop_profile >div.profile_mini >div.profile_mini_bd'})
        .then(function(itemtmp){
            item = itemtmp;
            item.findElement({'css': 'div.nickname_area h4'})
                .then(function(h4El){
                    return h4El.getText()
                })
                .then(function(txt){
                    console.log("-----------------------");
                    console.log(txt);
                    return nickName = txt;
                })
        })
        .then(function(){
            return item.findElement({'css': 'div.meta_area p'})
        })
        .then(function(itemp){
            return self.driver.sleep(200)
                .then(function(){
                    itemp.click()
                        .then(function(){
                            return self.driver.executeScript('window.document.querySelector("div.meta_area p").innerText = "";')
                        })
                        .then(function(){
                            return itemp.sendKeys(code)
                        })
                        .then(function(){
                            return self.driver.sleep(500)
                        })
                        .then(function(){
                            return self.driver.executeScript('window.document.querySelector("div.meta_area p").blur();')
                        })
                })
        })
        .then(function(){
            return self.driver.executeScript('window.document.querySelector("#mmpop_profile >div.profile_mini >div.profile_mini_bd a").click();')
                .then(function(){
                    return {
                        code: code,
                        nickName: nickName
                    };
                })
        })
        .thenCatch(function(err){
            console.log("Failed to modify remark [code]---------")
            console.log(err)
        })
}

function _findOnePro(self, id, callback){
    self.driver.findElement(searchLocator).sendKeys(id);
    self.driver.sleep(1000);
    self.driver.findElements({
        'css': 'div.contact_item.on'
    }).
        then (function (collection) {
        var len = collection.length;
        var i=0;
        collection.map(function (item) {
            var contactItem = item;
            item.findElement({'css': 'h4.nickname'})
                .then(function(infoItem){
                    infoItem.getText().
                        then(function (value) {
                            i++;
                            if (value === id) {
                                contactItem.click().then(function(){
                                    callback(null, null);
                                });
                                return;
                            }
                            else if(i === len){
                                //send to is not exist
                                receiveReset(self, function(){
                                    self.driver.findElement(searchLocator)
                                        .then(function(searchInput){
                                            return searchInput.clear();
                                        })
                                        .then(function(){
                                            callback(new Error('user does not exist'));
                                        })
                                        .thenCatch(function(e){
                                            callback(new Error('Failed to clear search input'));
                                        })
                                });
                            }
                        });
                });
        });
    });
}

function pollingDispatcher(input){
    var handlers = {
        '朋友推荐消息': function(self, item, parentItem, callback){
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
                        return receiveReset(self, callback);
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
                    return _modifyRemarkAsync(self)
                })
                .then(function(profile){
                    self.emit('contactAdded', {err: null, data: {botid: self.id, bid: profile.code, nickName: profile.nickName}});

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
                    posX = parseInt(width, 10) - 10;
                    return new webdriver.ActionSequence(self.driver)
                        .mouseMove(chatArea, {x: posX, y:0})
                        .click(chatArea,  webdriver.Button.RIGHT)
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
            }
        },
        'defaultHandler': function(self, item, parentItem, callback){
            self.sendTo = input;
            item.getText()
                .then(function(count){
                    parentItem.click()
                    .then(function(){
                        return self.driver.sleep(200);
                    })
                    .then(function(){
                        spiderContent(self, count, function(err, msgArr){
                            if(msgArr){
                                self.emit('receive', {err: null, data: {msgArr: msgArr}});
                            }
                            return receiveReset(self, callback);
                        })
                    });
                })
                .thenCatch(function(err){
                    console.log("Failed to receive msg [code]-----")
                    console.log(err);
                })
        }
    };
    return handlers[input] || handlers['defaultHandler'];
}

function spiderContent(self, unReadCount, callback){
    //walk in dom
    self.driver.findElement({'css': '#chatArea'})
        .then(function(chatwrapper){
            return chatwrapper.findElements({'css': '.js_message_bubble'})
        })
        .then(function(collection){
            var unreadArr = collection.slice(-unReadCount);
            var PromiseArr = [];
            unreadArr.forEach(function(item){
                PromiseArr.push(_getContentAsync(self, item));
            });
            return PromiseBB.all(PromiseArr).then(function(arr){
                return arr;
            })
        })
        .then(function(msgArr){
            return callback(null, msgArr);
        })
        .thenCatch(function(err){
            console.log("err--------------"+err);
            return callback(err);
        });
    function _getContent(self, promise, callback){
        var currNode = null;
        var msg = {
            MsgId: codeService.fetch(),
            FromUserName: self.sendTo,
            ToUserName: self.id,
            CreateTime: Math.ceil(parseInt(new Date().getTime(), 10)/1000).toString()
        };
        promise.findElement({'css': '.bubble_cont >div'})
            .then(function(item){
                currNode = item;
                return item.getAttribute('class')
            })
            .then(function(className){
                if(className === 'plain'){
                    return currNode.findElement({'css': 'pre.js_message_plain'})
                    .then(function(preEl){
                        return preEl.getText().then(function(payLoad){
                            if(!payLoad){
                                msg['Content'] = payLoad;
                                msg['MsgType'] = 'text';
                                return callback(null, msg);
                            } else {
                                return preEl.findElement({'css': 'img'})
                                    .then(function(img){
                                        return img.getAttribute('text');
                                    })
                                    .then(function(text){
                                        //custom expression eg: [开心]_web
                                        msg['Content'] = text.split('_')[0];
                                        msg['MsgType'] = 'text';
                                        callback(null, msg);
                                    })
                            }

                        })
                    })
                    .thenCatch(function(e){
                        return callback(e, null)
                    })
                }
                if(className === 'picture'){
                    console.log("receive a img message----------------");
                    return currNode.findElement({'css': '.msg-img'})
                    .then(function(img){
                        return img.getAttribute('src')
                    })
                    .then(function(src){
                        return getMediaUrl(src)
                    })
                    .then(function(url){
                        console.log("img url----------------" + url);
                        getMediaFile(url, function(err, res){
                            if(err){
                                return callback(err, null)
                            }
                            msg['MediaId'] = res;
                            msg['MsgType'] = 'image';
                            callback(null, msg);
                        })
                    })
                    .thenCatch(function(e){
                        callback(e, null)
                    })
                }
                if(className === 'voice'){
                    return promise.getAttribute('data-cm').then(function(attr){
                        var obj = JSON.parse(attr);
                        getMediaFile('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetvoice?msgid=' + obj.msgId, function(err, res){
                            if(err){
                                return callback(err, null)
                            }
                            msg['MediaId'] = res;
                            msg['MsgType'] = 'voice';
                            callback(null, msg);
                        });
                    })
                    .thenCatch(function(e){
                        callback(e, null)
                    })
                }
            });
            function getMediaUrl(src){
                var url = src.split('&type=slave')[0];
                return url;
            }
            function getMediaFile(url, callback){
                console.log("getFileUrl-------------" + url);
                request({url: url, jar: j, encoding: null}, function(err, res, body){
                    var resSplit = res.req.path.split('/');
                    var fileType = validateMedia();
                    if(!fileType){
                        setTimeout(getMediaFile(url, callback), 1000);
                        return;
                    }
                    console.log("body-------------" + JSON.stringify(body));
                    console.log("filename-------------" + resSplit[resSplit.length-1]);
                    console.log("contentType-------------" + res.headers['content-type']);
                    var formData = {
                        file: {
                            value: request({url: url, jar: j, encoding: null}),
                            options: {
                                filename: 'xxx.' + fileType,
                                //contentType: res.headers['content-type']
                            }
                        }
                    };
                    request.post({url:fsServer, formData: formData}, function(err, res, body) {
                        console.log("remote file-----------------" + JSON.stringify(json));
                        if (err) {
                            return callback(err, null);
                        }
                        var json = JSON.parse(body);
                        if(json.err){
                            return call(json.err, null);
                        }
                        callback(null, json['media_id']);
                    });
                });
            }
        function validateMedia(type){
            try{
                return findSuffix(type);
            }catch(e){
                return false;
            }
        }
    }
    var _getContentAsync = PromiseBB.promisify(_getContent);
}

function receiveReset(self, callback){
    return self.driver.findElement(receiveRestLocator)
        .then(function(item){
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
}

function replayMsg(self, count){
    //self._walkCurrList(count, callback);
    self._reply(count);
}

module.exports = WcBot;

