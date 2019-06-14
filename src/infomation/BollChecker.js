import Kline from '../lib/Kline';
const EventEmitter = require('eventemitter3');
const presentPriceName = '【当前价】';

const PEROIDS = [
    PERIOD_M1,
    PERIOD_M5,
    PERIOD_M15,
    PERIOD_M30,
    PERIOD_H1,
    PERIOD_D1,
];
export default class BollChecker extends EventEmitter {
    constructor(exchange) {
        super();
        this.exchange = exchange;
        this.klines = PEROIDS.map(peroid => {
            return new Kline(peroid, exchange);
        });
    }
    update() {
        this.klines.forEach(kline => {
            kline.updateRecords();
        })
    }

    start(delay = 5e3) {
        this._timer = setTimeout(() => {
            this.check();
            this.start(delay);
        }, delay)
    }
    stop() {
        clearTimeout(this._timer);
    }
    check() {
        this.update();
        // Log('获取新行情');
        const lastTrend = this._lastTrend;
        const exchangeTicker = _C(this.exchange.GetTicker);
        const trend = this._lastTrend = this.__getBollPositionInfo(exchangeTicker);
        if(!lastTrend) {
            this.emit('first_trend', trend);
            return;
        }
        this.__diff(trend, lastTrend);
    }

    __getBollPositionInfo(ticker) {
        // 获取当前所有K线的近期布林数据
        const peroidBollInfo = this.klines.map(kline => {
            const recentBollLines = kline.getRecentBoll(100, ticker);
            return {
                recentBollLines: recentBollLines,
                peroid: kline.peroid,
                peroidName: kline.peroidName,
                presentBoll: recentBollLines.map(line => line[line.length - 1])
            };
        });
        // 计算布林价格排布
        let edgePricePositions = [];
        // 所有价格排布
        let allPricePoistions = [];
        // 完全横盘价格名称分布列表
        let normaEdgelPositionNameList = [presentPriceName];
        peroidBollInfo.forEach(({presentBoll, peroidName, peroid}) => {
            const upName = `${peroidName}上轨`;
            const avgName = `${peroidName}均线`;
            const downName = `${peroidName}下轨`;
            const upPrice = {
                priceName: upName,
                peroidName,
                peroid,
                price: _N(presentBoll[0], 2)
            };
            const avgPrice = {
                peroidName,
                peroid,
                priceName: avgName,
                price: _N(presentBoll[1], 2)
            };
            const downPrice = {
                peroidName,
                peroid,
                priceName: downName,
                price: _N(presentBoll[2], 2)
            };

            normaEdgelPositionNameList.unshift(upName);
            normaEdgelPositionNameList.unshift(downName);

            allPricePoistions.push(upPrice);
            allPricePoistions.push(avgPrice);
            allPricePoistions.push(downPrice);
            edgePricePositions.push(upPrice);
            edgePricePositions.push(downPrice);
        });
        const presentPrice = {
            priceName: presentPriceName,
            price: _N(ticker.Last, 2)
        };

        allPricePoistions.push(presentPrice);
        edgePricePositions.push(presentPrice);

        edgePricePositions = edgePricePositions.sort((a, b) => b.price - a.price );
        allPricePoistions = allPricePoistions.sort((a, b) => b.price - a.price );

        // 当前价格所处位置
        const priceInEdgePosition = _.findIndex(edgePricePositions, p => p.priceName === presentPriceName);
        const priceInAllPoistion = _.findIndex(allPricePoistions, p => p.priceName === presentPriceName);

        // 两端价格
        const siblingPrices = priceInAllPoistion === 0 ? allPricePoistions.slice(0, 2) : allPricePoistions.slice(priceInAllPoistion - 1, priceInAllPoistion + 1);

        const isEdgeFirst = priceInEdgePosition === 0;
        const isEdgeLast = priceInEdgePosition === (edgePricePositions.length -1 );
        
        return {
            peroidBollInfo,
            isEdgeFirst,
            isEdgeLast,
            edgePricePositions,
            allPricePoistions,
            priceInEdgePosition,
            priceInAllPoistion,
            siblingPrices,
            normaEdgelPositionNameList,
            ticker,
            presentPrice
        }
    }

    __diff(trend, lastTrend) {
        const diffInfo = {
            trend,
            lastTrend
        };
        // TODO 两组信息不全一样的问题，非当前价的位置之间可能发生了交换
        if(trend.priceInEdgePosition > lastTrend.priceInEdgePosition) {
            // 跌破某轨
            diffInfo.brokeDown = trend.edgePricePositions[trend.priceInEdgePosition - 1];
        }
        if(trend.priceInEdgePosition < lastTrend.priceInEdgePosition) {
            // 突破某轨
            diffInfo.brokeUp = trend.edgePricePositions[trend.priceInEdgePosition + 1];
        }
        this.emit('diff', diffInfo);
    }
}