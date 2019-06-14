let timeoutId = 0;
class EventLoop {
    constructor() {
        this._timeouts = [];
        this._microtasks = [];
        this._macrotasks = [];
    }

    isEnd() {
        return !this._microtasks.length && !this._macrotasks.length && !this._timeouts.length;
    }

    invoke() {
        const microtasks = this._microtasks;
        const macrotasks = this._macrotasks;
        this._microtasks = [];
        this._macrotasks = [];
        _.each(microtasks.concat(macrotasks), task => {
            task.apply(null);
        })
    }

    polling() {
        const now = parseInt(_D());
        const lefttimeouts = this._timeouts.filter(t => {
            if(t[1] > now) {
                return true;
            }
            this._macrotasks.push(t[2]);
            return false;
        });
        this._timeouts = lefttimeouts;
    }
    
    nextTick(callback) {
        if(typeof callback !== 'function') {
            throw new Error('nextTick callback should be a function.')
        }
        this._microtasks.push(callback);
    }

    setTimeout(callback, delay = 4) {
        if(typeof callback !== 'function') {
            throw new Error('timeout callback should be a function.')
        }
        const timeout = [timeoutId++, parseInt(_D()) + delay, callback];
        this._timeouts.push(timeout);
        return timeout[0];
    }

    clearTimeout(id) {
        const index = this._timeouts.findIndex(t => t[0] === id);
        if(index > -1) {
            this._timeouts.splice(index, 1);
        }
    }
}
const eventLoop =  new EventLoop();
global.nextTick = eventLoop.nextTick.bind(eventLoop);
global.setTimeout = eventLoop.setTimeout.bind(eventLoop);
global.clearTimeout = eventLoop.clearTimeout.bind(eventLoop);

module.exports = eventLoop;
