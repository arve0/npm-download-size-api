import { getDownloadSize } from './resolve'
import server from './'
import http from 'http'
import assert from 'assert'

main()

async function main () {
  let version = 'asdf'
  let spec = `async@${version}`

  server.listen(3333, () => {
      http.get(`http://localhost:3333/${spec}`, res => {
          assert.equal(res.statusCode, 200)

          let data = ""
          res.on('data', chunk => {
              data += chunk
          })

          res.on('end', () => {
              let pkg = JSON.parse(data)
              assert.equal(pkg.version, version)
          })

      })
  })
  // try {
  //   let pkg = await getDownloadSize(process.argv[2] || 'webpack')
  //   printJSON(pkg)
  // } catch (error) {
  //   printError(error)
  // }
}

function printError (err: {}) {
  console.error('---- error ----')
  console.error(err)
}

function printJSON (obj: {}) {
  console.log('---- printing ----')
  console.log(JSON.stringify(obj, null, 2))
}