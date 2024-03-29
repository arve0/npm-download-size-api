import agents from './agents'
import assert from 'assert'
import { unlinkSync } from 'fs'
import Server from './index'
import http from 'http'
import path from 'path'
import { getDownloadSize } from './resolve'

describe('getDownloadSize', () => {
    let server: http.Server

    before(function () {
        server = Server.listen(3333)
    })

    after(async function () {
        server.close()
        let pool = await agents
        await pool.drain()

        rm(path.join('storage', 'cache.sqlite3'))
    })

    it('resolves chalk 2.4.1', async function () {
        this.timeout(3 * 1000)
        let chalk = await getDownloadSize('chalk', '2.4.1')

        assert(chalk.version, '2.4.1')
        assert.equal(chalk.tarballSize, 9918)
        assert(Math.abs(chalk.size - 32978) < 2048, 'package size not within 2kB of last resolve')
        assert.equal(chalk.totalDependencies, 6)
        assert.equal(chalk.dependencies.length, 3)
    })

    it('accepts http get requests', async function () {
        let name = 'chalk'
        let pkg = await getJSON(`http://localhost:3333/${name}`)
        assert.equal(pkg.name, name)
    })

    it('accepts package version', async function () {
        let version = '1.0.0'
        let spec = `async@${version}`
        let pkg = await getJSON(`http://localhost:3333/${spec}`)
        assert.equal(pkg.version, version)
    })

    it('accepts range version', async function () {
        let version = '^1.0.0'
        let resolvesTo = '1.5.2'
        let spec = `async@${version}`
        let pkg = await getJSON(`http://localhost:3333/${spec}`)
        assert.equal(pkg.version, resolvesTo)
    })

    it('gives 404 for invalid versions @asdf', async function () {
        let version = 'asdf'
        let spec = `async@${version}`
        try {
            await getJSON(`http://localhost:3333/${spec}`)
            assert(false, `request for ${spec} did not fail`)
        } catch (msg) {
            assert(msg.match("^404: No matching version found for async@asdf") !== null)
        }
    })

    it('supports namespaced packages @feathersjs/feathers', async function () {
        let spec = '@feathersjs/feathers'
        let pkg = await getJSON(`http://localhost:3333/${spec.replace('/', '%2f')}`)
        assert.equal(pkg.name, spec)
    })

    it('supports namespaced packages with version @feathersjs/feathers@3', async function () {
        let name = '@feathersjs/feathers'
        let version = '@3'
        let spec = (name + version)
        let pkg = await getJSON(`http://localhost:3333/${spec.replace('/', '%2f')}`)
        assert.equal(pkg.name, name)
        assert.equal(pkg.version.indexOf('3.'), 0)
    })

    let parcelPromise: Promise<any>
    it('should not block cheap requests alongside expensive requests', async function () {
        this.timeout(500)

        parcelPromise = getDownloadSize('parcel')
        console.time('cheap-request')
        await getJSON(`http://localhost:3333/download-size`)
        console.timeEnd('cheap-request')
    })

    it('should resolve cached requests within 20 ms alongside expensive requests', async function () {
        this.timeout(50)
        console.time('cached-request')
        await getJSON(`http://localhost:3333/chalk@2.4.1`)
        console.timeEnd('cached-request')
    })

    it('resolve parcel within 10 seconds then have it cached', async function () {
        this.timeout(10 * 1000 + 20)

        await parcelPromise

        const start = Date.now()
        await getDownloadSize('parcel')
        const time = Date.now() - start
        assert(time <= 20, `cached time was ${time}`)
    })
})

function rm (filename: string) {
    try {
        unlinkSync(filename)
    } catch (_error) { /* noop */ }
}

function getJSON (url: string): Promise<PkgDownloadSize> {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = ""
            res.on('data', chunk => {
                data += chunk
            })

            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(`${res.statusCode}: ${data}`)
                }

                try {
                    let pkg = JSON.parse(data)
                    resolve(pkg)
                } catch {
                    reject('Unable to parse JSON')
                }
            })
        })
    })
}
