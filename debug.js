let resolve = require('./resolve')
let inspect = require('util').inspect

resolve(process.argv[2] || 'fj')
  .then(res => console.log(inspect(res, false, null)))
  .catch(err => console.error(err))
