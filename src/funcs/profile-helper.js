var webdriver = require('selenium-webdriver');
var request = require('request');
var _ = require('underscore');
var url = require('url');
var qs = require('querystring');
var reset = require('./reset-pointer');
var settings = require('../app/settings');
var fsServer = settings.fsUrl;
var codeService = require('../services/codeService');

module.exports = {
    openPanel: function(self){
        var box = null;
        self.driver.sleep(500);
        return self.driver.findElement({'css': '#chatArea>.box_hd'})
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
                        return self.driver.sleep(500)
                            .then(function(){
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
    },
    remark: function(promise, data, self){
        return self.driver.findElement({'css': 'div.meta_area p[contenteditable]'})
            .then(function(itemp) {
                return self.driver.sleep(200)
                    .then(function () {
                        return itemp.click()
                            .then(function () {
                                return self.driver.executeScript('window.document.querySelector("div.meta_area p[contenteditable]").innerText = "";')
                            })
                            .then(function () {
                                var code = codeService.fetch();
                                data.bid = code;
                                return itemp.sendKeys(code)
                            })
                            .then(function () {
                                return self.driver.sleep(500)
                            })
                            .then(function () {
                                return self.driver.executeScript('window.document.querySelector("div.meta_area p[contenteditable]").blur();')
                            })
                            .then(function () {
                                return self.driver.findElement({css: '#mmpop_profile .avatar .img'})
                                    .then(function (img) {
                                        return img.click();
                                    })
                            })
                            .then(function () {
                                console.log("[flow]:modify remark ok");
                                return self.driver.sleep(1000)
                            })
                    })
            })
    },
    readPlace: function(promise, data, self){
        var item = null;
        return self.driver.findElement({'css': 'div#mmpop_profile>div.profile_mini'})
            .then(function(popItem) {
                item = popItem;
                return self.driver.findElement({'css': 'div#mmpop_profile>div.profile_mini div.profile_mini_bd>div.meta_area>div.meta_item:nth-child(2) p'})
            })
            .then(function(placeItem){
                return placeItem.getText()
            })
            .then(function(placetxt){
                console.info('[flow]: place is ' + placetxt);
                data.place = placetxt;
                data.botid = self.id;
                return item;
            })
            .thenCatch(function(){
                data.place = "";
                return item;
            })
    },
    readSex: function (promise, data, self){
        return promise.findElement({'css': 'div.profile_mini_bd>div.nickname_area i[ng-if]'})
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
                data.sex = 0;
            })
    },
    readNickName: function (promise, data, self){
        return promise.findElement({'css': 'div.profile_mini_bd>div.nickname_area h4'})
            .then(function(h4){
                h4.getText()
                    .then(function(txt){
                        console.info('[flow]: nickname is ' + txt);
                        return data.nickname = txt;
                    })
            })
            .thenCatch(function(){
                data.nickname = "";
            })
    },
    readRemark: function (promise, data, self){
        return promise.findElement({'css': 'div.profile_mini_bd>div.meta_area>div.meta_item:nth-child(1) p'})
            .then(function(bidItem){
                return bidItem.getText()
            })
            .then(function(bidtxt){
                return data.bid = bidtxt;
            })
    },
    readHeadImg: function (promise, data, self, callback){
        return promise.findElement({'css': 'div.profile_mini_hd img'})
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
                        console.info("[flow]: Succeed to upload head img, body  length  "+body.length)
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
    }
};