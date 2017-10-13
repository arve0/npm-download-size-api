const NeDB = require('nedb-promise')

const store = new NeDB({
  filename: 'store.json',
  autoload: true
})
exports.store = store
