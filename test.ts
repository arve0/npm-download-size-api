import agents from './v2/agents'
import assert from 'assert'
import { unlinkSync } from 'fs'

let getDownloadSize: (name: string, wanted?: string) => Promise<PkgDownloadSize>

describe('getDownloadSize', () => {
    before(function () {
        rm('tarballs.json')
        rm('pkgSizes.json')

        // import after deleting cache, as importing will read cache to memory
        return import('./v2/resolve').then((m) => {
            getDownloadSize = m.getDownloadSize
        })
    })

    after(async function () {
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
})

function rm (filename: string) {
    try {
        unlinkSync(filename)
    } catch { }
}
