const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const rimraf = require('rimraf')
const expect = require('chai').expect
const webpack = require('webpack')
const Plugin = require('../lib')

const DIST_FOLDER = path.join(__dirname, 'fixtures/dist/')
const FONT_AWESOME_FOLDER = path.join(__dirname, '../node_modules/font-awesome')

describe('FontminPlugin', () => {
  let fontStats
  const baseConfig = require('./fixtures/webpack.config.js')
  const baseExtractConfig = require('./fixtures/webpack.extract-text.config.js')
  const baseUnicodeConfig = require('./fixtures/webpack.unicode.config.js')
  const originalStats = collectFontStats(FONT_AWESOME_FOLDER + '/fonts', {
    'fontawesome-webfont.eot': true,
    'fontawesome-webfont.ttf': true,
    'fontawesome-webfont.svg': true,
    'fontawesome-webfont.woff': true,
    'fontawesome-webfont.woff2': true,
  })

  function collectFontStats(directory, files) {
    return _.keys(files)
      .map(filename => {
        const filePath = `${directory}/${filename}`
        return {
          filename,
          filePath,
          extension: path.extname(filename),
          stats: fs.statSync(filePath),
        }
      })
      .filter(item => item.extension !== '.js')
  }

  function getGlyphs() {
    const svg = _.find(fontStats, {extension: '.svg'})
    const contents = fs.readFileSync(svg.filePath, 'utf8')
    const matchedContents = contents.match(/glyph-name="(.*?)"/g)
    const getGlyphName = s => s.slice('glyph-name="'.length, s.length - 1)
    return matchedContents.map(getGlyphName)
  }

  function testWithConfig(config, done) {
    webpack(config, (err, stats) => {
      try {
        if (err) {
          done(err)
        } else {
          fontStats = collectFontStats(DIST_FOLDER, stats.compilation.assets)
          done()
        }
      } catch (err) {
        done(err)
      }
    })
  }

  describe('FontAwesome micro', () => {
    it('should run successfully', function (done) {
      this.timeout(10000)
      const plugin = new Plugin({autodetect: false, glyphs: '\uF0C7'})
      const config = _.cloneDeep(baseConfig)
      testWithConfig(_.assign(config, {plugins: [plugin]}), done)
    })

    before(done => rimraf(DIST_FOLDER, done))
    after(done => rimraf(DIST_FOLDER, done))

    it('should minify eot', () => {
      const eot = _.find(fontStats, {extension: '.eot'})
      expect(eot.stats.size)
        .to.be.greaterThan(500)
        .lessThan(2400)
    })

    it('should minify svg', () => {
      const glyphs = getGlyphs()
      expect(glyphs).to.eql(['save'])
      const svg = _.find(fontStats, {extension: '.svg'})
      expect(svg.stats.size)
        .to.be.greaterThan(500)
        .lessThan(2000)
    })

    it('should minify tff', () => {
      const ttf = _.find(fontStats, {extension: '.ttf'})
      expect(ttf.stats.size)
        .to.be.greaterThan(500)
        .lessThan(2200)
    })

    it('should minify woff', () => {
      const woff = _.find(fontStats, {extension: '.woff'})
      expect(woff.stats.size)
        .to.be.greaterThan(500)
        .lessThan(2300)
    })

    it('should minify woff2', () => {
      const woff2 = _.find(fontStats, {extension: '.woff2'})
      expect(woff2.stats.size)
        .to.be.greaterThan(500)
        .lessThan(1000)
    })
  })

  describe('FontAwesome inferred', () => {
    it('should run successfully', function (done) {
      this.timeout(60000)
      testWithConfig(baseConfig, done)
    })

    after(done => rimraf(DIST_FOLDER, done))

    it('should contain the right glyphs', () => {
      const glyphs = getGlyphs()
      expect(glyphs).to.not.contain('heart')
      expect(glyphs).to.contain('table')
      expect(glyphs).to.contain('film')
      expect(glyphs).to.contain('ok')
      expect(glyphs).to.contain('remove')
    })
  })

  describe('FontAwesome full', () => {
    it('should run successfully', function (done) {
      this.timeout(60000)
      const plugin = new Plugin({autodetect: false})
      const config = _.cloneDeep(baseConfig)
      testWithConfig(_.assign(config, {plugins: [plugin]}), done)
    })

    after(done => rimraf(DIST_FOLDER, done))

    it('should not replace with a larger version', () => {
      const svg = _.find(fontStats, {extension: '.svg'})
      const svgOriginal = _.find(originalStats, {extension: '.svg'})
      expect(svg.stats.size).to.equal(svgOriginal.stats.size)
    })
  })

  describe('FontAwesome with ExtractTextPlugin', () => {
    it('should run successfully', function (done) {
      this.timeout(60000)
      testWithConfig(baseExtractConfig, done)
    })

    after(done => rimraf(DIST_FOLDER, done))

    it('should minify eot', () => {
      const eot = _.find(fontStats, {extension: '.eot'})
      expect(eot.stats.size)
        .to.be.greaterThan(500)
        .lessThan(7000)
    })

    it('should minify svg', () => {
      const svg = _.find(fontStats, {extension: '.svg'})
      expect(svg.stats.size)
        .to.be.greaterThan(500)
        .lessThan(7000)
    })

    it('should minify tff', () => {
      const ttf = _.find(fontStats, {extension: '.ttf'})
      expect(ttf.stats.size)
        .to.be.greaterThan(500)
        .lessThan(7000)
    })

    it('should minify woff', () => {
      const woff = _.find(fontStats, {extension: '.woff'})
      expect(woff.stats.size)
        .to.be.greaterThan(500)
        .lessThan(7000)
    })

    it('should minify woff2', () => {
      const woff2 = _.find(fontStats, {extension: '.woff2'})
      expect(woff2.stats.size)
        .to.be.greaterThan(500)
        .lessThan(7000)
    })

    it('should contain the right glyphs', () => {
      const glyphs = getGlyphs()
      expect(glyphs).to.not.contain('heart')
      expect(glyphs).to.contain('table')
      expect(glyphs).to.contain('film')
      expect(glyphs).to.contain('ok')
      expect(glyphs).to.contain('remove')
    })
  })

  describe('FontAwesome with multi-byte unicode characters', () => {
    it('should run successfully', function (done) {
      this.timeout(60000)
      testWithConfig(baseUnicodeConfig, done)
    })

    after(done => rimraf(DIST_FOLDER, done))
  })
})
