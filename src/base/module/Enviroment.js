export default class Env {
    constructor() {
        this.args = {};
    }
    // TODO 根据不同模块隔离不同策略变量
    // TODO 接收Commander命令来更新策略变量
    get(varname, defaultValue) {
        if (!_.isString(varname) || !varname) {
            throw new Error('策略变量名需要为字符串');
        }
        if (/[^a-zA-Z0-9_]/g.test(varname)) {
            throw new Error(`不是合法的变量名:${varname}`);
        }
        if (this.args.hasOwnProperty(varname)) {
            return this.args[varname];
        }
        let var_;
        try {
            // eslint-disable-next-line no-eval
            var_ = eval(varname);
        } catch (err) {
            // eslint-disable-next-line no-undefined,eqeqeq
            if (defaultValue != undefined) {
                var_ = defaultValue;
                Log(`未设置策略变量：${varname}，使用默认值：${defaultValue}`);
            } else {
                Log(err);
                throw new Error(`发生错误，未设置策略变量：${varname}，也未指定默认值`);
            }
        }
        this.args[varname] = var_;
        return var_;
    }
}