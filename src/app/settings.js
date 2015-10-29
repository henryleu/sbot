var redis = {
    mode:'single',
        host: '123.56.89.114',
    port: 6379,
    auth:'trillers',
    sentinel: {
        hosts: [{host: '127.0.0.1', port: 26379}],
        masterName: 'mymaster'
    }
};
var reconnectTime = 12*60*60*1000;
var fsUrl = 'http://ci.www.wenode.org/api/file/upload';
var wxIndexUrl = 'http://wx.qq.com/?lang=zh_CN';
module.exports = {
    redis: redis,
    reconnectTime: reconnectTime,
    fsUrl: fsUrl,
    wxIndexUrl: wxIndexUrl
};