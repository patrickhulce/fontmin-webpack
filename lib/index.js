const path = require('path')

const _ = require('lodash')
const ttf2woff2 = require('ttf2woff2')
const Fontmin = require('fontmin')
const RawSource = require('webpack-sources').RawSource

const FONT_REGEX = /\.(eot|ttf|svg|woff|woff2)$/

class FontminPlugin {
  constructor(options = {}) {
    this._options = options
  }

  hasFontAsset(assets) {
    return _.find(assets, (val, key) => FONT_REGEX.test(key))
  }

  findFontFiles(compilation) {
    return _(compilation.modules)
      .filter(module => this.hasFontAsset(module.assets))
      .map(module => {
        const asset = _.keys(module.assets)[0]
        const buffer = module.assets[asset].source()
        const extension = path.extname(asset)
        const font = path.basename(module.fileDependencies[0], extension)
        return {asset, extension, font, buffer}
      })
      .uniqBy('asset')
      .value()
  }

  setupFontmin(extensions, usedGlyphs = '') {
    let fontmin = new Fontmin().use(Fontmin.glyph({text: usedGlyphs}))
    ;['eot', 'woff', 'svg'].forEach(ext => {
      if (extensions.includes('.' + ext)) {
        fontmin = fontmin.use(Fontmin[`ttf2${ext}`]())
      }
    })

    return fontmin
  }

  mergeAssetsAndFiles(group, files) {
    const byExtension = _.keyBy(files, 'extname')
    return group.map(item => {
      const minified = item.extension === '.woff2' ?
        ttf2woff2(byExtension['.ttf'].contents) :
        byExtension[item.extension].contents
      return _.assign(item, {minified})
    })
  }

  minifyFontGroup(group, usedGlyphs = '') {
    const ttfInfo = _.find(group, {extension: '.ttf'})
    if (!ttfInfo) {
      return Promise.resolve([])
    }

    const extensions = _.map(group, 'extension')
    const fontmin = this.setupFontmin(extensions, usedGlyphs)
    return new Promise((resolve, reject) => {
      fontmin
        .src(ttfInfo.buffer)
        .run((err, files) => {
          if (err) {
            reject(err)
          } else {
            resolve(this.mergeAssetsAndFiles(group, files))
          }
        })
    })
  }

  apply(compiler) {
    compiler.plugin('this-compilation', compilation => {
      compilation.plugin('additional-assets', done => {
        const fontFiles = this.findFontFiles(compilation)
        const minifiableFonts = _(fontFiles).groupBy('font').values()

        minifiableFonts.reduce((prev, group) => {
          return prev
            .then(() => this.minifyFontGroup(group, this._options.glyphs))
            .then(files => {
              files.forEach(file => {
                compilation.assets[file.asset] = new RawSource(file.minified)
              })
            })
        }, Promise.resolve()).then(() => done())
      })
    })
  }
}

module.exports = FontminPlugin
