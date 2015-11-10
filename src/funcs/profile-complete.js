var profileHelper = require('./profile-helper');
var findOne = require('./find-one-contract');
var findOneAsync = require('bluebird').promisify(findOne);

module.exports = function(wcbot, nickname, callback){
    var panelEl = null;
    var data = {};
    findOneAsync(wcbot, nickname)
        .then(function(){
            console.log('begin to remark************')
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
            console.error(e);
            if(callback){
                return callback(e);
            }
            throw e;
        });
};