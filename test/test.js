

var webPage = require('webpage');
var page = webPage.create();

var fs = require('fs'); 
 
page.open('https://wx.qq.com', function (status) {
  // console.log('Stripped down page text:\n' + page.content);
  var title = page.evaluate(function() {
      return document.getElementById("loginQrCode").getAttribute("src");
  });
  
  console.log(title);

  try {
       fs.write("a.html", page.content, 'w');
   } catch(e) {
       console.log(e);
   }
  
  
  // phantom.exit();
});


function get_left_panel(){
    var t = page.evaluate(function() {
        return document.getElementById("chat_leftpanel").innerHTML;
    });
  
    console.log("ã€get_left_panelã€‘ LOG:" + t);
    
    setTimeout(function(){
        console.log('111')
        get_left_panel();
    },3000);
}


setTimeout(function(){
    console.log('111')
    get_left_panel();
},1000);

page.onPageCreated = function(newPage) {
  console.log('A new child page was created! Its requested URL is not yet available, though.');
  // Decorate
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


page.onError = function(msg, trace) {

  var msgStack = ['ERROR: ' + msg];

  if (trace &amp;&amp; trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -&gt; ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
    });
  }

  console.error(msgStack.join('\n'));

};


page.onResourceReceived = function(response) {

    try {
         fs.write("a.html", page.content, 'w');
     } catch(e) {
         console.log(e);
     }
  
     console.log('Response (#' + response.id + ', stage "' + response.stage + '"): ' + JSON.stringify(response));
};



page.onResourceError = function(resourceError) {
  console.log('Unable to load resource (#' + resourceError.id + 'URL:' + resourceError.url + ')');
  console.log('Error code: ' + resourceError.errorCode + '. Description: ' + resourceError.errorString);
};

page.onResourceTimeout = function(request) {
    console.log('Response (#' + request.id + '): ' + JSON.stringify(request));
};

