let resolve = require('./resolve')
let inspect = require('util').inspect
let request = require('./request')

resolve(process.argv[2] || 'webpack')
.then(res => {
  console.log(JSON.stringify(res, null, 2))
})
.catch(err => {
  console.error(err.stack)
})

setTimeout(() => {
  resolve(process.argv[2] || 'async')
  .then(res => {
    console.log(JSON.stringify(res, null, 2))
  })
  .catch(err => {
    console.error(err.stack)
  })
}, 1000)
