const eventLoop = require('./eventloop');

let proxyAddress = 'socks5://127.0.0.1:31211';

export default function(Strategy) {
    LogReset();
    if(proxyAddress) {
        Log('交易所信息:', exchanges.length);
        exchanges.forEach(exchange => {
            Log(`为${exchange.GetName()}交易所设置代理：${proxyAddress}`);
            exchange.SetProxy(proxyAddress);
        });
    }
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
            Log('扫尾结束，进程结束@');
        },
        onerror(err) {
            Log('发生错误', err);
        },
        init() {
            Log('机器人初始化');
            this._strategy = new Strategy();
            nextTick(() => {
                this._strategy.init();
            });
        }
    };
    _.each(robot, (v, key, obj) => {
        if(_.isFunction(v)) {
            obj[key] = v.bind(obj)
        }
    });
    Object.assign(global, robot);
}