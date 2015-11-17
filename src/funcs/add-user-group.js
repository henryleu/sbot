var findOne = require('./find-one-contact');
var findOneAsync = require('bluebird').promisify(findOne);
module.exports = function(wcbot, group, callback){
    var driver = wcbot.driver;
    driver.call(findOneAsync, null, wcbot, group).thenCatch(function(err){callback(err)});

};