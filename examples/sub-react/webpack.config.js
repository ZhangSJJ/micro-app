const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { DefinePlugin } = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')


module.exports = {
    mode: 'development',
    entry: './src/index.js',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'build/'),
        filename: 'js/[name].[contenthash:6].js',
        library: 'myReact',
        libraryTarget: 'umd',
        // globalObject: 'window',
    },

    devServer: {
        headers: {
            'access-control-allow-origin': '*',
        },

    },

    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    { loader: MiniCssExtractPlugin.loader },
                    // { loader: 'style-loader' },
                    { loader: 'css-loader' },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: ['postcss-preset-env']
                            }
                        }
                    },
                ]
            },
            {
                test: /\.js|jsx$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-react'
                        ]
                    }
                }
            }
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: 'sub-app-react',
            template: './public/index.html'
        }),
        new DefinePlugin({
            PUBLIC_URL: '"."'
        }),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin(),
    ]

}
