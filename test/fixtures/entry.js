require('./entry.css')

function later() {
  require.ensure(['./later.css'], () => console.log('loaded!'))
}

console.log(classes)
setTimeout(later, 1000)
