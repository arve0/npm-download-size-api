import agents from './v2/agents'
import assert from 'assert'
import { unlinkSync } from 'fs'
import Server from './v2/index'
import http from 'http'
import { error } from 'util';

let getDownloadSize: (name: string, wanted?: string) => Promise<PkgDownloadSize>

describe('getDownloadSize', () => {
    let server: http.Server

    before(function () {
        rm('tarballs.json')
        rm('pkgSizes.json')

        server = Server.listen(3333)

        // import after deleting cache, as importing will read cache to memory
        return import('./v2/resolve').then((m) => {
            getDownloadSize = m.getDownloadSize
        })
    })

    after(async function () {
        server.close()
        let pool = await agents
        await pool.drain()
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

    it('resolves parcel in 10 seconds', async function () {
        this.timeout(10 * 1000)

        let parcel = await getDownloadSize('parcel')
        assert(parcel.size > 9 * 1024 * 1024, "total size is at least 9 MB")
    })

    it('caches parcel and responds within 20 ms', async function () {
        this.timeout(20)
        await getDownloadSize('parcel')
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

    it('shall give 404 when version is invalid', async function () {
        let version = 'asdf'
        let spec = `async@${version}`
        try {
            await getJSON(`http://localhost:3333/${spec}`)
            assert(false, `request for ${spec} did not fail`)
        } catch (msg) {
            assert(msg.match("^404: No matching version found for async@asdf") !== null)
        }
    })
})

function rm (filename: string) {
    try {
        unlinkSync(filename)
    } catch { }
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