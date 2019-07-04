import EventEmiiter from 'eventemitter3';
export default class Framework extends EventEmiiter {
    constructor() {
        super();
        this.once('init', () => {
            this.init();
        });
    }

    init() {
        const clearLog = this.env.get('clearLog', 5);
        if (!_.isNumber(clearLog)) {
            throw new Error('清理日志策略参数需要为数字, 小于0不清除日志');
        }
        if (clearLog >= 0) {
            LogReset(clearLog);
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