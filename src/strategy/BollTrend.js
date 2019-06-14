/**
 * 布林趋势策略
 */
import BollChecker from '../infomation/BollChecker';

const peroidMap = require('../meta/peroids');
const looptime = 10;

export default class BollTrend {
    constructor() {
        Log('创建趋势策略');
    }

    init() {
        const bollchecker = this.bollchecker = new BollChecker(exchange);
        this.bindCheckerEvents();
        bollchecker.start();
    }

    bindCheckerEvents() {
        const bollchecker = this.bollchecker;
        bollchecker.on('diff', (info) => {
            const message = [];
            if(info.brokeDown) {
                message.push(`跌破布林【${info.brokeDown.priceName}】$${info.brokeDown.price}`);
            }
            if(info.brokeUp) {
                message.push(`突破布林【${info.brokeDown.priceName}】$${info.brokeUp.price}`);
            }
            const now = Date.now();
            const autoPushDelay = 30 * 60 * 1e3;
            if(message.length || !this._pushtime || (now > this._pushtime + autoPushDelay) ) {
                message.push(`${info.trend.presentPrice.priceName}:${info.trend.presentPrice.price}`);
                message.push(`【最近价格限制】
                ${info.trend.siblingPrices.map(p => `${p.priceName}:${p.price}`).join(',')}
                `);
                this._pushtime = now;
                Log(message.join('\n'), '@');
            }
        });
        bollchecker.on('update', info => {
            Log(info);
        });
    }

    beforeDestory() {
        Log('布林趋势策略正在收尾工作');
    }
}