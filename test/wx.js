
var page = require('webpage').create(),
    //url = 'https://www.baidu.com';
url = 'https://wx.qq.com';

var ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36';

var getUserHome = function () {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};
page.settings.userAgent = ua;

page.onPageCreated = function(newPage) {
    console.log('A new child page was created! Its requested URL is not yet available, though.');
    newPage.onClosing = function(closingPage) {
        console.log('A child page is closing: ' + closingPage.url);
    };
};

page.onUrlChanged = function(targetUrl) {
    console.log('New URL: ' + targetUrl);
};

page.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};

page.onLoadFinished = function(status) {
    console.log('Status: ' + status);
    // Do other things here...
};

page.open(url, function (status) {
    console.log(status);
    if (status !== 'success') {
        console.log('Unable to access network');
    } else {
        try{

        //var wxQr = __dirname + '/qr.png';
        var wxQr = '/Users/henryleu/Documents/wx/qr.png';
        //var wxQr = getUserHome() + '/Documents/wx/qr.png';
        console.log(wxQr);
        page.render(wxQr);
        //var results = page.evaluate(function() {
        //    var list = document.querySelectorAll('address'), pizza = [], i;
        //    for (i = 0; i < list.length; i++) {
        //        pizza.push(list[i].innerText);
        //    }
        //    return pizza;
        //});
        console.log('web weixin qr image is generated');
        }
        catch(e){
            console.error(e);
        }
    }
    //phantom.exit();
});



