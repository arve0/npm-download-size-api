import { getDownloadSize, getDownloadSizeSimple } from './resolve'
import { inspect } from 'util'

getDownloadSize(process.argv[2] || 'webpack')
  .then(printJSON)
  .catch(printError)

setTimeout(() => {
  getDownloadSize(process.argv[2] || 'async')
    .then(printJSON)
    .catch(printError)
}, 1000)

function printError (err) {
  console.error('---- error ----')
  console.error(err.stack)
}

function printJSON (obj) {
  console.log('---- printing ----')
  console.log(JSON.stringify(obj, null, 2))
}