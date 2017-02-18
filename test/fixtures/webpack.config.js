const FontminPlugin = require('../../lib')

module.exports = {
  entry: `${__dirname}/entry.js`,
  output: {filename: 'out.js', path: `${__dirname}/dist`},
  module: {
    rules: [
      {test: /\.(woff|woff2)(\?v=.+)?$/, use: ['file-loader']},
      {test: /\.(svg|ttf|eot)(\?v=.+)?$/, use: ['file-loader']},
      {test: /\.css$/, use: ['style-loader', 'css-loader'], include: __dirname},
    ],
  },
  plugins: [new FontminPlugin({glyphs: '\uf0c7 \uf0ce'})]
}
