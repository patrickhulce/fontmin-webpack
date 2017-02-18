const Plugin = require('./lib/index')
const glob = require('glob')
const path = require('path')
const webpack = require('webpack')
const PurifyPlugin = require('purifycss-webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  entry: './entry.js',
  output: {filename: 'out.js', path: `${__dirname}/dist`},
  module: {
    rules: [
      {test: /\.(woff|woff2)(\?v=.+)?$/, use: ['file-loader']},
      {test: /\.(svg|ttf|eot)(\?v=.+)?$/, use: ['file-loader']},
      {test: /\.css$/, use: ExtractTextPlugin.extract({use: 'css-loader'}), include: __dirname},
    ],
  },
  plugins: [
    new ExtractTextPlugin('app.css'),
    new PurifyPlugin({
      paths: glob.sync(path.join(__dirname, '*.html'))
    }),
    new Plugin()
  ]
}
