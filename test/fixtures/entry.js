require('./entry.css')

const classes = {
  'fa-table': true,
  'fa-address-book': true,
  'my-later-file': true
}

function later() {
  require.ensure(['./later.css'], () => console.log('loaded!'))
}

console.log(classes)
