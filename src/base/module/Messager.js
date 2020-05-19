/**
 * 微信消息发送
 * 处理时间间隔，以及统一推送消息
 */

export default class Messager {
    constructor() {
        this._sendedTime = {};
        this.messages = [];
    }
    startAutoFlush() {
        this._auto = true;
        this.autoFlush();
    }
    stopAutoFlush() {
        this._auto = false;
    }
    autoFlush() {
        if (!this._auto) {
            return;
        }
        this.flush();
        nextTick(() => {
            this.autoFlush();
        });
    }

    /**
     * 将消息放到暂存区
     * @param {Array|String} msg 消息
     * @param {String} key 消息的时间记录key
     * @param {Integer} interval 发送间隔时间，秒
     */
    send(msg, key, interval) {
        if (_.isArray(msg)) {
            msg = msg.join('');
        }
        interval = (parseInt(interval, 10) || 0) * 1e3;
        if (interval && key) {
            const now = Date.now();
            // 间隔时间未到不发送
            if (this._sendedTime[key] && ((this._sendedTime[key] + interval) > now)) {
                return false;
            }
            this._sendedTime[key] = now;
        }
        this.messages.push(msg);
    }
    /**
     * 推出消息，将多条消息合成一条发送
     */
    flush() {
        if (!this.messages.length) {
            return;
        }
        const msg = this.messages.join('\n') + '@';
        Log(msg);
        this.messages = [];
    }
}