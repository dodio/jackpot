import './Jack';

const robot = {
    main(robotId) {
        Log('开始机器人进程：', robotId);
        jack.robotId = robotId;
        const eventloop = jack.eventloop;
        jack.emit('main', robotId);
        while (!eventloop.isEnd()) {
            eventloop.polling();
            eventloop.invoke();
        }
    },
    onexit() {
        Log('进程即将结束，清理扫尾工作');
        jack.emit('exit');
        Log('扫尾结束，进程结束@');
    },
    onerror(err) {
        Log('发生错误', err);
    },
    init() {
        Log('机器人初始化');
        jack.emit('init');
    }
};

_.each(robot, (v, key, obj) => {
    if (_.isFunction(v)) {
        obj[key] = v.bind(obj);
    }
});
Object.assign(global, robot);