var TaskQueue = require('l-mq');
var settings = require('../app/settings');
var webdriver = require('selenium-webdriver');
var EventEmitter = require('events').EventEmitter;
var waitFor = require('../util').waitFor;
var getCount = require('../util').getCount;
var request = require('request');
var fsServer = settings.fsUrl;
var myErr = require('./myerror');
var util = require('util');
//funcs
var createDriver = require('../webdriver/webdriverFactory');
var spiderGroupListInfo = require('../funcs/group-list');
var spiderContactListInfo = require('../funcs/contact-list');
var receiveReset = require('../funcs/reset-pointer');
var _findOnePro = require('../funcs/find-one-contract');
var readProfile = require('../funcs/read-profile').readProfile;
var completeProfileAsync = require('../funcs/profile-complete');
var suggestFriendHandler = require('../funcs/friend-suggest-message');
var _modifyRemarkAsync = require('../funcs/modify-user-remark');
var receiveMessageHandler = require('../funcs/receive-message');
/**
 * @param id(string=) botid
 * @constructor
 */
function WcBot(id){
    EventEmitter.call(this);
    this.id = id;
    this.sendTo = null;
    this.driver = createDriver();
    this.taskQueue = new TaskQueue(1);
    this.loggedIn = false;
    this.callCsToLogin = null;
    this.waitForLogin = null;
    this.baseUrl = "";
    this.j = request.jar();
}
util.inherits(WcBot, EventEmitter);
/**
 * Launch the chrome client and get ready to polling
 */
WcBot.prototype.start = function(){
    console.log('begin start')
    var self = this;
    self._login(function(err, data){
        console.log('login ok');
        if(err) {
            self.stop().then(function(){
                self.start();
            })
        }else{
            self._polling();
        }
    });
};

/**
 *
 * @returns {!goog.Promise|!promise.Promise.<R>|*}
 */
WcBot.prototype.restart = function(){
    var self = this;
    return self.driver.close()
        .then(function(){
            return self.init(self);
        })
        .thenCatch(function(e){
            console.error('[system]: Failed to stop bot');
            console.error(e);
            return self.init(self);
        })
        .then(function(){
            return self.start();
        })
};

/**
 * Close the browser and reset bot,s data
 * @return Promise
 */
WcBot.prototype.stop = function(){
    var self = this;
    return self.driver.close()
        .then(function(){
            return self.init(self);
        })
        .thenCatch(function(e){
            console.error('[system]: Failed to stop bot');
            console.error(e);
            return self.init(self);
        })
};

/**
 * init wcBot
 * @param json
 * @param callback
 */
WcBot.prototype.init = function(bot) {
    bot.sendTo = null;
    bot.driver = createDriver();
    bot.taskQueue = new TaskQueue(1);
    bot.loggedIn = false;
    if(bot.callCsToLogin){
        bot.callCsToLogin = null;
        clearInterval(bot.callCsToLogin);
    }
    if(bot.waitForLogin){
        clearInterval(bot.waitForLogin);
        bot.waitForLogin = null;
    }
    bot.emit('abort', {err: null, data: {botid: bot.id}});
    return bot.driver.sleep(3000);
};

/**
 * Send a msg to a contact
 * @param json {sendTo, content}
 * @param callback
 */
WcBot.prototype.send = function(json, callback) {
    var self = this;
    console.info("[transaction]: Begin to send message to the contact which bid is " + json.sendTo);
    self.taskQueue.enqueue(function(cb) {
        self.sendTo = json.sendTo;
        var content = json.content;
        self._findOne(function (err) {
            if(err){
                console.warn("[flow]: Failed to find the contact");
                console.warn(err);
                return cb();
            }
            console.info("[flow]: Succeed to find the contact");
            self.driver.findElement({'css': '#editArea'})
                .then(function (item) {
                    return item.sendKeys(content);
                })
                .then(function () {
                    return self.driver.findElement({css: '.btn_send'})
                })
                .then(function (sendInput) {
                    return sendInput.click()
                })
                .then(function () {
                    console.info("[flow]: send message successful");
                    receiveReset(self, cb);
                })
                .thenCatch(function (e) {
                    console.log(e);
                    cb();
                })
        })
    }, null, callback)
};

/**
 * Read a contact,s profile
 * @param bid String
 * @param callback
 */
WcBot.prototype.readProfile = function(bid, callback){
    var self = this;
    self.taskQueue.enqueue(readProfile.bind(self),{args:[bid, self], priority: 1, context:self}, callback);
};

/**
 * spider the group,s info(username and groupname)
 * @param bid (string=)
 * @param callback
 */
WcBot.prototype.groupList = function(callback){
    var self = this;
    self.taskQueue.enqueue(spiderGroupListInfo, {args:[self]}, callback);
};

/**
 * spider contact list, obtain all users whether remarked or not
 * @param callback
 */
WcBot.prototype.contactList = function(callback){
    var self = this;
    self.taskQueue.enqueue(function(cb){
        var resultList = null;
        spiderContactListInfo(self, function(e, list){
            resultList = list;
            if(e){
                return cb(e);
            }
            receiveReset(self, cb);
            list.forEach(function(contact){
                if(contact.nickname.substr(0, 3) != 'bu-'){
                    self.taskQueue.enqueue(completeProfileAsync, {args:[self, contact.nickname]}, function(err, data){
                        if(err){
                            console.log("[flow]: Failed to get contact list");
                            console.warn(err);
                        }else{
                            self.emit('contactlist', {err: null, data: data})
                        }
                    });
                }else{
                    self.readProfile(contact.nickname, function(err, data){
                        if(err){
                            console.log("[flow]: Failed to get contact list");
                            console.warn(err);
                        }else{
                            self.emit('contactlist', {err: null, data: data})
                        }
                    });
                }
            });
        })
    }, null, callback);
};

/**
 * spider the contact,s info(nickname, headimgid, remark, place and sex)
 * @param bid (string=)
 * @param callback
 */
WcBot.prototype.contactListRemark = function(callback){
    var self = this;
    self.taskQueue.enqueue(function(cb){
        var resultList = null;
        spiderContactListInfo(self, function(e, list){
            resultList = list;
            if(e){
                return cb(e);
            }
            receiveReset(self, cb);
            list.forEach(function(contact){
                if(contact.nickname.substr(0, 3) != 'bu-'){
                    self.taskQueue.enqueue(completeProfileAsync, {args:[self, contact.nickname]}, function(err, data){
                        if(err){
                            console.log("[flow]: Failed to remark contact");
                            console.warn(err);
                        }else{
                            self.emit('remarkcontact', {err: null, data: data})
                        }
                    });
                }
            });
        })
    }, null, callback);
};

/**
 * Attach a contact list listener on WcBot
 * @param handler
 */
WcBot.prototype.onContactList = function(handler){
    var self = this;
    self.removeAllListeners('contactlist').on('contactlist', function(data){
        handler.call(self, data.err, data.data)
    });
};

/**
 * Attach a remark contact listener on WcBot
 * @param handler
 */
WcBot.prototype.onRemarkContact = function(handler){
    var self = this;
    self.removeAllListeners('remarkcontact').on('remarkcontact', function(data){
        handler.call(self, data.err, data.data)
    });
};

/**
 * Attach a login listener on WcBot
 * @param handler
 */
WcBot.prototype.onLogin = function(handler){
    var self = this;
    self.removeAllListeners('login').on('login', function(data){
        handler.call(self, data.err, data.data)
    });
};

/**
 * Attach a abort listener on WcBot
 * @param handler
 */
WcBot.prototype.onAbort = function(handler){
    var self = this;
    this.removeAllListeners('abort').on('abort', function(data){
        handler.call(self, data.err, data.data)
    });
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
    self.driver.getCurrentUrl().then(function(url){
        self.baseUrl = url;
        setCookiesAndPolling();
    });
    function setCookiesAndPolling(){
        self.driver.manage().getCookies().then(function(cookies){
            cookies.forEach(function(cookie){
                var requestCookie = request.cookie(cookie.name + '=' + cookie.value);
                self.j.setCookie(requestCookie, self.baseUrl);
            });
            polling();
        });
    }
    function polling(){
        if(getCount()%settings.pollingPrintGap === 0){
            console.info("[system]: the application continue to poll");
        }
        if(!self.loggedIn){
            return;
        }
        setTimeout(function(){
            //pre task, check the client disconnected or not
            if(getCount()%settings.pollingLoginOrNotGap === 0){
                return self.taskQueue.enqueue(self._LoginOrNot.bind(self), null, function(err, data){
                    if(err){
                        //client is disconnected, close the driver and start again
                        self.stop().then(function(){
                            return self.start();
                        });
                    } else {
                        //connection is ok, check whether msgs are arrived
                        return self.taskQueue.enqueue(self._walkChatList.bind(self), null, polling);
                    }
                });
            }
            return self.taskQueue.enqueue(self._walkChatList.bind(self), null, polling);
        }, settings.pollingGap);
    }
};

/**
 * launch a chrome client and ready to login
 * @param callback
 * @private
 */
WcBot.prototype._login = function(callback){
    var self = this;
    console.log("begin login");
    self.driver.get(settings.wxIndexUrl)
        .then(function(){
            needLogin(self, function(err, media_id){
                if(err){
                    console.error(err);
                    return self.stop()
                        .then(function(){
                            return self.start();
                        });
                }
                return;
            });
            self.callCsToLogin = setInterval(function(){
                needLogin(self, function(err, media_id){
                    if(err){
                        console.error(err);
                        self.stop()
                            .then(function(){
                                return self.start();
                            });
                    }
                    return;
                });
            }, settings.callCsToLoginGap);
            self.waitForLogin = setInterval(function(){
                self.driver.findElement({css: '.nickname span'})
                    .then(function(span){
                        return span.getText()
                    })
                    .then(function(txt){
                        if(!self.loggedIn && txt != ""){
                            clearInterval(self.waitForLogin);
                            clearInterval(self.callCsToLogin);
                            self.loggedIn = true;
                            self.emit('login', {err: null, data: {botid: self.id}});
                            callback(null, null);
                        }
                    })
                    .thenCatch(function(e){
                        console.error("[system]: Failed to wait for login");
                        console.error(e);
                        self.stop().then(function(){
                            self.start();
                        });
                    })
            }, settings.waitForLoginGap);
        })
        .thenCatch(function(e){
            console.error("[system]: Failed to login");
            console.error(e);
            callback(e, null);
        });
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
            var len = collection.length;
            function iterator(index){
                var item = collection[index];
                var iblockTemp = null;
                item.findElement({'css': 'i.web_wechat_reddot_middle.icon'})
                    .then(function(iblock){
                        if(!iblock){
                            return webdriver.promise.rejected(new webdriver.error.Error(801, 'no_result'))
                        }
                        iblockTemp = iblock;
                        return item.findElement({'css': 'span.nickname_text'})
                            .then(function(h3El){
                                return h3El.getText()
                            })
                            .then(function(txt){
                                console.info("[transaction] -receive : a new message received");
                                console.info("[flow]: the title is " + txt);
                                return pollingDispatcher(self, txt)(self, iblockTemp, item, callback);
                            })
                            .thenCatch(function(e){
                                console.info("[flow]: walk In dom failed");
                                console.error(e);
                                callback(e);
                            })
                    })
                    .thenCatch(function(e){
                        if(e.code === 7){
                            index++;
                            if(index <= (len-1)){
                                return iterator(index)
                            }
                            return callback(null, null);
                        }
                        console.error(e);
                        callback(e);
                    })
            }
            iterator(0);
        })
        .thenCatch(function(err){
            return callback(err);
        })
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
            } else {
                return webdriver.promise.rejected(new webdriver.error.Error(801, 'no_result'))
            }
        })
        .thenCatch(function(e){
            console.error(e);
            callback(e, null);
        });
};

function getLoginQr(wcBot, callback){
    var self = wcBot;
    console.info("[flow]: enter git login qr");
    waitFor(self.driver, {css: '.qrcode img'}, 50000)
        .then(function(){
            console.info("[flow]: wait ok qr img node ready");
            return self.driver.findElement({css: '.qrcode img'});
        })
        .then(function(img){
            img.getAttribute('src')
                .then(function(src){
                    console.info("[flow]: src is " + src);
                    var formData = {
                        file: {
                            value: request({url: src, jar: self.j, encoding: null}),
                            options: {
                                filename: 'xxx.jpg'
                            }
                        }
                    };
                    console.info('[flow]: file system server,s url is ' + fsServer);
                    request.post({url: fsServer, formData: formData}, function(err, res, body) {
                        if(err){
                            console.error('[system]: Failed to upload qr img when client disconnect');
                            console.error(err);
                            return callback(err, null);
                        }
                        try{
                            var json = JSON.parse(body);
                        }catch(e){
                            console.error("[system]: -Failed to get login qrcode -m JSON parse error");
                            console.error(body);
                            return callback(e, null);
                        }
                        if(json.err){
                            return callback(json.err, null);
                        }
                        callback(null, json);
                    });
                })
                .thenCatch(function(e){
                    console.error('[system]: Failed to get img attribute when client disconnect');
                    return callback(e, null);
                })
        })
        .thenCatch(function(e){
            console.error('[system]: Failed to find img node when client disconnect');
            return callback(e, null);
        })
}

function needLogin(wcBot, callback){
    var self = wcBot;
    getLoginQr(self, function(err, data){
        if(err){
            console.error('[flow]: Failed to get Qrcode that used to login');
            callback(err, null);
        }else{
            console.info("[flow]: get login qrcode successful the media_id is [ " + data.media_id + " ]");
            self.emit('needLogin', {err: null, data:{wx_media_id: data.wx_media_id, media_id: data.media_id, botid: self.id}});
            return callback(null, null);
        }
    })
}

function pollingDispatcher(self,input){
    var handlers = {
        '朋友推荐消息': suggestFriendHandler,
        'Recommend' : suggestFriendHandler,
        'defaultHandler': (function(input){
            self.sendTo = input;
            return receiveMessageHandler;
        })(input)
    };
    return handlers[input] || handlers['defaultHandler'];
}

module.exports = WcBot;

