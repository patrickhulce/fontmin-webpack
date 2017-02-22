const path = require('path')

const _ = require('lodash')
const ttf2woff2 = require('ttf2woff2')
const Fontmin = require('fontmin')
const RawSource = require('webpack-sources').RawSource

const FONT_REGEX = /\.(eot|ttf|svg|woff|woff2)$/
const TEXT_REGEX = /\.(js|css|html)$/
const GLYPH_REGEX = /content\s*:\s*(.*?)\s*;/g
const UNICODE_REGEX = /\\(\w{4})/
const FONTMIN_EXTENSIONS = ['eot', 'woff', 'svg']

class FontminPlugin {
  constructor(options) {
    this._options = _.assign({
      glyphs: [],
      autodetect: true,
    }, options)
  }

  computeFinalGlyphs(foundGlyphs) {
    let glyphs = _.clone(this._options.glyphs)
    if (this._options.autodetect) {
      glyphs = glyphs.concat(foundGlyphs)
    }

    return glyphs
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
        const filename = module.fileDependencies[0]
        const font = path.basename(filename, extension)
        return {asset, extension, font, buffer}
      })
      .uniqBy('asset')
      .value()
  }

  findUnicodeGlyphs(compilation) {
    return _(compilation.assets)
      .map((asset, name) => ({asset, name}))
      .filter(item => TEXT_REGEX.test(item.name))
      .map(item => {
        const content = item.asset.source()
        const matches = content.match(GLYPH_REGEX) || []
        return matches
          .map(match => {
            const unicodeMatch = match.match(UNICODE_REGEX)
            return unicodeMatch ?
              String.fromCharCode(parseInt(unicodeMatch[1], 16)) :
              false
          })
          .filter(Boolean)
      })
      .flatten()
      .value()
  }

  setupFontmin(extensions, usedGlyphs = []) {
    usedGlyphs = _.isArray(usedGlyphs) ? usedGlyphs : [usedGlyphs]
    let fontmin = new Fontmin().use(Fontmin.glyph({text: usedGlyphs.join(' ')}))
    FONTMIN_EXTENSIONS.forEach(ext => {
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

  minifyFontGroup(group, usedGlyphs = []) {
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

  onAdditionalAssets(compilation, done) {
    const fontFiles = this.findFontFiles(compilation)
    const glyphsInCss = this.findUnicodeGlyphs(compilation)
    const minifiableFonts = _(fontFiles).groupBy('font').values()

    const glyphs = this.computeFinalGlyphs(glyphsInCss)
    minifiableFonts.reduce((prev, group) => {
      return prev
        .then(() => this.minifyFontGroup(group, glyphs))
        .then(files => {
          files.forEach(file => {
            if (file.buffer.length > file.minified.length) {
              compilation.assets[file.asset] = new RawSource(file.minified)
            }
          })
        })
    }, Promise.resolve()).then(done)
  }

  apply(compiler) {
    compiler.plugin('this-compilation', compilation => {
      compilation.plugin('additional-assets', done => {
        this.onAdditionalAssets(compilation, done)
      })
    })
  }
}

module.exports = FontminPlugin
