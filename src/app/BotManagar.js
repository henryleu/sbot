var Bots = (function(){
    var botsContainer = {};
    function Bots(){}
    Bots.prototype.getBotById = function(id){
        return botsContainer[id];
    };
    Bots.prototype.setBot = function(bot){
        botsContainer[bot.id] = bot;
    };
    Bots.prototype.removeBot = function(id){
        delete botsContainer[id];
    };
    Bots.prototype.getBots = function(){
        return botsContainer;
    };
    return Bots;
}());
module.exports = new Bots();