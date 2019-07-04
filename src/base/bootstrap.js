import Framework from './Framework';
import EventLoop from './module/EventLoop';
import Commander from './module/Commander';
import Enviroment from './module/Enviroment';
import Messager from './module/Messager';

let installedRobot = false;

initFrameWork();

function initFrameWork() {
    const framework = getFrameWork();
    const eventLoop = framework.eventloop = new EventLoop();
    framework.commander = new Commander();
    framework.env = new Enviroment();
    framework.messager = new Messager();

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
