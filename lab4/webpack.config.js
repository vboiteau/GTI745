const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
    template: './client/index.html',
    filename: 'index.html',
    inject: false
});

const getPath = p => path.resolve(path.join(__dirname, p));

module.exports = {
    entry: ['babel-polyfill', './client/index.js'],
    output: {
        path: path.resolve('./dist'),
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.jsx?$/, loader: 'babel-loader', exclude: /node_modules/
            },
            {
                test: /\.(csv|txt)/,
                loader: 'file-loader',
                options: {
                    name: '[path][name].[ext]'
                }
            }
        ]
    },
    plugins: [HtmlWebpackPluginConfig]
};
