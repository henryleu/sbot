var Promise = require('bluebird');
var Service = {};
var uuidGen = require('node-uuid');
Service.fetch = function(){
    return uuidGen.v1();
};
Service = Promise.promisifyAll(Service);
module.exports = Service;