const https = require('https')
const url = require('url')
const util = require('util')
const Queue = require('p-queue')

let queue = new Queue({ concurrency: 10 })

exports.head = function headRequest (options) {
  let hrefParsed = url.parse(options.href)
  options.method = 'HEAD'
  options.hostname = hrefParsed.hostname
  options.path = hrefParsed.path
  return queue.add(() => new Promise((resolve, reject) => {
    const req = https.request(options)
    req.end()

    req.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Got status code ${response.statusCode} for request ${util.inspect(options)}.`))
      } else {
        resolve(response)
      }
    })
  }))
}
