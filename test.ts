import agents from './v2/agents'
import assert from 'assert'
import { unlinkSync } from 'fs'

let getDownloadSize: (name: string, wanted?: string) => Promise<PkgDownloadSize>

describe('getDownloadSize', () => {
    before(function () {
        try {
            unlinkSync('tarballs.json')
        } catch { }
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
        assert.equal(chalk.size, 32978)
        assert.equal(chalk.totalDependencies, 6)
        assert.equal(chalk.dependencies.length, 3)
    })

    it('resolves poi in 20 seconds', async function () {
        this.timeout(20 * 1000)

        let poi = await getDownloadSize('poi')
        assert(poi.size > 15 * 1024 * 1024, "total size is at least 15 MB")
    })
})
