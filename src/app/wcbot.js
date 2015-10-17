var taskQueue = require('./TasksQueue');
var codeService = require('../services/codeService');
var webdriver = require('selenium-webdriver');
var genHelper = require('./webdriver-helper');
var EventEmitter = require('events').EventEmitter;
var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
var waitFor = require('../util').waitFor;
var request = require('request');
var j = request.jar();
var fs = require('fs');
var helper = genHelper(webdriver, driver);
var flow = webdriver.promise.controlFlow();
var findSuffix = require('./suffix-map').findSuffix;
var initialed = false;
var loggedIn = false;
var avatarLocator = webdriver.By.css('div.header > div.avatar');
var searchLocator = webdriver.By.className('frm_search');
var receiveRestLocator = webdriver.By.css('div.chat_list div.top');
var searchedContactLocator = webdriver.By.css(' div[data-height-calc=heightCalc]:nth-child(2) > div');
var fsServer = 'http://ci.www.wenode.org/api/file/upload';
var PromiseBB = require('bluebird');
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
/**
 * Launch the chrome client and get ready to polling
 */
WcBot.prototype.start = function(){
    var self = this;
    self._login(function(){
        //var url = 'http://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetmsgimg?&MsgID=6159434111060829045&skey=%40crypt_a24ceaa9_405fcaf18a5981c30cbf68d5953cd4c3';
        var url = 'http://wx.qq.com/';
        driver.manage().getCookies().then(function(cookies){
            cookies.forEach(function(cookie){
                var requestCookie = request.cookie(cookie.name + '=' + cookie.value);
                j.setCookie(requestCookie, url);
            });
            polling();
        });
        function polling(){
            console.log("polling---------------");
            setTimeout(function(){
                //add property id, add queue api already in
                return taskQueue.enqueue(self._walkChatList.bind(self), null, function(){
                    polling();

                })
            }, 1000);
        }
    });

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
    //if(!initialed || json.sendTo != self.sendTo){
    //    self.sendTo = json.sendTo;
    //    console.log(self.sendTo)
    taskQueue.enqueue(self._findOne.bind(self));
    //}
    taskQueue.enqueue(function(cb){
        driver.findElement({'id':'editArea'}).sendKeys(content);
        driver.findElement({css:'.btn_send'}).click().then(function(){
            chatCache[self.sendTo] = !chatCache[self.sendTo]? 1 : chatCache[self.sendTo]+1;
            receiveReset(function(){
                cb()
            })
        });
    }, null, function(){
        callback()
    });
    initialed = true;
};
/**
 * Read a contact,s profile
 * @param bid String
 * @param callback
 */
WcBot.prototype.readProfile = function(bid, callback){
    var self = this;
    taskQueue.enqueue(_readProfile.bind(self),{args:[bid, self], priority: 1, context:self}, callback);
};
/**
 * Attach a listener to WcBot, onReceive is invoke when a msg being received.
 * @param handler
 */
WcBot.prototype.onReceive = function(handler){
    var self = this;
    this.on('receive', function(data){
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
    this.on('contactAdded', function(data){
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
    taskQueue.enqueue(_addContact.bind(self), {args:[id, encodeId], priority: 1, context: self}, function(){
        callback();
    });
};

WcBot.prototype._listenCurrUser = function(){
    var self = this;
    currInteral = setInterval(self._walkCurrList.bind(self), 200);
};
WcBot.prototype._login = function(callback){
    var self = this;
    driver.get('https://wx.qq.com');
    driver.wait(function() {
        driver.isElementPresent(avatarLocator).then(function(present) {
            if(!loggedIn && present){
                //loggedIn = present;
                setTimeout(function(){
                    loggedIn = present;
                    self.emit('login');
                }, 3000);
            }
        });

        return loggedIn;
    }, 60*1000);
    self.once('login', callback);
};
WcBot.prototype._reply = function(count){
    driver.findElement({'id':'editArea'}).sendKeys("这个一个检测机器人，主人正在睡觉，请勿打扰");
    driver.findElement({css:'.btn_send'}).click();
};
WcBot.prototype._findOne = function(callback){
    var self = this;
    return _findOnePro(self.sendTo, callback)
};
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
};
WcBot.prototype._analysisPayload =function(){
    //TODO
};

function _readProfile(bid, self, callback){
    var box;
    _findOnePro(bid, function(){
        driver.sleep(500);
        driver.findElement({'css': '#chatArea>.box_hd'})
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
                        driver.sleep(500).then(function(){
                            return clickbtn2.click()
                        })
                        .then(function(){
                            return driver.sleep(2000);
                        })
                    })
                    .thenCatch(function(err){
                        console.log("err --------"+err)
                    })
            })
            .then(function(){
                console.log("@@@@@@@@@@@@@@@@@@@@@@");
                _readProfileChain(function(err, data){
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
function _readProfileChain(callback){
    console.log("!!!!!!!!!!!!!!!!!!!");
    var data = {},
        pop;
    driver.findElement({'css': 'div#mmpop_profile>div.profile_mini'})
        .then(function(popItem){
            console.log("@@@@@@@@@@@@@@@@@@");
            console.log(popItem)
            pop = popItem;
            return pop.findElement({'css': 'div.profile_mini_hd img'})
                .then(function(headImg){
                    console.log("##################");
                    console.log(headImg)
                    return headImg.getAttribute('src')
                })
                .then(function(src){
                    console.log("$$$$$$$$$$$$$$$$");
                    console.log(src)
                    return data.headUrl = src;
                })
        })
        .then(function(src){
            return pop.findElement({'css': 'div.profile_mini_bd>div.nickname_area h4'})
                .then(function(h4){
                    console.log("%%%%%%%%%%%%%%%%%%")
                    console.log(h4);
                    h4.getText()
                        .then(function(txt){
                            console.log("^^^^^^^^^^^^^^^^^^")
                            console.log(txt);
                            return data.nickName = txt;
                        })
                })
        })
        .then(function(){
            return pop.findElement({'css': 'div.profile_mini_bd>div.meta_area>div.meta_item:nth-child(1) p'})
                .then(function(bidItem){
                    console.log("&&&&&&&&&&&&&&&");
                    console.log(bidItem);
                    return bidItem.getText()
                })
                .then(function(bidtxt){
                    console.log("****************");
                    console.log(bidtxt);
                    return data.bid = bidtxt;
                })
        })
        .then(function(){
            return pop.findElement({'css': 'div.profile_mini_bd>div.meta_area>div.meta_item:nth-child(2) p'})
                .then(function(placeItem){
                    console.log("****************");
                    console.log(placeItem);
                    return placeItem.getText()
                })
                .then(function(placetxt){
                    console.log("****************");
                    console.log(placetxt);
                    data.place = placetxt;
                    console.log(data)
                    receiveReset(function(){
                        return callback(null, data);
                    });
                })
        })
        .thenCatch(function(err){
            return callback(err)
        })
}
function _addContact(id, encodeId, callback){
    var nickname = id;
    var code = encodeId;
    _findOneInListAsync('朋友推荐消息')
        .then(function(){
            return _findOneInChatAysnc(nickname)
        })
        .then(function(){
            return _modifyRemarkAsync(code)
        })
        .then(function(){
            callback(null);
        })
        .thenCatch(function(err){
            console.log('error occur ---- ' + err);
            callback(err)
        })
}
function _findOneInListAsync(id){
    return driver.findElements({'css': 'div[ng-repeat*="chatContact"]'})
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
function _findOneInChatAysnc(id){
    return driver.findElement({'css': '#chatArea div.card>div.card_bd>div.info>h3'})
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
function _findElementsInChatAysnc(){
    return driver.findElements({'css': '#chatArea div.card>div.card_bd>div.info>h3'})
        .then(function(items){
            return items
        })
        .thenCatch(function(e){
            console.log('Failed to findOne in chat[code]-----' + JSON.stringify(e))
        })
}
function _modifyRemarkAsync(codeTmp){
    var item, code, nickName;
    if(!codeTmp){
        code = codeService.fetch();
    }
    return driver.findElement({'css' :'#mmpop_profile >div.profile_mini >div.profile_mini_bd'})
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
            console.log("======================");
            return item.findElement({'css': 'div.meta_area p'})
        })
        .then(function(itemp){
            return driver.sleep(200)
                .then(function(){
                    itemp.click()
                        .then(function(){
                            return driver.executeScript('window.document.querySelector("div.meta_area p").innerText = "";')
                        })
                        .then(function(){
                            return itemp.sendKeys(code)
                        })
                        .then(function(){
                            return driver.sleep(500)
                        })
                        .then(function(){
                            return driver.executeScript('window.document.querySelector("div.meta_area p").blur();')
                        })
                })
        })
        .then(function(){
            return driver.executeScript('window.document.querySelector("#mmpop_profile >div.profile_mini >div.profile_mini_bd a").click();')
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
function _findOnePro(id, callback){
    driver.findElement(searchLocator).sendKeys(id);
    driver.sleep(1000);
    driver.findElements({
        'css': 'div.contact_item.on'
    }).
        then (function (collection) {
        //var len = collection.length, i=0;
        collection.map(function (item) {
            var contactItem = item;
            item.findElement({'css': 'h4.nickname'}).then(function(infoItem){
                infoItem.getText().
                    then(function (value) {
                        //i++;
                        if (value === id) {
                            contactItem.click().then(function(){
                                callback(null, null);
                            })
                        }
                        //else if(i === len){
                        //    callback(new Error('user does not exist'));
                        //}
                    });
            });
        });
    });
}
function pollingDispatcher(input){
    //var handlers = {
    //    '朋友推荐消息': function(self, item, parentItem, callback){
    //        parentItem.click()
    //            .then(function(){
    //                return driver.sleep(500);
    //            })
    //            .then(function(){
    //                return _findOneInChatAysnc()
    //                    .then(function(){
    //                        return _modifyRemarkAsync()
    //                    })
    //                    .then(function(profile){
    //                        console.log("%%%%%%%%%%%%%%%%%%%");
    //                        console.log(profile);
    //                        console.log(self);
    //                        self.emit('contactAdded', {err: null, data: {bid: profile.code, nickName: profile.nickName}});
    //                        driver.sleep(500).then(function(){
    //                            return receiveReset(callback);
    //                        })
    //                    })
    //                    .thenCatch(function(err){
    //                        console.log("Failed to add contact----");
    //                        console.log(err);
    //                        callback();
    //                    })
    //            })
    //    },
    var handlers = {
        '朋友推荐消息': function(self, item, parentItem, callback){
            parentItem.click()
                .then(function(){
                    return driver.sleep(500);
                })
                .then(function(){
                return _findElementsInChatAysnc()
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
                        return driver.sleep(1000)
                    })
                    .then(function(){
                        return clearPanelAsync();
                    })
                    .then(function() {
                        return receiveReset(callback);
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
                    return _modifyRemarkAsync()
                })
                .then(function(profile){
                    console.log("%%%%%%%%%%%%%%%%%%%");
                    console.log(profile);
                    console.log(self);
                    self.emit('contactAdded', {err: null, data: {bid: profile.code, nickName: profile.nickName}});

                })
            }
            function clearPanelAsync(){
                var chatArea, posX;
                return driver.findElement({css: '.chat_bd'})
                .then(function(item){
                    chatArea = item;
                    return driver.executeScript('return document.querySelector(".chat_bd").clientWidth')
                })
                .then(function(width){
                    console.log("{{{{{{{{{{{{{{{{{{{{{{{{");
                    console.log(width);
                    console.log(typeof width);
                    posX = parseInt(width, 10) - 10;
                    console.log(webdriver.Button.RIGHT);
                    return new webdriver.ActionSequence(driver)
                        .mouseMove(chatArea, {x: posX, y:0})
                        .click(chatArea,  webdriver.Button.RIGHT)
                        .perform();
                })
                .then(function(){
                    console.log("action execute ok**************************");
                    return driver.findElement({css: 'a[ng-click="item.callback()"]'})
                })
                .then(function(item){
                    return item.click();
                })
                .then(function(){
                    return driver.sleep(500);
                })
            }
        },
        'defaultHandler': function(self, item, parentItem, callback){
            self.sendTo = input;
            item.getText()
                .then(function(count){
                    parentItem.click()
                    .then(function(){
                        return driver.sleep(200);
                    })
                    .then(function(){
                        spiderContent(self, count, function(err, msgArr){
                            if(msgArr){
                                self.emit('receive', {err: null, data: {msgArr: msgArr, bid: input}});
                            }
                            return receiveReset(callback);
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
    driver.findElement({'css': '#chatArea'})
        .then(function(chatwrapper){
            return chatwrapper.findElements({'css': '.js_message_bubble'})
        })
        .then(function(collection){
            console.log("^^^^^^^^^^^^^^^^^^^^");
            console.log(collection.length);
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
        promise.findElement({'css': '.bubble_cont >div'})
            .then(function(item){
                currNode = item;
                return item.getAttribute('class')
            })
            .then(function(className){
                console.log("className###################")
                console.log(className);
                if(className === 'plain'){
                    console.log("***********************")
                    currNode.findElement({'css': 'pre.js_message_plain'})
                    .then(function(preEl){
                        preEl.getText().then(function(payLoad){
                            var msg = {
                                FromUserName: self.sendTo,
                                Content: payLoad,
                                MsgType: 'text',
                                CreateTime: new Date().getTime()
                            };
                            return callback(null, msg);
                        })
                    })
                    .thenCatch(function(e){
                        return callback(e, null)
                    })
                }
                if(className === 'picture'){
                    console.log("enter pic----------------");
                    currNode.findElement({'css': '.msg-img'})
                    .then(function(img){
                        console.log("img----------------");
                        console.log(img);
                        return img.getAttribute('src')
                    })
                    .then(function(src){
                        console.log("src----------------" + src);
                        return getMediaUrl(src)
                    })
                    .then(function(url){
                        console.log("url----------------" + url);
                        getMediaFile(url, function(err, res){
                            if(err){
                                return callback(err, null)
                            }
                            var msg = {
                                FromUserName: self.sendTo,
                                MediaId: res,
                                CreateTime: new Date().getTime(),
                                MsgType: 'image'
                            };
                            callback(null, msg);
                        })
                    })
                    .thenCatch(function(e){
                        callback(e, null)
                    })
                }
                if(className === 'voice'){
                    promise.getAttribute('data-cm').then(function(attr){
                        var obj = JSON.parse(attr);
                        getMediaFile('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetvoice?msgid=' + obj.msgId, function(err, res){
                            if(err){
                                return callback(err, null)
                            }
                            var msg = {
                                FromUserName: self.sendTo,
                                MediaId: res,
                                MsgType: 'voice',
                                CreateTime: new Date()
                            };
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
function receiveReset(callback){
    return driver.findElement(receiveRestLocator)
        .then(function(item){
            console.log("-----------------------------")
            return item.click()
                .then(function(){
                    item.click()
                        .then(function(){
                            console.log("============================");
                            return callback()
                        })
                })
        })
        .thenCatch(function(err){
            console.log("Failed to reset in list [code]-------");
            console.log(err);
        })
}
function replayMsg(self, count){
    //self._walkCurrList(count, callback);
    self._reply(count);
}

module.exports = WcBot;

