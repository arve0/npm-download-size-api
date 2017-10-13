const express = require('express')
const validate = require('validate-npm-package-name')
const { join } = require('path')
const resolve = require('./resolve')

const app = express()

let INDEX = join(__dirname, 'index.html')

app.get('/', function (req, res) {
  res.sendFile(INDEX)
})

app.get('/:pkgName', function (req, res) {
  let pkgName = req.params.pkgName
  if (notValidPkgName(pkgName)) {
    res.status(500).send(`"${pkgName}" is not a valid package name\n`)
    return
  }
  resolve(pkgName)
    .then((resolved) => {
      res.status(200).send(resolved)
    })
    .catch((err) => {
      if (err.response && err.response.status === 404) {
        res.status(404).send(`"${pkgName}" not found\n`)
        return
      }
      res.status(500).send('500 Server Error\n')
      console.error(err)
    })
})

function notValidPkgName (pkg) {
  let r = validate(pkg)
  return !r.validForNewPackages && !r.validForOldPackages
}

module.exports = app
