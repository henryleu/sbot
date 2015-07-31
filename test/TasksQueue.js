function TaskQueue(concurrency){
    this.queue = [];
    this.busy = false;
    this.concurrency = concurrency;
}
TaskQueue.prototype.enqueue = function(task, callback){
    var callback = callback || function(){};
    this.queue.push(task);
    if(!this.busy){
        this.busy = true;
        this.next(callback);
    }
}
TaskQueue.prototype.next = function(callback){
    var self = this;
    var task = this.queue.shift();
    task(function(){
        if(!self.queue.length){
            self.busy = false
            return callback();
        };
        self.next(callback);
    });

}
module.exports = new TaskQueue(1);