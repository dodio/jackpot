/**
 * 布林趋势策略
 */
import EventEmitter from 'eventemitter3';
import BollChecker from './BollChecker';
import { peroidMap } from '../meta/peroids';
const strgedyArgs =  {
    // 开仓价格变化速度，即超过这个速度才开仓
    'OPEN_TRIGGER_SPEED': 10,
    // 不同阶段开仓比例
    'PERIOD_M1_OPEN': 0.05,
    'PERIOD_M5_OPEN': 0.05,
    'PERIOD_M15_OPEN': 0.15,
    'PERIOD_M30_OPEN': 0.25,
    'PERIOD_H1_OPEN': 0.5,
    'PERIOD_D1_OPEN': 1,

    // 不同阶段K线突破后 平仓比例
    'PERIOD_M1_CLOSE': 0.05,
    'PERIOD_M5_CLOSE': 0.05,
    'PERIOD_M15_CLOSE': 0.15,
    'PERIOD_M30_CLOSE': 0.25,
    'PERIOD_H1_CLOSE': 0.5,
    'PERIOD_D1_CLOSE': 1,
};

export default class BollTrend extends EventEmitter {
    constructor(framework) {
        Log('创建趋势策略');
        this.framework = framework;
        this.framework.once('init', () => {
            this.init();
        });
    }

    init() {
        this.args = _.mapObject(strgedyArgs, (val, key) => {
            return this.framework.env.get(key, val);
        });
        Log('布林策略参数：', this.args);
        const bollchecker = this.bollchecker = new BollChecker(exchange);
        this.bindCheckerEvents();
        bollchecker.start();
    }

    bindCheckerEvents() {
        const bollchecker = this.bollchecker;
        bollchecker.on('diff', (info) => {
            const messager = this.framework.messager;
            const now = Date.now();
            const brokeDelay = 15 * 60 ;
            const autoPushDelay = 30 * 60;

            if(info.brokeDown) {
                const timekey = `_brokeDown_${info.brokeDown.peroid}`;
                messager.send(`跌破布林【${info.brokeDown.priceName}】$${info.brokeDown.price}`, timekey, brokeDelay);
            }
            if(info.brokeUp) {
                const timekey = `_brokeUp_${info.brokeUp.peroid}`;
                messager.send(`突破布林【${info.brokeUp.priceName}】$${info.brokeUp.price}`, timekey, brokeDelay);
            }
            messager.send(`【最近价格限制】
            ${info.trend.siblingPrices.map(p => `${p.priceName}:${p.price}`).join(',')}`, 'auto_push_price', autoPushDelay);
        });
    }
}