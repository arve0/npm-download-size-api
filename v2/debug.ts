import { getDownloadSize, getDownloadSizeSimple } from './resolve'
import { inspect } from 'util'

async function main () {
  try {
    let pkg = await getDownloadSize(process.argv[2] || 'webpack')
    printJSON(pkg)
  } catch (error) {
    printError(error)
  }
}

function printError (err: {}) {
  console.error('---- error ----')
  console.error(err)
}

function printJSON (obj: {}) {
  console.log('---- printing ----')
  console.log(JSON.stringify(obj, null, 2))
}