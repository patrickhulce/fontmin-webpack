# fontmin-webpack

[![NPM Package](https://badge.fury.io/js/fontmin-webpack.svg)](https://www.npmjs.com/package/fontmin-webpack)
[![Build Status](https://travis-ci.org/patrickhulce/fontmin-webpack.svg?branch=master)](https://travis-ci.org/patrickhulce/fontmin-webpack)
[![Coverage Status](https://coveralls.io/repos/github/patrickhulce/fontmin-webpack/badge.svg?branch=master)](https://coveralls.io/github/patrickhulce/fontmin-webpack?branch=master)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Dependencies](https://david-dm.org/patrickhulce/fontmin-webpack.svg)](https://david-dm.org/patrickhulce/fontmin-webpack)

Minifies icon fonts to just what is used.

```bash
# for webpack 5
npm install --save-dev fontmin-webpack
# for webpack 4
npm install --save-dev fontmin-webpack@^2.0.1
# for webpack <=3
npm install --save-dev fontmin-webpack@^1.0.2
```

## How It Works

- Examines your webpack output assets to identify font formats that have the same name
- Identifies CSS rules that specify a content property and extracts unicode characters
- Uses `fontmin` to minify the TrueType font to only the used glyphs
- Converts the ttf back to all other formats (supports `ttf`, `eot`, `svg`, `woff`, and `woff2` although you should really only need to care about [woff](http://caniuse.com/#search=woff))
- Replaces the webpack output asset with the minified version

## Usage

#### Install fontmin-webpack

`npm install --save-dev fontmin-webpack`

#### Include Your Icon Font

The example below uses glyphs `\uf0c7` and `\uf0ce`

```css
@font-face {
  font-family: 'FontAwesome';
  src: url('fontawesome-webfont.eot') format('embedded-opentype'), url('fontawesome-webfont.woff2')
      format('woff2'), url('fontawesome-webfont.woff') format('woff'), url('fontawesome-webfont.ttf')
      format('ttf');
}

/**
 * Remove other unused icons from the file.
 */
.fa-save:before,
.fa-floppy-o:before {
  content: '\f0c7';
}
.fa-table:before {
  content: '\f0ce';
}
```

#### Setup Your Webpack Configuration

```js
const FontminPlugin = require('fontmin-webpack')

module.exports = {
  entry: 'my-entry.js',
  output: {
    // ...
  },
  plugins: [
    // ...
    new FontminPlugin({
      autodetect: true, // automatically pull unicode characters from CSS
      glyphs: ['\uf0c8' /* extra glyphs to include */],
      // note: these settings are mutually exclusive and allowedFilesRegex has priority over skippedFilesRegex
      allowedFilesRegex: null, // RegExp to only target specific fonts by their names
      skippedFilesRegex: null, // RegExp to skip specific fonts by their names
      fontRegex: /\.(eot|ttf|svg|woff|woff2)(\?.+)?$/, // RegExp for searching font files
      textRegex: /\.(js|css|html)$/,  // RegExp for searching text reference
      webpackCompilationHook: 'thisCompilation', // Webpack compilation hook (for example PurgeCss webpack plugin use 'compilation' )
    }),
  ],
}
```

#### Use in Vue3

In a Vue3 project PurgeCss needs to be executed as a Webpack plugin. 
The easiest way to add Webpack plugins is to declare them in vue.config.js

This is a sample for a project with Vue3 / Tailwindcss 3 / Fontawesome 6
#### **`vue.config.js`**
```js
const webpackPlugins = [];
const __DEBUG__='0'; //turn to 1 for avoiding purgecss and fontmin

// **********************************
// Purgecss unused classes
//
if (__DEBUG__ !== '1') {
  const PurgecssPlugin = require('purgecss-webpack-plugin');
  const glob = require('glob-all')
  const purgeCssPlugin = new PurgecssPlugin({
    paths: glob.sync(
      [
        path.join(__dirname, './public/*.html'),
        path.join(__dirname, './src/**/*.vue'),
        path.join(__dirname, './src/**/*.js')
      ]),
    safelist: [/^sm:/, /^md:/, /^lg:/, /^xl:/, /^2xl:/, /^focus:/, /^hover:/, /^group-hover:/, /\[.*\]/, /^basicLightbox/, /\/[0-9]/, /^tns/],
    fontFace: true
  })
  webpackPlugins.push(purgeCssPlugin);
}

// **********************************
// fontminifying Fontawesome
//
if (__DEBUG__ !== '1') {
  const FontMinPlugin = require('fontmin-webpack');
  const fontMinPlugin = new FontMinPlugin({
    autodetect: true,
    glyphs: [],
    allowedFilesRegex: /^fa[srltdb]*-/, // RegExp to only target specific fonts by their names
    skippedFilesRegex: null, // RegExp to skip specific fonts by their names
    textRegex: /\.(js|css|html|vue)$/,  // RegExp for searching text reference
    webpackCompilationHook: 'compilation', // Webpack compilation hook (for example PurgeCss webpack plugin use 'compilation' )
  });
  webpackPlugins.push(fontMinPlugin);
}

module.exports = {
   runtimeCompiler: true,
   configureWebpack: {
    plugins: webpackPlugins,
    devtool: false,
    mode: 'production',
  },
};
```

Obviously the required dependencies must be added in package.json
#### **`package.json`**
```json
"devDependencies": {
…
    "fontmin-webpack": "^4.0.0",
    "glob-all": "^3.3.0",
    "purgecss-webpack-plugin": "^4.1.3",
    "webpack": "^5.71.0",
…
}
```

#### Save Bytes

**Before**

```
674f50d287a8c48dc19ba404d20fe713.eot     166 kB          [emitted]
912ec66d7572ff821749319396470bde.svg     444 kB          [emitted]  [big]
b06871f281fee6b241d60582ae9369b9.ttf     166 kB          [emitted]
af7ae505a9eed503f8b8e6982036873e.woff2  77.2 kB          [emitted]
fee66e712a8a08eef5805a46892932ad.woff     98 kB          [emitted]
```

**After**

```
674f50d287a8c48dc19ba404d20fe713.eot    2.82 kB          [emitted]
912ec66d7572ff821749319396470bde.svg    2.88 kB          [emitted]
b06871f281fee6b241d60582ae9369b9.ttf    2.64 kB          [emitted]
af7ae505a9eed503f8b8e6982036873e.woff2  1.01 kB          [emitted]
fee66e712a8a08eef5805a46892932ad.woff   2.72 kB          [emitted]
```

## Limitations

- Fonts must be loaded with `file-loader`
- Fonts must have the same name as the TrueType version of the font.
- Font file names are not changed by different used glyph sets ([See #8](https://github.com/patrickhulce/fontmin-webpack/issues/8))
