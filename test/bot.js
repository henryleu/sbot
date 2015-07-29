var phantom = require('phantom');
var options = {
    port: 16000,
    hostname: "127.0.0.1"
}
phantom.create(function (ph) {
    ph.createPage(function (page) {
        var ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36';
        page.set('settings.userAgent', ua);

        page.open("https://github.com", function (status) {
            console.log("opened google? ", status);
            page.evaluate(function () {
                //phantomjs
                window._phantom = null;
                window.callPhantom = null;

                //PhantomJS-based web perf metrics + monitoring tool
                window.__phantomas = null;
                window.Buffer = null; //nodejs
                window.emit = null; //couchjs
                window.spawn = null; //rhino
                return 'clear phantom reference';
            }, function (result) {
                console.log(result);
            });

            page.evaluate(function () { return document.title; }, function (result) {
                console.log('Page title is ' + result);
            });

            page.evaluate(function() {
                    return document.getElementById("loginQrCode").getAttribute("src");
                },
                function(result){
                    console.log('Login QrCode url is ' + result);
                }
            );

            setInterval(function(){
                page.evaluate(function() {
                        return document.documentElement.innerHTML;
                    },
                    function(result){
                        console.log('\r\n\r\n');
                        console.log(result);
                    }
                );
            }, 1000);

            //setInterval(function(){
            //    page.render(wxQr, function(){
            //        console.log('page image is rendered.');
            //        //ph.exit();
            //    });
            //}, 1000);

            //var wxQr = '/Users/henryleu/Documents/wx/qr.png';
            ////var wxQr = getUserHome() + '/Documents/wx/qr.png';
            //console.log(wxQr);
            //setTimeout(function(){
            //    page.render(wxQr, function(){
            //        console.log('page image is rendered.');
            //        //ph.exit();
            //    });
            //}, 2000);
        });
    });
},
    options);



