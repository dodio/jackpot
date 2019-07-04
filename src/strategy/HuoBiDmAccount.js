/* eslint-disable complexity */

const statusMap = {
    open_long: {
        direction: 'buy'
    },
    close_long: {
        direction: 'closebuy'
    },
    open_short: {
        direction: 'sell'
    },
    close_short: {
        direction: 'closesell'
    }
};

const statusNameList = Object.keys(statusMap);

export default class HuoBiDmAccount {
    constructor(exchange) {
        this.exchange = exchange;
        this.status = null;
        this.exchangeName = exchange.GetName();
        this.currency = exchange.GetCurrency();
        this.symbol = this.currency.split('_').shift();
        this.ticker = null;
        Log('【创建账户信息】：交易所：', this.exchangeName, '交易币种：', this.currency);
        this._initAccount = this.getAccount();
        Log('初始账户状态：', this._initAccount);
        framework.on('ticker', (ticker) => {
            this.ticker = ticker;
        });
        this.startAutoCheck();
    }

    startAutoCheck() {
        this._auto = true;
        this.autoCheck();
    }
    stopAutoCheck() {
        this._auto = false;
    }
    autoCheck() {
        if (!this._auto) {
            return;
        }
        nextTick(() => {
            this.checkStaus();
            this.autoCheck();
        });
    }

    refreshAccount() {
        const oral =  _C(this.exchange.GetAccount);
        const account = _.find(oral.Info.data, (item) => item.symbol === this.symbol);
        if (!account) {
            Log(oral);
            throw new Error(`未找到币种：${this.symbol}, 的账户信息`);
        }
        this._exchangeAccount = account;
    }

    getAccount() {
        // if (!this._exchangeAccount) {
        this.refreshAccount();
        // }
        if (!this.ticker) {
            this.ticker = _C(this.exchange.GetTicker);
        }
        const account = { ...this._exchangeAccount };
        account.margin_money = account.margin_balance * this.ticker.Last;
        account.margin_available_money = account.margin_available * this.ticker.Last;
        account.totalPaper = Math.floor(account.margin_money * account.lever_rate / 100);
        account.availablePaper = Math.floor(account.margin_available_money * account.lever_rate / 100);
        account.positionRate = account.margin_position / account.margin_balance;
        return account;
    }
    /**
     * 检查交易所的状态是否符合当前应该的持仓状态，并计算是应该买入还是卖出
     */
    checkStaus() {
        if (!this.status) {
            return;
        }
        const status = this.status;
        const exchange = this.exchange;
        const direction = statusMap[status.name].direction;
        exchange.SetDirection(direction);

        const ticker = this.ticker;
        const positionInfo = _C(exchange.GetPosition());
        const exchangeOrders = _C(exchange.GetOrders());
        const account =  this.getAccount();

        const messager = framework.messager;
        const contractType = framework.env.get('DM_TYPE');
        // 滑单价格
        const sliperPrice = framework.env.get('SLIPER_PRICE', 1);
        const makeOrderPrice = (status.name === 'close_long' || status.name === 'open_short') ? ticker.Buy - sliperPrice : ticker.Sell + sliperPrice;

        if (status.name === 'close_long') {
            const longPoistion = getPositionInfo(positionInfo, 'buy', contractType, this.symbol);
            if (!longPoistion) {
                messager.send('平多完毕');
                messager.send(`当前账户币的数量：【当前】${account.margin_balance}，【初始】${this._initAccount.margin_balance},【差额】：${account.margin_available}`);
                this.status = null;
                // 已没有多头持仓
                return;
            }
            const orders = filterOrders(exchangeOrders, 'sell', contractType, this.symbol);
            if (orders.length) {
                // 之前有订单，先取消重新下单
                orders.forEach(order => {
                    exchange.CancelOrder(order.Id);
                });
            }

            const orderMessage = ['卖出平多,价格：', makeOrderPrice, '数量：', longPoistion.volume, '张'];
            if (exchange.Sell(makeOrderPrice, longPoistion.volume)) {
                orderMessage.unshift('【下单失败】');
            } else {
                orderMessage.unshift('【下单成功】');
            }
            messager.send(orderMessage);
        }

        if (status.name === 'close_short') {
            const longPoistion = getPositionInfo(positionInfo, 'sell', contractType, this.symbol);
            if (!longPoistion) {
                messager.send('空头平仓完毕');
                messager.send(`当前账户币的数量：【当前】${account.margin_balance}，【初始】${this._initAccount.margin_balance},【差额】：${account.margin_available}`);
                this.status = null;
                // 已没有空头持仓
                return;
            }
            const orders = filterOrders(exchangeOrders, 'buy', contractType, this.symbol);
            if (orders.length) {
                // 之前有订单，先取消重新下单
                orders.forEach(order => {
                    exchange.CancelOrder(order.Id);
                });
            }
            const orderMessage = ['买入平空,价格：', makeOrderPrice, '数量：', longPoistion.volume, '张'];
            if (exchange.Buy(makeOrderPrice, longPoistion.volume)) {
                orderMessage.unshift('【下单失败】');
            } else {
                orderMessage.unshift('【下单成功】');
            }
            messager.send(orderMessage);
        }

        if (status.name === 'open_long') {
            const longPoistion = getPositionInfo(positionInfo, 'buy', contractType, this.symbol);
            let presentPositionRate = 0;
            if (longPoistion) {
                presentPositionRate = (longPoistion.volume / account.totalPaper);
            }
            if (longPoistion && presentPositionRate > status.position) {
                // 开多头完毕
                messager.send('开多仓完毕');
                this.status = null;
                return;
            }
            const orders = filterOrders(exchangeOrders, 'buy', contractType, this.symbol);
            if (orders.length) {
                // 之前有订单，先取消重新下单
                orders.forEach(order => {
                    exchange.CancelOrder(order.Id);
                });
            }
            const openAmount = Math.floor((status.position - presentPositionRate) * account.totalPaper);
            const orderMessage = ['买入开多,价格：', makeOrderPrice, '数量：', openAmount, '张'];
            if (exchange.Buy(makeOrderPrice, openAmount)) {
                orderMessage.unshift('【下单失败】');
            } else {
                orderMessage.unshift('【下单成功】');
            }
            messager.send(orderMessage);
        }

        if (status.name === 'open_short') {
            const longPoistion = getPositionInfo(positionInfo, 'sell', contractType, this.symbol);
            let presentPositionRate = 0;
            if (longPoistion) {
                presentPositionRate = (longPoistion.volume / account.totalPaper);
            }
            if (longPoistion && presentPositionRate > status.position) {
                // 开多头完毕
                messager.send('开空仓完毕');
                this.status = null;
                return;
            }
            const orders = filterOrders(exchangeOrders, 'sell', contractType, this.symbol);
            if (orders.length) {
                // 之前有订单，先取消重新下单
                orders.forEach(order => {
                    exchange.CancelOrder(order.Id);
                });
            }
            const openAmount = Math.floor((status.position - presentPositionRate) * account.totalPaper);
            const orderMessage = ['卖出开空,价格：', makeOrderPrice, '数量：', openAmount, '张'];
            if (exchange.Buy(makeOrderPrice, openAmount)) {
                orderMessage.unshift('【下单失败】');
            } else {
                orderMessage.unshift('【下单成功】');
            }
            messager.send(orderMessage);
        }
    }
    /**
     * 设置应该是什么仓位状态
     */
    setStatus(status) {
        if (status !== null && (!status.hasOwnProperty('name') || !status.hasOwnProperty('position'))) {
            throw new Error('仓位状态属性需要有：name, position(0-1)');
        }
        if (status) {
            if (!_.contains(statusNameList, status.name)) {
                throw new Error(`仓位名称需要为：${statusNameList.join(',')}之一`);
            }
            if (!_.isNumber(status.position) || status.position > 1 || status.position < 0) {
                throw new Error('仓位比例需要为0-1的数字');
            }
        }
        this.status = status;
        this.checkStaus();
    }
}


function getPositionInfo(data, direction, symbol, type) {
    return _.find(data, item => {
        const info = item.Info;
        return info.contract_type === type
        && info.symbol === symbol &&
        info.direction === direction;
    });
}

function filterOrders(orders, direction, symbol, type) {
    return orders.filter(order => {
        const info = order.Info;
        return info.direction === direction && info.symbol === symbol && info.contract_type === type;
    });
}