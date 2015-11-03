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
var wxIndexUrl = 'http://wx.qq.com';
var pollingGap = 1000;
var pollingPrintGap = 10;
var pollingLoginOrNotGap = 3;
module.exports = {
    redis: redis,
    reconnectTime: reconnectTime,
    fsUrl: fsUrl,
    wxIndexUrl: wxIndexUrl,
    pollingGap: pollingGap,
    pollingPrintGap: pollingPrintGap,
    pollingLoginOrNotGap: pollingLoginOrNotGap
};