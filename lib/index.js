const Fontmin = require('fontmin');
const RawSource = require('webpack-sources').RawSource;

class FontminPlugin {
  constructor(options) {
    this._options = options
  }

  apply(compiler) {
    compiler.plugin('this-compilation', compilation => {
      debugger

      // console.log(compiler, compilation)
      // compilation.plugin('optimize', () => {
      //   debugger
      //   console.log(compiler, compilation)
      // })
      // compilation.plugin('optimize-chunk-assets', (chunks, cb) => {
      compilation.plugin('additional-assets', cb => {
        const assets = []
        let ttfAsset = {}
        for (const name in compilation.assets) {
          if (/\.ttf/.test(name)) {
            ttfAsset = {name, asset: compilation.assets[name]}
          }
          if (/\.css$/.test(name)) {
            console.log(name);
            debugger
          }
        }

        new Fontmin()
          .use(Fontmin.glyph({text: '\uf0c7 \uf0ce'}))
          // .use(Fontmin.ttf2woff())
          // .use(Fontmin.ttf2svg())
          .src(ttfAsset.asset.source())
          .run(function (err, files, other) {
            debugger;
            console.log(err, files, other);
            compilation.assets[ttfAsset.name] = new RawSource(files[0].contents)
            cb();
          })
        // const foo = compilation.assets['extract-text-webpack-plugin-output-filename'].source()
        // debugger
        // console.log(chunks);
        // cb()
        // console.log(compiler, compilation)
      })
    })

    // compiler.plugin('emit', compilation => {
    //   debugger
    //
    //   console.log(compiler, compilation)
    // })
  }
}

module.exports = FontminPlugin
