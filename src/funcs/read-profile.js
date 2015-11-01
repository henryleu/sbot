var webdriver = require('selenium-webdriver');
//external services
var reset = require('./reset-pointer');
var _findOnePro = require('../funcs/find-one-contract');

module.exports = _readProfile;

function _readProfile(bid, self, callback){
    var box;
    _findOnePro(self, bid, function(e){
        if(e){
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
                                return self.driver.sleep(2000);
                            })
                    })
                    .thenCatch(function(err){
                        console.log("err --------"+err);
                        console.log(err.stack);
                    })
            })
            .then(function(){
                _readProfileChain(self, function(err, data){
                    if(err){
                        console.error('Failed to read Profile Chain');
                        return callback(err);
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
            return pop.findElement({'css': 'div.profile_mini_bd>div.meta_area>div.meta_item:nth-child(2) p'})
                .then(function(placeItem){
                    return placeItem.getText()
                })
                .then(function(placetxt){
                    data.place = placetxt;
                    data.botid = self.id;
                    return;
                })
        })
        .then(function(){
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
                    request.get({url: formatUrl, jar: j, encoding: null}, function(err, res, body){
                        console.log("body------" + body);
                        if(body && body.length){
                            console.log(body.length)
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