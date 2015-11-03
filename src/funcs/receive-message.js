var PromiseBB = require('bluebird');
var request = require('request');
var reset = require('../funcs/reset-pointer');
var fsServer = require('../app/settings').fsUrl;

module.exports = function(self, item, parentItem, callback){
    console.info("[transaction]: begin to receive a message");
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
                        return reset(self, callback);
                    })
                })
                .thenCatch(function(e){
                    console.error(e);
                })
        })
        .thenCatch(function(err){
            console.log("[flow]: Failed to receive msg")
            console.log(err);
        })
};
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
        .thenCatch(function(e){
            console.log("[flow]: Failed to receive msg");
            console.log(e);
            return callback(e);
        });
    var _getContentAsync = PromiseBB.promisify(_getContent);
    function _getContent(self, promise, callback){
        var currNode = null;
        try{
            var msg = {
                MsgId: Math.ceil(parseInt(new Date().getTime(), 10)/1000).toString(),
                FromUserName: self.sendTo,
                ToUserName: self.id,
                CreateTime: parseInt(new Date().getTime(), 10).toString()
            };
        }catch(e){
            console.log(e)
        }
        promise.findElement({'css': '.bubble_cont >div'})
            .then(function(item){
                currNode = item;
                return item.getAttribute('class')
            })
            .then(function(className){
                if(className === 'plain'){
                    console.info('[flow]: type is plain');
                    currNode.findElement({'css': 'pre.js_message_plain'})
                        .then(function(preEl){
                            preEl.getText().then(function(payLoad){
                                console.info('[flow]: payLoad is');
                                console.info(payLoad);
                                if(payLoad){
                                    msg['Content'] = payLoad;
                                    msg['MsgType'] = 'text';
                                    return callback(null, msg);
                                } else {
                                    preEl.findElement({'css': 'img'})
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
                            console.error('[flow]: receive message failed');
                            console.error(e);
                            return callback(e, null)
                        })
                }
                if(className === 'picture'){
                    console.info("[flow]: type is image");
                    return currNode.findElement({'css': '.msg-img'})
                        .then(function(img){
                            return img.getAttribute('src')
                        })
                        .then(function(src){
                            return getMediaUrl(src)
                        })
                        .then(function(url){
                            console.info("[flow]: url is " + url);
                            getMediaFile(url, 'jpg', function(err, res){
                                if(err){
                                    return callback(err, null)
                                }
                                msg['MediaId'] = res['wx_media_id'];
                                msg['FsMediaId'] = res['media_id'];
                                msg['MsgType'] = 'image';
                                callback(null, msg);
                            })
                        })
                        .thenCatch(function(e){
                            callback(e, null)
                        })
                }
                if(className === 'voice'){
                    console.info("[flow]: type is voice");
                    return promise.getAttribute('data-cm').then(function(attr){
                        var obj = JSON.parse(attr);
                        getMediaFile(self.baseUrl + 'cgi-bin/mmwebwx-bin/webwxgetvoice?msgid=' + obj.msgId, 'mp3', function(err, res){
                            if(err){
                                return callback(err, null)
                            }
                            msg['MediaId'] = res['wx_media_id'];
                            msg['FsMediaId'] = res['media_id'];
                            msg['MsgType'] = 'voice';
                            callback(null, msg);
                        });
                    })
                        .thenCatch(function(e){
                            callback(e, null)
                        })
                }
            })
            .thenCatch(function(e){
                console.error('[flow]: spider content error');
                console.error(e.stack)
                return callback(e, null);
            });
        function getMediaUrl(src){
            var url = src.split('&type=slave')[0];
            return url;
        }
        function getMediaFile(url, fileType, callback){
            console.info("[flow]: file url is " + url);
            var formData = {
                file: {
                    value: request({url: url, jar: self.j, encoding: null}),
                    options: {
                        filename: 'xxx.' + fileType
                    }
                }
            };
            request.post({url:fsServer, formData: formData}, function(err, res, body) {
                if (err) {
                    return callback(err, null);
                }
                try{
                    var json = JSON.parse(body);
                }catch(e){
                    return callback(e);
                }
                if(json.err){
                    return callback(json.err, null);
                }
                callback(null, json);
            });
        }
    }
}