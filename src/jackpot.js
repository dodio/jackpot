const logger = require('./logger');

module.exports = {
    main(robotId) {
        logger.log(`robotId: ${robotId}`);
        var i = 0;
        while (i <= 10) {
            i++;
            Log('tick:' + i);
        }
        logger.log(global.main);
        logger.log(global.onexit);
        logger.log(global.onerror);
    },
    onexit() {

    },
    onerror(err) {
        logger.log(err);
    }
}