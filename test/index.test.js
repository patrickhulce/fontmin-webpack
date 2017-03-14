const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const rimraf = require('rimraf')
const expect = require('chai').expect
const webpack = require('webpack')
const Plugin = require('../lib')

const DIST_FOLDER = path.join(__dirname, 'fixtures/dist/')
const FONT_AWESOME_FOLDER = path.join(__dirname, '../node_modules/font-awesome')

describe('FontminPlugin', function () {
  let fontStats
  const baseConfig = require('./fixtures/webpack.config.js')
  const baseExtractConfig = require('./fixtures/webpack.extract-text.config.js')
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

  function testWithConfig(config, done) {
    webpack(config, (err, stats) => {
      if (err) {
        done(err)
      } else {
        fontStats = collectFontStats(DIST_FOLDER, stats.compilation.assets)
        done()
      }
    })
  }

  describe('FontAwesome micro', function () {
    before(function (done) {
      this.timeout(10000)
      const plugin = new Plugin({autodetect: false, glyphs: '\uf0c7'})
      const config = _.cloneDeep(baseConfig)
      testWithConfig(_.assign(config, {plugins: [plugin]}), done)
    })

    after(done => rimraf('fixtures/dist', done))

    it('should minify eot', () => {
      const eot = _.find(fontStats, {extension: '.eot'})
      expect(eot).to.have.deep.property('stats.size').greaterThan(500).lessThan(2400)
    })

    it('should minify svg', () => {
      const svg = _.find(fontStats, {extension: '.svg'})
      expect(svg).to.have.deep.property('stats.size').greaterThan(500).lessThan(2000)
    })

    it('should minify tff', () => {
      const ttf = _.find(fontStats, {extension: '.ttf'})
      expect(ttf).to.have.deep.property('stats.size').greaterThan(500).lessThan(2200)
    })

    it('should minify woff', () => {
      const woff = _.find(fontStats, {extension: '.woff'})
      expect(woff).to.have.deep.property('stats.size').greaterThan(500).lessThan(2300)
    })

    it('should minify woff2', () => {
      const woff2 = _.find(fontStats, {extension: '.woff2'})
      expect(woff2).to.have.deep.property('stats.size').greaterThan(500).lessThan(1000)
    })
  })

  describe('FontAwesome inferred', function () {
    before(function (done) {
      this.timeout(60000)
      testWithConfig(baseConfig, done)
    })

    after(done => rimraf('fixtures/dist', done))

    it('should contain the right glyphs', () => {
      const svg = _.find(fontStats, {extension: '.svg'})
      const contents = fs.readFileSync(svg.filePath, 'utf8')
      expect(contents).to.not.match(/glyph-name="heart"/)
      expect(contents).to.match(/glyph-name="table"/)
      expect(contents).to.match(/glyph-name="film"/)
    })
  })

  describe('FontAwesome full', function () {
    before(function (done) {
      this.timeout(60000)
      const plugin = new Plugin({autodetect: true})
      const config = _.cloneDeep(baseConfig)
      testWithConfig(_.assign(config, {plugins: [plugin]}), done)
    })

    after(done => rimraf('fixtures/dist', done))

    it('should not replace with a larger version', () => {
      const svg = _.find(fontStats, {extension: '.svg'})
      const svgOriginal = _.find(originalStats, {extension: '.svg'})
      expect(svg).to.have.deep.property('stats.size', svgOriginal.stats.size)
    })
  })

  describe('FontAwesome with ExtractTextPlugin', function () {
    before(function (done) {
      this.timeout(60000)
      testWithConfig(baseExtractConfig, done)
    })

    after(done => rimraf('fixtures/dist', done))

    it('should contain the right glyphs', () => {
      const svg = _.find(fontStats, {extension: '.svg'})
      const contents = fs.readFileSync(svg.filePath, 'utf8')
      expect(contents).to.not.match(/glyph-name="heart"/)
      expect(contents).to.match(/glyph-name="table"/)
      expect(contents).to.match(/glyph-name="film"/)
    })
  })
})
