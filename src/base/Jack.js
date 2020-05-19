import EventEmiiter from 'eventemitter3';
import EventLoop from './module/EventLoop';
import Commander from './module/Commander';
import Enviroment from './module/Enviroment';
import Messager from './module/Messager';
class Jack extends EventEmiiter {
    constructor() {
        super();
        const eventLoop = this.eventloop = new EventLoop();
        this.commander = new Commander();
        this.env = new Enviroment();
        this.messager = new Messager();
        global.nextTick = eventLoop.nextTick.bind(eventLoop);
        global.setTimeout = eventLoop.setTimeout.bind(eventLoop);
        global.clearTimeout = eventLoop.clearTimeout.bind(eventLoop);
    }
}

getJack();

function getJack() {
    if (global.jack) {
        return global.jack;
    }
    const jack = global.jack = new Jack();
    jack.once('init', onProcessInit);
}

function onProcessInit() {
    const clearLog = jack.env.get('clearLog', 5);
    if (!_.isNumber(clearLog)) {
        throw new Error('清理日志策略参数需要为数字, 小于0不清除日志');
    }
    if (clearLog >= 0) {
        LogReset(clearLog);
    }
    const proxyAddress = jack.env.get('proxyAddress', '');
    if (proxyAddress) {
        exchanges.forEach(exchange => {
            Log(`为${exchange.GetName()}交易所设置代理：${proxyAddress}`);
            exchange.SetProxy(proxyAddress);
        });
    }
    jack.messager.startAutoFlush();
}