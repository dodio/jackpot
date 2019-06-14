const eventLoop = require('./eventloop');

var proxyAddress = 'socks5://127.0.0.1:31211';
if(proxyAddress) {
    exchanges.forEach(exchange => {
        exchange.SetProxy(proxyAddress);
    });
}
LogReset();
export default function(Strategy) {
    const robot = {
        main(robotId) {
            Log('开始机器人进程：', robotId);
            this.robotId = robotId;
            while(!eventLoop.isEnd()) {
                eventLoop.polling();
                eventLoop.invoke();
            }
        },
        onexit() {
            Log('进程即将结束，清理扫尾工作');
            this._strategy.beforeDestory();
        },
        onerror(err) {
            Log('发生错误', err);
        },
        init() {
            Log('机器人初始化');
            this._strategy = new Strategy();
        }
    };
    _.each(robot, (v, key, obj) => {
        if(_.isFunction(v)) {
            obj[key] = v.bind(obj)
        }
    });
    Object.assign(global, robot);
}