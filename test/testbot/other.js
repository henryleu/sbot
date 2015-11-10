var webdriver= require('selenium-webdriver');
var promise = new webdriver.promise.fulfilled();
console.log(promise instanceof webdriver.promise.Promise);