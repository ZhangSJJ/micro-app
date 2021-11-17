const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { DefinePlugin } = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const config = {
    mode: 'development',
    entry: './src/index',
    devtool: 'source-map',
    output: {
        publicPath: '/',
        path: path.resolve(__dirname, 'build/'),
        filename: 'js/[name].[contenthash:6].js'
    },
    devServer: {
        compress: true,
        historyApiFallback: true,
        proxy: {
            '/api.php': {
                target: 'http://api.qingyunke.com/',
                changeOrigin: true
            }
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    // 'style-loader',
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader'
                ]
            },
            {
                test: /\.js|jsx$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-react',
                            ]
                        }
                    }
                ]
            }

        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: './public/index.html',
            title: 'zsj'
        }),
        new DefinePlugin({
            PUBLIC_URL: '"."'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'public',
                    globOptions: {
                        ignore: [
                            '**/index.html'
                        ]
                    }
                }
            ]
        }),
        new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash:6].css'
        })
    ]
};


module.exports = config;
