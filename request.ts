import { request } from 'https'
import url from 'url'
import util from 'util'
import { ClientResponse, Agent } from 'http';

function getHrefSize (href: string, agent: Agent, retry = false): Promise<number> {
  let hrefParsed = url.parse(href)
  let options = {
    method: 'HEAD',
    hostname: hrefParsed.hostname,
    path: hrefParsed.path,
    agent: agent,
  }

  return new Promise((resolve, reject) => {
    const req = request(options)
    req.end()

    req.on('error', (error) => {
      if (retry) {
        reject(new Error(`Unable to get ${href}: ${error}`))
      } else {
        // retry once on errors like ECONNRESET
        resolve(getHrefSize(href, agent, true))
      }
    })

    req.on('response', (response: ClientResponse) => {
      if (response.statusCode === 302 && response.headers['location']) {
        // @ts-ignore: redirect -> recurse
        href = response.headers['location']
        resolve(getHrefSize(href, agent))
      } else if (response.statusCode === 429) {
        if (retry) {
          reject(new Error(`Got status "429 too many request" twice for ${href}.`))
          return
        }
        let wait = 100 + 400 * Math.random();
        console.warn(`Got 429 too many request for ${href}, waiting ${wait} ms.`)
        setTimeout(() => resolve(getHrefSize(href, agent, true)), wait)
      } else if (response.statusCode !== 200) {
        reject(new Error(`Got status code ${response.statusCode} for request ${util.inspect(options)}.`))
      } else {
        let size = parseInt(response.headers['content-length'] || '')

        if (typeof size !== 'number' || !isFinite(size)) {
            reject(new Error(`Unable to parse content-length ${response.headers['content-length']} of ${href}`))
        } else {
          resolve(size)
        }
      }
    })
  })
}

export = getHrefSize
