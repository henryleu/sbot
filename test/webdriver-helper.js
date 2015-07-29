//var webdriver = require('selenium-webdriver');

module.exports = function(webdriver, driver){


var flow = webdriver.promise.controlFlow();
var finish = function (done) {
    driver.quit().then(function () {
        done();
    });
};

var error = function (e) {
    driver.quit().then(function () {
        console.log('\n');
        console.error('ACCEPTANCE TESTS ERROR');
        console.error(e);
    });
};

var name = function (args) {
    return driver.findElement(webdriver.By.name(args));
};
var id = function (args) {
    return driver.findElement(webdriver.By.id(args));
};
var tagName = function (args) {
    return driver.findElement(webdriver.By.tagName(args));
};
var className = function (args) {
    return driver.findElement(webdriver.By.className(args));
};

/**
 * clicks a select option
 *
 * @method selectByValue
 * @param {webdriver.Locator|Object.<string>} locator The locator
 *     strategy to use when searching for the select element.
 * @param {string} value The value of the option to select
 */
var selectByValue = function (locator, value) {
    var selElement = driver.findElement(locator);
    selElement.findElement(webdriver.By.css("option[value='" + value + "']"))
        .click();
};

/**
 * clicks a radio button element
 *
 * @method radioByValue
 * @param {string} name The name of the radio button group
 * @param {string} value The value of the option to select
 */
var radioByValue = function (name, value) {
    var locator = "input[name='" + name + "'][value='" + value + "']";
    driver.findElement(webdriver.By.css(locator))
        .click();
};

/**
 * pauses for a short amount of time, giving the webdriver time
 * to re-render the page, if needed.
 *
 * @method avoidStaleElement
 */
var avoidStaleElement = function () {
    var i = 0;
    driver.wait(function () {
        i++;
        //console.log(i);
        return (i > 3);
    }, 3000);
};

/**
 * Find first element in a group who's text matches that expected.
 *
 * For example:
 *
 *   var findPersonByName = function (nameOfPerson) {
   *     var collectionLocator = {
   *           'css':'div.people > .person'
   *         },
   *         criteriaLocator = {
   *           'className':'name'
   *         };
   *         
   *     return findElementInCollectionByText(
   *         collectionLocator,
   *         criteriaLocator,
   *         nameOfPerson
   *       );
   *   };
 *
 * ...can be called like:
 *
 *   it("can click person",
 *     function (done) {
   *       authenticate().
   *         then(findPersonByName("Jeff Winger")).
   *         then(clickPerson).
   *         then(finish(done), error);
   *     });
 *
 * ...and will match:
 *
 *   <div class="people">
 *     <div class="person">
 *       <p class="name">Jeff Winger</p>
 *       <p class="pic">...</p>
 *     </div>
 *   </div>
 *
 * @method findElementInCollectionByText
 * @param {webdriver.Locator|Object.<string>} collectionLocator The locator
 *     for the group of elements to search
 * @param {webdriver.Locator|Object.<string>} criteriaLocator The locator
 *     for the element who's text should be compared
 * @param {string} text The text to search for.
 * @return {function} A function that, when executed, returns a promise that
 *     will be resolved with the matching element.
 */
var findElementInCollectionByText = function (collectionLocator, criteriaLocator, text) {
    return function () {
        var mainDefer = webdriver.promise.defer();

        driver.findElements(collectionLocator).
            then (function (collection) {

            var matchDefer = webdriver.promise.defer(),
                matchPromise = matchDefer.promise,
                resolved;

            //console.log('found elements');
            collection.map(function (item) {
                item.findElement(criteriaLocator).
                    then (function (elem) {
                    flow.execute(function () {
                        elem.getText().
                            then (function (value) {
                            //console.log('comparing ' + value);
                            console.log(value);
                            if (value === text) {
                                resolved = true;
                                matchDefer.resolve(item);
                            }
                        });
                    });
                });
            });

            flow.execute(function () {
                matchPromise.then(function (item) {
                    //console.log('mainDefer.resolve');
                    mainDefer.resolve(item);
                });
                //console.log('resolved ');
                //expect(resolved).toBe(true);
            });

        });  // end findElements.then
        return mainDefer.promise;
    };
};

    return {
        finish: finish,
        error: error,
        name: name,
        id: id,
        tagName: tagName,
        className: className,
        selectByValue: selectByValue,
        radioByValue: radioByValue,
        avoidStaleElement: avoidStaleElement,
        findElementInCollectionByText: findElementInCollectionByText
    };

};
