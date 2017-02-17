
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
      compilation.plugin('additional-assets', cb => {
        const assets = []
        for (const name in compilation.assets) {
          if (/\.css$/.test(name)) {
            console.log(name);
            debugger
          }
        }
        // const foo = compilation.assets['extract-text-webpack-plugin-output-filename'].source()
        debugger
        cb()
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
