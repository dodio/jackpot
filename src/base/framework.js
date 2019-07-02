import EventEmiiter from 'eventemitter3';
const EventLoop = require('./module/EventLoop');
const Commander = require('./module/Commander');
const Enviroment = require('./module/Enviroment');
const Messager = require('./module/Messager');
let installedRobot = false;

initFrameWork();
export default getFrameWork();

function initFrameWork() {
    const framework = getFrameWork();
    const eventLoop = framework.eventloop = new EventLoop(framework);
    framework.commander = new Commander(framework);
    framework.env = new Enviroment(framework);
    framework.messager = new Messager(framework);

    global.nextTick = eventLoop.nextTick.bind(eventLoop);
    global.setTimeout = eventLoop.setTimeout.bind(eventLoop);
    global.clearTimeout = eventLoop.clearTimeout.bind(eventLoop);
    installRobot(framework, framework.eventloop);
}

function getFrameWork() {
    if (global.framework) {
        return global.framework;
    }
    const framework = global.framework = new Framework();
    return framework;
}

function installRobot(framework, eventloop) {
    if (installedRobot) {
        return;
    }
    const robot = {
        main(robotId) {
            Log('开始机器人进程：', robotId);
            framework.robotId = robotId;
            while (!eventloop.isEnd()) {
                eventloop.polling();
                eventloop.invoke();
            }
            framework.emit('before_exit');
        },
        onexit() {
            Log('进程即将结束，清理扫尾工作');
            framework.emit('exit');
            Log('扫尾结束，进程结束@');
        },
        onerror(err) {
            Log('发生错误', err);
        },
        init() {
            Log('机器人初始化');
            framework.emit('init');
        }
    };
    _.each(robot, (v, key, obj) => {
        if (_.isFunction(v)) {
            obj[key] = v.bind(obj);
        }
    });
    Object.assign(global, robot);
    installedRobot = true;
    return installedRobot;
}

class Framework extends EventEmiiter {
    constructor() {
        super();
        this.once('init', () => {
            this.init();
        });
    }

    init() {
        const clearLog = this.env.get('clearLog', true);
        if (clearLog) {
            LogReset();
        }
        const proxyAddress = this.env.get('proxyAddress', '');
        if (proxyAddress) {
            exchanges.forEach(exchange => {
                Log(`为${exchange.GetName()}交易所设置代理：${proxyAddress}`);
                exchange.SetProxy(proxyAddress);
            });
        }
    }
}