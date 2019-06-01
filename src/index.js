const jackpot = require('./jackpot');
const logger = require('./logger');

logger.log('load jackpot');
Object.assign(global, jackpot);