import Kline from './Kline';
import { contractTypes } from '../meta/peroids';

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
        const exchangeName = exchange.GetName();
        const currency = exchange.GetCurrency();
        Log('创建布林行情监测，对应:', exchangeName, '交易的：', currency);
        if (exchangeName === 'Futures_HuobiDM') {
            const type = jack.env.get('DM_TYPE', contractTypes.next_week);
            Log('合约类型为：', type);
            exchange.SetContractType(type);
            const marginLevel = jack.env.get('MARGIN_LEVEL', 20);
            Log('杠杆大小：', marginLevel);
            exchange.SetMarginLevel(marginLevel);
        }
        this.exchange = exchange;
        this.klines = PEROIDS.map(peroid => {
            return new Kline(peroid, exchange);
        });
    }
    update() {
        this.klines.forEach(kline => {
            kline.updateRecords();
        });
    }

    start(delay = 5e3) {
        this._timer = setTimeout(() => {
            this.check();
            this.start(delay);
        }, delay);
    }
    stop() {
        clearTimeout(this._timer);
    }
    check() {
        this.update();
        // Log('获取新行情');
        const lastTrend = this._lastTrend;
        const exchangeTicker = _C(this.exchange.GetTicker);
        jack.emit('ticker', exchangeTicker);
        const trend = this._lastTrend = this.__getBollPositionInfo(exchangeTicker);
        if (!lastTrend) {
            this.emit('first_trend', trend);
            return;
        }
        this.__diff(trend, lastTrend);
    }

    __getBollPositionInfo(ticker) {
        // 获取当前所有K线的近期布林数据
        const peroidBollInfo = this.klines.map(kline => {
            const recentBollLines = kline.getRecentBoll(100, ticker);
            const presentBoll = recentBollLines.map(line => line[line.length - 1]);
            // TODO 判断稳定态或非稳定态
            return {
                recentBollLines: recentBollLines,
                peroid: kline.peroid,
                peroidName: kline.peroidName,
                presentBoll,
                // 在上轨及以上
                isOnTop: ticker.Last >= presentBoll[0],
                // 下轨之下
                isBelowDown: ticker.Last <= presentBoll[2],
                // 上升通道
                isGrowing: ticker.Last < presentBoll[0] && ticker.Last > presentBoll[1],
                // 下降通道
                isShrinking: ticker.Last < presentBoll[1] && ticker.Last > presentBoll[2],
            };
        });
        // 计算布林价格排布
        let edgePricePositions = [];
        // 所有价格排布
        let allPricePoistions = [];
        // 完全横盘价格名称分布列表
        let normaEdgelPositionNameList = [presentPriceName];
        peroidBollInfo.forEach(({ presentBoll, peroidName, peroid }) => {
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

        edgePricePositions = edgePricePositions.sort((a, b) => b.price - a.price);
        allPricePoistions = allPricePoistions.sort((a, b) => b.price - a.price);

        // 当前价格所处位置
        const priceInEdgePosition = _.findIndex(edgePricePositions, p => p.priceName === presentPriceName);
        const priceInAllPoistion = _.findIndex(allPricePoistions, p => p.priceName === presentPriceName);

        // 两端价格
        const siblingPrices = priceInAllPoistion === 0 ? allPricePoistions.slice(0, 2) : allPricePoistions.slice(priceInAllPoistion - 1, priceInAllPoistion + 2);

        const isEdgeFirst = priceInEdgePosition === 0;
        const isEdgeLast = priceInEdgePosition === (edgePricePositions.length - 1);

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
        };
    }

    __diff(trend, lastTrend) {
        const diffInfo = {
            trend,
            lastTrend,
            // 价差
            priceDiff: trend.ticker.Last - lastTrend.ticker.Last
        };
        this.__diffPeroidStatus(trend, lastTrend, diffInfo);


        // TODO 价格位置一样，但是不同k线的价格位置变化
        if (trend.priceInEdgePosition > lastTrend.priceInEdgePosition) {
            // 跌破某轨
            diffInfo.brokeDown = trend.edgePricePositions[trend.priceInEdgePosition - 1];
        }
        if (trend.priceInEdgePosition < lastTrend.priceInEdgePosition) {
            // 突破某轨
            diffInfo.brokeUp = trend.edgePricePositions[trend.priceInEdgePosition + 1];
        }
        this.emit('diff', diffInfo);
    }

    __diffPeroidStatus(trend, lastTrend, diffInfo) {
        PEROIDS.forEach(peroid => {
            const presentPeroidBollInfo = _.find(trend.peroidBollInfo, p => p.peroid === peroid);
            const lastPeroidBollInfo = _.find(lastTrend.peroidBollInfo, p => p.peroid === peroid);
            const peroidKeyPrex = `${peroid}_`;
            const peroidBollInfo = {
                prendBoll: presentPeroidBollInfo,
                lastBoll: lastPeroidBollInfo
            };

            // 突破上轨
            if (!lastPeroidBollInfo.isOnTop && presentPeroidBollInfo.isOnTop) {
                diffInfo[peroidKeyPrex + 'ENTER_UP'] = peroidBollInfo;
            }
            // 回退上轨
            if (lastPeroidBollInfo.isOnTop && !presentPeroidBollInfo.isOnTop) {
                diffInfo[peroidKeyPrex + 'BACK_UP'] = peroidBollInfo;
            }
            // 跌破下轨
            if (!lastPeroidBollInfo.isBelowDown && presentPeroidBollInfo.isBelowDown) {
                diffInfo[peroidKeyPrex + 'ENTER_BELOW'] = peroidBollInfo;
            }
            // 回退到下轨以上
            if (lastPeroidBollInfo.isBelowDown && !presentPeroidBollInfo.isBelowDown) {
                diffInfo[peroidKeyPrex + 'BACK_BELOW'] = peroidBollInfo;
            }
        });
    }
}