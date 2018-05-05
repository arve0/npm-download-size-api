let resolve = require('./resolve')
let inspect = require('util').inspect
let request = require('./request')

resolve(process.argv[2] || 'webpack')
  .then(res => console.log(inspect(res, false, null)))
  .catch(err => console.error(err))
