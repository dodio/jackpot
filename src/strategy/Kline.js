import { peroidsMap } from '../meta/peroids';

const timeTagGetters = {
    [PERIOD_M1]: (date) => {
        return date.getMinutes();
    },
    [PERIOD_M5]: (date) => {
        return Math.floor(date.getMinutes() / 5);
    },
    [PERIOD_M15]: (date) => {
        return Math.floor(date.getMinutes() / 15);
    },
    [PERIOD_M30]: (date) => {
        return Math.floor(date.getMinutes() / 30);
    },
    [PERIOD_H1]: (date) => {
        return date.getHours();
    },
    [PERIOD_D1]: (date) => {
        return date.getDate();
    },
};

export default class Kline {
    constructor(peroid, exchange) {
        this.peroid = peroid;
        this.exchange = exchange;
        this.getTimeTag = timeTagGetters[peroid];
        this.peroidName = peroidsMap[peroid];
        if (!this.getTimeTag) {
            throw new Error(`请添加${this.peroidName}时间分别器`);
        }
        this.bollPeroid = 20;
        this.bollMul = 2;
        Log(`创建${this.peroidName}数据`);
    }

    updateRecords() {
        const nowDate = new Date();
        const thisTag = this.getTimeTag(nowDate);
        if (!this.records || this.updateTag !== thisTag) {
            Log(`更新【${this.peroidName}K线】数据${this.updateTag ? `，tag:${thisTag},${this.updateTag}` : ''}`);
            this.records = _C(this.exchange.GetRecords, this.peroid);
            this.updateTag = thisTag;
        }
    }
    
}