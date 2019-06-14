const peroidMap = require('../meta/peroids');

const timeTagGetters = {
    [PERIOD_M1]: (date) => {
        return date.getMinutes();
    },
    [PERIOD_M5]:  (date) => {
        return Math.floor(date.getMinutes()/ 12);
    },
    [PERIOD_M15]:  (date) => {
        return Math.floor(date.getMinutes()/ 4);
    },
    [PERIOD_M30]:  (date) => {
        return Math.floor(date.getMinutes()/ 2);
    },
    [PERIOD_H1]: (date) => {
        return date.getHours();
    },
    [PERIOD_D1]: (date) => {
        return date.getDate();
    },
}

export default class Kline {
    constructor(peroid, exchange) {
        this.peroid = peroid;
        this.exchange = exchange;
        this.getTimeTag = timeTagGetters[peroid];
        this.peroidName = peroidMap[peroidMap];
        if(!this.getTimeTag) {
            throw new Error(`添加${peroidName}时间分别器`);
        }
        this.bollPeroid = 20;
        this.bollMul = 2;
        Log(`创建${this.peroidName}数据`);
    }

    updateRecords() {
        const nowDate = new Date();
        const thisTag= this.getTimeTag(nowDate);
        if(!this.records || this.updateTag !== thisTag) {
            Log(`更新${this.peroidName}数据`);
            this.records = _C(this.exchange.GetRecords, this.peroid);
            this.countBoll();
            this.updateTag = thisTag;
        }
    }
    
    countBoll() {
       this.bollLines = TA.BOLL(this.records, this.bollPeroid, this.bollMul);
    }

    getRecentBoll(amount = 100, newPrice) {
        // 提供新行情数据则更新K线当前数据情况，并获取新的boll数据情况
        if(newPrice) {
            const lastRecord = this.records[this.records.length - 1];
            lastRecord.High = newPrice.High;
            lastRecord.Low = newPrice.Low;
            lastRecord.close = newPrice.Last;
            const newBollRecords = this.records.slice(this.records.length - this.bollPeroid, this.records.length);
            const lastBoll = TA.BOLL(newBollRecords, this.bollPeroid, this.bollMul).map(line => line.pop());
            this.bollLines.forEach((line, index) => {
                line[line.length-1]  = lastBoll[index];
            });
        }
        const bollLines = this.bollLines.map(line => {
            return line.slice(line.length - amount, line.length);
        });
        return bollLines;
    }
}