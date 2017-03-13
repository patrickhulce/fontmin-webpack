const FontminPlugin = require('../../lib')
const NukecssPlugin = require('nukecss-webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  entry: `${__dirname}/entry.js`,
  output: {filename: 'out.js', path: `${__dirname}/dist`, publicPath: '/test/fixtures/dist/'},
  module: {
    rules: [
      {test: /\.(woff|woff2)(\?v=.+)?$/, use: ['file-loader']},
      {test: /\.(svg|ttf|eot)(\?v=.+)?$/, use: ['file-loader']},
      {test: /\.css$/, use: ExtractTextPlugin.extract({use: 'css-loader'})},
    ],
  },
  plugins: [
    new ExtractTextPlugin({
      filename: 'out.css',
      allChunks: true,
    }),
    new NukecssPlugin(),
    new HtmlWebpackPlugin(),
    new FontminPlugin(),
  ]
}
