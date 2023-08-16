const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        'bundle.js': [
            path.resolve(__dirname, 'src/scripts/engine.js'),
            path.resolve(__dirname, 'src/scripts/player.js'),
            path.resolve(__dirname, 'src/scripts/sprite.js')
        ]
    },
    output: {
        filename: '[name]',
        path: path.resolve(__dirname, 'public')
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html'
        })
    ]
};
