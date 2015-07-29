//var Reader = require('qrcode-reader');
//var reader = new Reader();
//var qrUrl = 'http://pic.58pic.com/58pic/11/37/78/71758PICVNk.jpg';
//
//reader.callback = function(result){
//    console.log(result);
//};
//
//reader.decode(qrUrl);


var options = {
    ZXingLocation: "/path",
    try_harder: false,
    multi: false
};
var qrdecoder = require('./node-zxing')(options);
var path = "./a.jpg";
qrdecoder.decode(path,
    function(err, out) {
        console.log(err,out);
    }
);