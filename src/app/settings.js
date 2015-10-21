var redis = {
    mode:'single',
        host: '127.0.0.1',
    port: 6379,
    auth:'',
    sentinel: {
        hosts: [{host: '127.0.0.1', port: 26379}],
        masterName: 'mymaster'
    }
};
var reconnectTime = 12*60*60*1000;
var fsUrl = 'http://ci.www.wenode.org/api/file/upload'
module.exports = {
    redis: redis,
    reconnectTime: reconnectTime,
    fsUrl: fsUrl
};