var botsContainer = {};

function BotManagar(){}

BotManagar.prototype.getBotById = function(id){
    return botsContainer[id];
};

BotManagar.prototype.setBot = function(bot){
    botsContainer[bot.id] = bot;
};

BotManagar.prototype.removeBot = function(id){
    delete botsContainer[id];
};

BotManagar.prototype.getBots = function(){
    return botsContainer;
};

module.exports = new BotManagar();