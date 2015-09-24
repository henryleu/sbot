var conf = {
    'gif':['image/gif'],
    'jpg':['image/jpeg', 'image/pjpeg'],
    'png':['image/png', 'image/x-png'],
    'mp3':['audio/mpeg', 'audio/mpg', 'audio/mpeg3', 'audio/mp3']
};
module.exports.conf = conf;
module.exports.findSuffix = function(type){
    var result;
    Object.keys(conf).forEach(function(suffix){
        if(conf[suffix].indexOf(type) !== -1){
            result = suffix;
        }
    });
    if(result){
        return result;
    }else{
        throw new Error('the content-type isn,t in the conf set');
    }
};