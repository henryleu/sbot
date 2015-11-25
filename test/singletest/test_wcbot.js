var assert = require('assert');
var pubSubService = require('../../src/app/pub-sub.js');

before(function(done){
    setTimeout(function(){
        done()
    }, 3000)
});
describe('wc_bot', function(){
    describe('#start', function(){
        it('success', function(done){
            pubSubService.subClient.subscribe("sbot:login");
            pubSubService.pubClient.publish('sbot:start', JSON.stringify({
                botid: 'qtds'
            }));
            setTimeout(function(){
                done();
            }, 25*1000);
        })
    });
    //describe('#start2', function(){
    //    it('success', function(done){
    //        //pubSubService.subClient.subscribe("sbot:need-login");
    //        pubSubService.pubClient.publish('sbot:start', JSON.stringify({
    //            botid: 'xxm'
    //        }));
    //        setTimeout(function(){
    //            done();
    //        }, 55*1000);
    //    })
    //});
    //describe('#profile', function(){
    //    it('success', function(done){
    //        pubSubService.pubClient.publish('sbot:profile-request', JSON.stringify({
    //            botid: 'qtds',
    //            bid: 'bu-81KXw'
    //        }));
    //        setTimeout(function(){
    //            done();
    //        }, 5000);
    //    })
    //});
    describe('#send', function(){
        after(function(done){
            setTimeout(function(){
                done();
            }, 5000);
        });
        require('../../src/app/init');
        it('success', function(done){
            pubSubService.pubClient.publish('sbot:contact-list-remark-request', JSON.stringify({
                botid: 'qtds'
            }));
            //pubSubService.pubClient.publish('sbot:message-send', JSON.stringify({
            //    MsgType: 'image',
            //    FromUserName: 'qtds',
            //    ToUserName: 'bu-BBtuy',
            //    botid: 'qtds',
            //    Url: '/Users/bjhl/dev/codebase/athena/public/uploads/upload_ffbcc160c4a2f0d1330987a198b6b5a8.jpg'
            //}));
            //pubSubService.pubClient.publish('sbot:contact-list-request', JSON.stringify({
            //    botid: 'qtds'
            //}));
            //pubSubService.pubClient.publish('sbot:message-send', JSON.stringify({
            //    botid: 'qtds',
            //    ToUserName: '交友',
            //    FromUserName: 'qtds',
            //    MsgType: 'text',
            //    Content: '打扰了'
            //}));
            //for(var i = 0, len =20; i<len; i++){
            //    pubSubService.pubClient.publish('sbot:message-send', JSON.stringify({
            //        botid: 'qtds',                  //祺天大圣
            //        FromUserName: 'qtds',
            //        ToUserName: 'bu-FboEC',         //星星妹
            //        MsgType: 'text',
            //        Content: 'hello ' + i
            //    }));
            //    pubSubService.pubClient.publish('sbot:message-send', JSON.stringify({
            //        botid: 'xxm',                   //星星妹
            //        FromUserName: 'xxm',
            //        ToUserName: 'bu-Babaa',   //包三哥
            //        MsgType: 'text',
            //        Content: 'hello '
            //    }));
            //}



            //setTimeout(function(){
            //    done();
            //}, 3000);
        })
    });
    //describe('#stop', function(){
    //    before(function(done){
    //        setTimeout(function(){
    //            done();
    //        }, 3000);
    //    });
    //    after(function(done){
    //        console.log('after-');
    //        pubSubService.pubClient.publish('sbot:start', JSON.stringify({
    //            botid: 'xxx'
    //        }));
    //        setTimeout(function(){
    //            done();
    //        }, 10000)
    //    });
    //    it('success', function(done){
    //        pubSubService.pubClient.publish("sbot:stop", JSON.stringify({
    //            botid: 'xxx'
    //        }));
    //        setTimeout(function(){
    //            done();
    //        }, 5000);
    //    })
    //});
    //describe('#send', function(){
    //    after(function(done){
    //        setTimeout(function(){
    //            done();
    //        }, 5000);
    //    });
    //    it('success', function(done){
    //        pubSubService.pubClient.publish('sbot:message-send', JSON.stringify({
    //            botid: 'xxx',
    //            FromUserName: '',
    //            ToUserName: '85bd4a40-64c8-',
    //            MsgType: 'text',
    //            Content: 'hello world'
    //        }));
    //        setTimeout(function(){
    //            done();
    //        }, 3000);
    //    })
    //});
    //describe('#profile', function(){
    //    it('success', function(done){
    //        pubSubService.pubClient.publish('sbot:profile-request', JSON.stringify({
    //            botid: 'xxx',
    //            bid: '85bd4a40-64c8-'
    //        }));
    //        setTimeout(function(){
    //            done();
    //        }, 5000);
    //    })
    //});
    describe('#delay for others', function(){
        it('success', function(done){

        })
    });
});
