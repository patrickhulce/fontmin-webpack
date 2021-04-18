const FontminPlugin = require('../../lib')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  entry: `${__dirname}/entry.js`,
  output: {filename: 'out.js', path: `${__dirname}/dist`, publicPath: '/test/fixtures/dist/'},
  module: {
    rules: [
      {test: /\.(woff|woff2)(\?v=.+)?$/, use: ['file-loader']},
      {test: /\.(svg|ttf|eot|png)(\?v=.+)?$/, use: ['file-loader']},
      {test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader']},
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'out.css'
    }),
    new HtmlWebpackPlugin(),
    new FontminPlugin(),
  ],
}
