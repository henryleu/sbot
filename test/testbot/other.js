var webdriver= require('selenium-webdriver');
var Promise = require('bluebird');
var co = require('co');
var test1 = require('./test');
var driver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome().setEnableNativeEvents(true))
    .build();
    var result = null;
    driver.get('http://www.baidu.com');
    var input = driver.findElement({css: '#kw'});
    input.sendKeys("ok");
    driver.call(function(){
        console.log("123");
    });
    driver.sleep(3000);
    driver.quit();


//function thunkify(fn){
//    var originFn = fn;
//    return function(){
//        var options = [].slice.apply(arguments);
//        return function(callback){
//            originFn.apply(null, options.concat([callback]));
//        }
//    }
//}
//function thunkifyAll(source){
//    for(var prop in source){
//        if(typeof source[prop] === 'function'){
//            source[prop + 'Thunk'] = function(){
//                var args = [].slice.apply(arguments);
//                return thunkify(source[prop]).apply(null, args);
//            }
//        }
//    }
//    return source;
//}
//function promisifyAll(obj){
//    var source = obj;
//    for(var prop in source){
//        if(typeof source[prop] === 'function'){
//            source[prop + 'Async'] = function(){
//                var args = [].slice.apply(arguments);
//                return promisify(source[prop]).apply(null, args);
//            }
//        }
//    }
//    return source;
//}
//function promisify(method){
//    return function(){
//        var args = [].slice.apply(arguments);
//        return new Promise(function(resolve, reject){
//            var callback = function(){
//                var cbArgs = [].slice.apply(arguments);
//                var err = cbArgs.splice(0, 1)[0];
//                if(err){
//                    reject(err);
//                }else{
//                    if(cbArgs.length > 0){
//                        var argsStr = '';
//                        cbArgs.forEach(function(item){
//                            argsStr += item + ','
//                        });
//                        var resultArgs = argsStr.substr(0, argsStr.length-1);
//                        eval(resolve(resultArgs));
//                    }
//                    else{
//                        resolve(null);
//                    }
//                }
//            };
//            method.apply(null, args.concat([callback]));
//        })
//    }
//}


