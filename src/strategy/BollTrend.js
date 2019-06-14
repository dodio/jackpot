/**
 * 布林趋势策略
 */
import BollChecker from '../infomation/BollChecker';

const peroidMap = require('../meta/peroids');
const looptime = 10;

export default class BollTrend {
    constructor() {
        this.init();
    }

    init() {
        const bollchecker = this.bollchecker = new BollChecker(exchange);
        this.bindCheckerEvents();
        bollchecker.start();
    }

    bindCheckerEvents() {
        const bollchecker = this.bollchecker;
        bollchecker.on('BROKE_DOWN', () => {
            console.log('跌破下轨');
        });
        bollchecker.on('update', info => {
            Log(info);
        });
    }

    beforeDestory() {

    }
}