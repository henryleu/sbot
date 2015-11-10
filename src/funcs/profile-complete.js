var webdriver = require('selenium-webdriver')
var profileHelper = require('./profile-helper');
var findOne = require('./find-one-contract');
var findOneAsync = require('bluebird').promisify(findOne);
var reset = require('./reset-pointer');
var searchLocator = webdriver.By.className('frm_search');
module.exports = function(wcbot, nickname, callback){
    var panelEl = null;
    var data = {};
    findOneAsync(wcbot, nickname)
        .then(function(){
            return profileHelper.openPanel(wcbot)
        })
        .then(function(){
            return profileHelper.readPlace(panelEl, data, wcbot)
        })
        .then(function(item){
            panelEl = item;
            return profileHelper.readSex(panelEl, data, wcbot)
        })
        .then(function(){
            return profileHelper.remark(panelEl, data, wcbot)
        })
        .then(function(){
            data.botid = wcbot.id;
            return profileHelper.readHeadImg(panelEl, data, wcbot, callback)
        })
        .catch(function(e){
            console.warn(e);
            wcbot.driver.findElement(searchLocator)
                .then(function(input){
                    return input.clear();
                })
                .then(function(){
                    return reset(wcbot, callback, e);
                })
        });
};