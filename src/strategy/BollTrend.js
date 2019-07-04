/**
 * 布林趋势策略
 */
import EventEmitter from 'eventemitter3';
import BollChecker from './BollChecker';
import HuoBiDmAccount from './HuoBiDmAccount';
import { peroidKeys } from '../meta/peroids';

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

    // 不同阶段K线突破后 平仓比例，暂时并没有使用，平仓时都是全平了
    'PERIOD_M1_CLOSE': 0.05,
    'PERIOD_M5_CLOSE': 0.05,
    'PERIOD_M15_CLOSE': 0.15,
    'PERIOD_M30_CLOSE': 0.25,
    'PERIOD_H1_CLOSE': 0.5,
    'PERIOD_D1_CLOSE': 1,
};

export default class BollTrend extends EventEmitter {
    constructor() {
        super();
        Log('创建趋势策略');
        framework.once('init', () => {
            this.init();
        });
    }

    init() {
        const args = _.mapObject(strgedyArgs, (val, key) => {
            return framework.env.get(key, val);
        });
        Log('布林策略参数：', args);
        const bollchecker = this.bollchecker = new BollChecker(exchange);
        this.heyueAccount = new HuoBiDmAccount(exchange);
        this.bindCheckerEvents();
        bollchecker.start();
    }

    bindCheckerEvents() {
        const bollchecker = this.bollchecker;
        bollchecker.on('diff', (info) => {
            const messager = framework.messager;
            const brokeDelay = 15 * 60;
            const autoPushDelay = 30 * 60;
            const openSpeed = framework.env.get('OPEN_TRIGGER_SPEED');
            const tickerSpeed = Math.ceil(info.trend.ticker.Last - info.lastRend.ticker.Last);

            if (info.brokeDown) {
                const timekey = `_brokeDown_${info.brokeDown.peroid}`;
                messager.send(`跌破布林【${info.brokeDown.priceName}】$${info.brokeDown.price}`, timekey, brokeDelay);

                const openPosition = getOpenPosition(info.brokeDown.peroid);
                if (info.brokeDown.priceName.indexOf('上轨') > -1) {
                    this.heyueAccount.setStatus({
                        name: 'close_long',
                        position: 1 // 这个值无所谓，都是全平
                    });
                    messager.send('设置平多');
                } else if (tickerSpeed >= openSpeed) {
                    this.heyueAccount.setStatus({
                        name: 'open_short',
                        position: openPosition,
                    });
                    messager.send(`设置开空,仓位：${openPosition}`);
                }
            }
            if (info.brokeUp) {
                const timekey = `_brokeUp_${info.brokeUp.peroid}`;
                messager.send(`突破布林【${info.brokeUp.priceName}】$${info.brokeUp.price}`, timekey, brokeDelay);

                const openPosition = getOpenPosition(info.brokeDown.peroid);
                if (info.brokeDown.priceName.indexOf('下轨') > -1) {
                    this.heyueAccount.setStatus({
                        name: 'close_short',
                        position: openPosition, // 这个值无所谓，都是全平
                    });
                    messager.send('设置平空');
                } else if (tickerSpeed > openSpeed) {
                    this.heyueAccount.setStatus({
                        name: 'open_long',
                        position: openPosition, // 这个值无所谓，都是全平
                    });
                    messager.send(`设置开多,仓位：${openPosition}`);
                }
            }
            messager.send(`【最近价格限制】
            ${info.trend.siblingPrices.map(p => `${p.priceName}:${p.price}`).join(',')}`, 'auto_push_price', autoPushDelay);

        });
    }
}

function getOpenPosition(peroid) {
    const argName = peroidKeys[peroid] + '_OPEN';
    return framework.env.get(argName);
}