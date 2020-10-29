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
    }),
  ],
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
