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
            const now = Date.now();
            // 同一种突破类型，15分钟推一条
            const brokeDelay = 15 * 60 * 1e3;
            const autoPushDelay = 30 * 60 * 1e3;

            if(info.brokeDown) {
                const timekey = `_brokeDown_${info.brokeDown.peroid}`;
                if(!this[timekey] || now > this[timekey] + brokeDelay) {
                    message.push(`跌破布林【${info.brokeDown.priceName}】$${info.brokeDown.price}`);
                    this[timekey] = now;
                }
            }
            if(info.brokeUp) {
                const timekey = `_brokeUp_${info.brokeUp.peroid}`;
                if(!this[timekey] || now > this[timekey] + brokeDelay) {
                    message.push(`突破布林【${info.brokeUp.priceName}】$${info.brokeUp.price}`);
                    this[timekey] = now;
                }
            }
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