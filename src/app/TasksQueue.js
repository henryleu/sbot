function TaskQueue(concurrency){
    this.queue = [];
    this.busy = false;
    this.concurrency = concurrency;
}
/**
 * allow a task enqueue, when the task perform completely, the callback that is provided
 * invoked, then dequeue a next task util the queue is empty
 * @param task      receive a task(function) to be executed
 * @param options   options contain a args and a context, both of them are optional
 * if they are provided, they should correspond with the input of task function
 * @param callback  task,s callback, follow Node.js style
 */
TaskQueue.prototype.enqueue = function(task, options, callback){
    var callback = callback || function(){};
    var taskWrapper = {
        task: task,
        callback: callback,
        args: options && options.args || null,
        context: options && options.context
    };
    options && options.priority && this.queue.unshift(taskWrapper) || this.queue.push(taskWrapper);
    if(!this.busy){
        this.busy = true;
        this.next();
    }
};
TaskQueue.prototype.next = function(){
    var self = this;
    var taskWrapper = this.queue.shift();
    var nextArgs = [];
    var taskCallback = function(err, data){
        if(self.queue.length <= 0){
            self.busy = false;
            return taskWrapper.callback(err, data);
        }
        taskWrapper.callback(err, data);
        self.next();
    };
    nextArgs.push(taskCallback);
    if(taskWrapper.args){
        nextArgs = taskWrapper.args.concat(nextArgs);
        return taskWrapper.task.apply(taskWrapper.context, nextArgs);
    }
    taskWrapper.task(taskCallback);
};
module.exports = TaskQueue;