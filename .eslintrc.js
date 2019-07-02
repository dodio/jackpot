module.exports = {
    extends: [
        'eslint-config-alloy',
    ],
    globals: {
        framework: false,

        // 发明者的全局变量
        Log: false,
        LogReset: false,
        exchange: false,
        exchanges: false,
        _: false,
        _N: false,
        _C: false,
    },
    rules: {
        'no-undef': 1,
        'no-param-reassign': 1,
    }
};