import '../base/bootstrap';

let orders;

jack.on('main', main);

function main() {
    exchange.SetContractType('quarter');
    orders = _C(exchange.GetOrders);
    Log(JSON.stringify(orders));
    if (orders && orders.length) {
        jack.messager.send(`当前有${orders.length}挂单：`);
        checkOrderStatus();
    } else {
        Log('当前没有挂单');
    }
}

function checkOrderStatus() {
    orders.forEach(order => {
        Log(JSON.stringify(order));
    });
}