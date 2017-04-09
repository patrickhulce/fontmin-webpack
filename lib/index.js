const fs = require('fs')
const path = require('path')
const log = require('debug')('fontmin-webpack')

const _ = require('lodash')
const ttf2woff2 = require('ttf2woff2')
const Fontmin = require('fontmin')
const RawSource = require('webpack-sources').RawSource

const FONT_REGEX = /\.(eot|ttf|svg|woff|woff2)$/
const TEXT_REGEX = /\.(js|css|html)$/
const GLYPH_REGEX = /content\s*:[^};]*?('|")(.*?)\s*('|"|;)/g
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
    const regular = this.findRegularFontFiles(compilation)
    const extract = this.findExtractTextFontFiles(compilation)
    return _.uniqBy(regular.concat(extract), 'asset')
  }

  findRegularFontFiles(compilation) {
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
      .value()
  }

  findExtractTextFontFiles(compilation) {
    const fileDependencies = _(compilation.modules)
      .map(module => module.fileDependencies)
      .flatten()
      .filter(filename => FONT_REGEX.test(filename))
      .map(filename => {
        return {
          filename,
          stats: fs.statSync(filename),
        }
      })
      .value()

    return _(compilation.assets)
      .keys()
      .filter(name => FONT_REGEX.test(name))
      .map(asset => {
        const buffer = compilation.assets[asset].source()
        const extension = path.extname(asset)
        const dependency = fileDependencies.find(dependency => {
          return path.extname(dependency.filename) === extension &&
            buffer.length === dependency.stats.size
        })
        const filename = (dependency && dependency.filename) || asset
        const font = path.basename(filename, extension)
        return {asset, extension, font, buffer}
      })
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
    log('analyzing font group:', _.get(group, '0.font'))
    const ttfInfo = _.find(group, {extension: '.ttf'})
    if (!ttfInfo) {
      log('font group has no TTF file, skipping...')
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
    log(`found ${glyphsInCss.length} glyphs in CSS`)
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
    }, Promise.resolve()).then(done).catch(done)
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
