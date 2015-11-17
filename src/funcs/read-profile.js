var webdriver = require('selenium-webdriver');
var PromiseBB = require('bluebird')
//external services
var reset = require('./reset-pointer');
var _findOnePro = require('../funcs/find-one-contact');
var settings = require('../app/settings');
var fsServer = settings.fsUrl;
var _ = require('underscore');
var qs = require('querystring');
var url = require('url');
var request = require('request');

function readProfile(bid, self, callback){
    console.info("[transaction]: begin to read profile of contact that bid is " + bid);
    var box;
    _findOnePro(self, bid, function(e){
        if(e){
            console.error("[flow]: Failed to find the contact that bid is " + bid);
            return callback(e);
        }
        self.driver.sleep(500);
        self.driver.findElement({'css': '#chatArea>.box_hd'})
            .then(function(boxItem){
                box = boxItem;
                return box.findElement({'css': 'div.title_wrap>div.title.poi'})
                    .then(function(clickbtn1){
                        return clickbtn1.click()
                    })
                    .thenCatch(function(e){
                        console.error('[flow]: Failed to click #chatArea>.box_hd');
                        console.error(e);
                        throw e;
                    })
            })
            .then(function(){
                return self.driver.wait(webdriver.until.elementLocated(webdriver.By.css('#chatRoomMembersWrap div.member:nth-child(2)>img')), 5000)
                    .then(function(){
                        return box.findElement({'css': '#chatRoomMembersWrap div.member:nth-child(2)>img'})
                    })
                    .then(function(clickbtn2){
                        return self.driver.sleep(500).then(function(){
                            return clickbtn2.click()
                        })
                            .then(function(){
                                console.info('[flow]: the profile panel is opened');
                                return self.driver.sleep(2000);
                            })
                    })
                    .thenCatch(function(e){
                        console.log("err --------");
                        console.log(e.stack);
                        throw e;
                    })
            })
            .then(function(){
                readProfileChain(self, function(err, data){
                    if(err){
                        console.error('[flow]: Failed to read profile');
                        console.error(err);
                        return callback(err);
                    }
                    console.info('[flow]: Succeed to read profile');
                    console.info(data);
                    return callback(null, data);
                })
            })
            .thenCatch(function(err){
                console.error('[flow]: Failed to read profile');
                console.error(err);
                return callback(err);
            })
    });
}

function readProfileChain(self, callback){
    var data = {},
        pop;
    self.driver.findElement({'css': 'div#mmpop_profile>div.profile_mini'})
        .then(function(popItem){
            pop = popItem;
            return pop.findElement({'css': 'div.profile_mini_bd>div.meta_area>div.meta_item:nth-child(2) p'})
                .then(function(placeItem){
                    return placeItem.getText()
                })
                .then(function(placetxt){
                    console.info('[flow]: place is ' + placetxt);
                    data.place = placetxt;
                    data.botid = self.id;
                    return;
                })
                .thenCatch(function(){
                    console.warn('[flow]: place is not been seted');
                    data.place = "";
                })
        })
        .then(function(){
            return pop.findElement({'css': 'div.profile_mini_bd>div.nickname_area i[ng-if]'})
                .then(function(sexNode){
                    return sexNode.getAttribute('class')
                        .then(function(txt){
                            var tmpSex = txt.split(' ')[1];
                            if(tmpSex === 'web_wechat_men'){
                                data.sex = 1;
                            }
                            else if(tmpSex === 'web_wechat_women'){
                                data.sex = 2;
                            }
                            else{
                                data.sex = 0;
                            }
                            console.info('[flow]: sex is ' + data.sex);
                        })
                })
                .thenCatch(function(){
                    console.warn('[flow]: sex is not been seted');
                    data.sex = 0;
                })
        })
        .then(function(){
            return pop.findElement({'css': 'div.profile_mini_bd>div.nickname_area h4'})
                .then(function(h4){
                    h4.getText()
                        .then(function(txt){
                            console.info('[flow]: nickname is ' + txt);
                            return data.nickname = txt;
                        })
                })
                .thenCatch(function(){
                    console.warn('[flow]: nickname is not been seted');
                    data.nickname = "";
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
            return pop.findElement({'css': 'div.profile_mini_hd img'})
                .then(function(headImg){
                    return headImg.getAttribute('src')
                })
                .then(function(src){
                    var urlJson = _.pick(url.parse(src), 'protocol', 'slashes', 'host', 'hostname', 'pathname');
                    var qsJson = qs.parse(url.parse(src).query);
                    delete qsJson["skey"];
                    delete qsJson["type"];
                    urlJson.search = qs.stringify(qsJson);
                    var formatUrl = url.format(urlJson);
                    request.get({url: formatUrl, jar: self.j, encoding: null}, function(err, res, body){
                        if(body && body.length){
                            console.log("body  length  "+body.length)
                        }
                        var formData = {file: {value: body, options: {filename: 'xxx.jpg'}}};
                        request.post({url:fsServer, formData: formData}, function(err, res, body) {
                            if (err) {
                                return callback(err, null);
                            }
                            try{
                                var json = JSON.parse(body);
                            }catch(e){
                                return callback(e, data);
                            }
                            console.info('[flow]: Succeed to upload the headImg');
                            data.headimgid = json['media_id'] || "";
                            reset(self, function(){
                                return callback(json.err, data);
                            });
                        });
                    })

                })
        })
        .thenCatch(function(err){
            reset(self, function(){
                return callback(err);
            });
        })
}

exports.readProfile = readProfile;