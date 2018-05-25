import { getDownloadSize } from './v2/resolve'
import assert from 'assert'

async function testAsync() {
    let async = await getDownloadSize('async', '2.6.0')

    assert(async.version, '2.6.0')
    assert.equal(async.tarballSize, 123240)
    assert.equal(async.size, 428908)
    assert.equal(async.totalDependencies, 1)
    assert.equal(async.dependencies.length, 1)
}

async function testPoi() {
    let poi = await getDownloadSize('poi', '10.0.0')

    assert(poi.version, '10.0.0')
    assert.equal(poi.tarballSize, 10536)
    assert.equal(poi.size, 16090378)
    assert.equal(poi.totalDependencies, 960)
    assert.equal(poi.dependencies.length, 23)
}

let tests = [testAsync(), testPoi()]

Promise.all(tests).catch(err => {
    console.error(err)
    process.exit(1)
})