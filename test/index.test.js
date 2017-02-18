const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const rimraf = require('rimraf')
const expect = require('chai').expect
const webpack = require('webpack')
const Plugin = require('../lib')

describe('FontminPlugin', function () {
  let fontStats
  const baseConfig = require('./fixtures/webpack.config.js')

  function collectFontStats(stats) {
    return _.keys(stats.compilation.assets)
      .map(filename => {
        return {
          filename,
          extension: path.extname(filename),
          stats: fs.statSync(`${__dirname}/dist/${filename}`),
        }
      })
      .filter(item => item.extension !== '.js')
  }

  function testWithConfig(config, done) {
    webpack(config, (err, stats) => {
      if (err) {
        done(err)
      } else {
        fontStats = collectFontStats(stats)
        done()
      }
    })
  }

  describe('FontAwesome micro', function () {
    before(done => {
      const plugin = new Plugin({glyphs: '\uf0c7'})
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
})
