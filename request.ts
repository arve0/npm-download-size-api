import https from 'https'
import url from 'url'
import util from 'util'
import { ClientRequest, ClientResponse } from 'http';

interface Options extends https.RequestOptions {
  href: string,
  agent: https.Agent
}

function getHrefSize (options: Options, retry = false): Promise<number> {
  let hrefParsed = url.parse(options.href)
  options.method = 'HEAD'
  options.hostname = hrefParsed.hostname
  options.path = hrefParsed.path

  return new Promise((resolve, reject) => {
    const req = https.request(options)
    req.end()

    req.on('error', (error) => {
      if (retry) {
        reject(new Error(`Unable to get ${options.href}: ${error}`))
      } else {
        // retry once on errors like ECONNRESET
        resolve(getHrefSize(options, true))
      }
    })

    req.on('response', (response: ClientResponse) => {
      if (response.statusCode === 302 && response.headers['location']) {
        // @ts-ignore: redirect -> recurse
        options.href = response.headers['location']
        resolve(getHrefSize(options))
      } else if (response.statusCode === 429) {
        if (retry) {
          reject(new Error(`Got status "429 too many request" twice for ${options.href}.`))
          return
        }
        let wait = 100 + 400 * Math.random();
        console.warn(`Got 429 too many request for ${options.href}, waiting ${wait} ms.`)
        setTimeout(() => resolve(getHrefSize(options, true)), wait)
      } else if (response.statusCode !== 200) {
        reject(new Error(`Got status code ${response.statusCode} for request ${util.inspect(options)}.`))
      } else {
        let size = parseInt(response.headers['content-length'] || '')

        if (typeof size !== 'number' || !isFinite(size)) {
            reject(new Error(`Unable to parse content-length ${response.headers['content-length']} of ${options.href}`))
        } else {
          resolve(size)
        }
      }
    })
  })
}

export = getHrefSize