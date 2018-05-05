const https = require('https')
const url = require('url')
const util = require('util')
const pool = require('generic-pool')

const agentFactory = {
  create: () => new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSocket: 10,
    maxFreeSockets: 5
  }),
  destroy: (agent) => agent.destroy()
}

const agents = pool.createPool(agentFactory, {
  max: 10,
  min: 2
})

exports.head = function headRequest (options) {
  let hrefParsed = url.parse(options.href)
  options.method = 'HEAD'
  options.hostname = hrefParsed.hostname
  options.path = hrefParsed.path

  return new Promise((resolve, reject) => {
    agents.acquire().then((agent) => {
      options.agent = agent

      const req = https.request(options)
      req.end()

      req.on('error', reject)

      req.on('response', (response) => {
        if (response.statusCode === 302 && response.headers['location']) {
          // redirect -> recurse
          options.href = response.headers['location']
          resolve(headRequest(options))
          return
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Got status code ${response.statusCode} for request ${util.inspect(options)}.`))
        } else {
          resolve(response)
        }
      })
    }).catch((err) => {
      console.error(err)
      reject('Server out of resources, try again later.')
    })
  })
}
