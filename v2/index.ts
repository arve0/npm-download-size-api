import express from 'express'
import validate from 'validate-npm-package-name'
import { join } from 'path'
import { getDownloadSize } from './resolve'

const app = express()

let INDEX = join(__dirname, '..', 'index.html')

app.get('/', function (req, res) {
  res.sendFile(INDEX)
})

app.get('/:pkgSpec', function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  let pkgSpec: string[] = req.params.pkgSpec.split('@')
  let name = pkgSpec[0] || ""
  let version = pkgSpec[1]
  if (notValidPkgName(name)) {
    res.status(500).send(`"${name}" is not a valid package name\n`)
    return
  }
  getDownloadSize(name, version)
    .then((resolved) => {
      res.status(200).send(resolved)
    })
    .catch((err) => {
      if (err.response && err.response.status === 404) {
        res.status(404).send(`"${name}" not found\n`)
        return
      }
      res.status(500).send('500 Server Error\n')
      console.error(err)
    })
})

function notValidPkgName (pkg: string) {
  let r = validate(pkg)
  return !r.validForNewPackages && !r.validForOldPackages
}

module.exports = app
export default app