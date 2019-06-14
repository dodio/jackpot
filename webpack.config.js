const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const entries = require('glob').sync(path.resolve(__dirname, './src/entry/*.js')).reduce((obj, file) => {
    obj[path.basename(file, '.js')] = file;
    return obj;
}, {});

module.exports = {
    entry: entries,
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].js'
    },
    devtool: 'source-map',
    module: {
        rules: [{
            test: /\.m?js$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env']
                }
            }
        }]
    },
    plugins: [
        new CleanWebpackPlugin(),
    ]
}