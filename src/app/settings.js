var settings = require('athena-settings');

var reconnectTime = 12*60*60*1000;

var fsUrl = settings.api.url + '/file/upload';

var wxIndexUrl = 'http://wx.qq.com';

var pollingGap = 1000;

var pollingPrintGap = 10;

var pollingLoginOrNotGap = 3;

module.exports = {
    reconnectTime: reconnectTime,
    fsUrl: fsUrl,
    wxIndexUrl: wxIndexUrl,
    pollingGap: pollingGap,
    pollingPrintGap: pollingPrintGap,
    pollingLoginOrNotGap: pollingLoginOrNotGap
};