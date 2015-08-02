function TaskQueue(concurrency){
    this.queue = [];
    this.busy = false;
    this.concurrency = concurrency;
}
TaskQueue.prototype.enqueue = function(task, callback){
    var callback = callback || function(){};
    var taskWrapper = {
        task: task,
        callback: callback
    }
    this.queue.push(taskWrapper);
    if(!this.busy){
        this.busy = true;
        this.next();
    }
}
TaskQueue.prototype.next = function(){
    var self = this;
    var taskWrapper = this.queue.shift();
    taskWrapper.task(function(){
        if(self.queue.length <= 0){
            self.busy = false
            return taskWrapper.callback();
        };
        taskWrapper.callback();
        self.next();
    });

}
module.exports = new TaskQueue(1);