require('./entry.css')
require('./not-a-font.svg')

const classes = {
  'fa-table': true,
  'fa-address-book': true,
  'my-later-file': true,
  'my-compressed-css': true,
  'my-other-compressed-css': true,
}

function later() {
  require.ensure(['./later.css'], () => console.log('loaded!'))
}

console.log(classes)
setTimeout(later, 1000)
