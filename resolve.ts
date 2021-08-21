/**
 * Resolves dependencies of npm packages.
 */
import pacote from 'pacote'
import prefix from 'si-prefix'
import getHrefSize from './request'
import cache from './cache'
import agents from './agents'
import { Agent } from 'https'
import path from 'path'
import LRU from 'lru-cache'

export async function getDownloadSize (name: string, wanted = 'latest'): Promise<PkgDownloadSize> {
    let { version, dependencies: deps } = await getManifest(name, wanted)

    let downloadSizeCache = await cache.pkgSizes.findOne({ name, version })
    if (downloadSizeCache !== null)  {
        return downloadSizeCache
    }

    let pool = await agents
    let agent = await pool.get()

    let dependencies = await Promise.all(
        deps.map(([name, wanted]) => getDownloadSizeSimple(name, wanted, agent))
    )
    let pkg = await getDownloadSizeSimple(name, wanted, agent)

    pool.put(agent)

    cache.pkgSizes.insert({ ...pkg, dependencies })

    return { ...pkg, dependencies }
}

let pacoteOptions = {
    cache: path.join(process.env.APPDATA || process.env.HOME || path.resolve('~'), '.npm', '_cacache'),
    memoize: LRU({
        // @ts-ignore
        length: m => m._contentLength,
        max: 200 * 1024 * 1024, // 200 MB
        maxAge: 10 * 60 * 1000 // 10 minutes
    })
}

async function getManifest (name: string, wanted: string): Promise<Manifest> {
    let { version, dependencies, _resolved: tarball } = await pacote.manifest(spec(name, wanted), pacoteOptions)

    return { name, version, dependencies: Object.entries(dependencies || {}), tarball }
}

function spec (name: string, wanted: string) {
    return `${name}@${wanted}`
}

export async function getDownloadSizeSimple (name: string, wanted: string, agent: Agent): Promise<PkgDownloadSizeSimple> {
    let { version, tarball } = await getManifest(name, wanted)

    let tarballSize, tarballs
    let pkgCache = await cache.tarballs.findOne({ name, version })

    if (pkgCache !== null) {
        tarballs = new Map(pkgCache.tarballs)
    } else {
        tarballs = await getAllTarballs(name, version)
        cache.tarballs.insert({ name, version, tarballs: Array.from(tarballs.entries()) })
    }

    tarballSize = await getTarballSize(tarball, agent)
    let totalDependencies = tarballs.size - 1 // minus me
    let size = await getTotalSize(tarballs.values(), agent)
    let prettySize = pretty(size)

    return { name, wanted, version, tarballSize, totalDependencies, size, prettySize }
}

async function getAllTarballs (name: string, wanted: string): Promise<Map<string, string>> {
    let tarballs: Map<string, string> = new Map()

    let queue: Map<string, Promise<Manifest>> = new Map()
    queue.set(spec(name, wanted), getManifest(name, wanted))

    for (let [spec_, manifestPromise] of queue) {
        let { name, version, tarball, dependencies } = await manifestPromise

        tarballs.set(spec_, tarball)
        tarballs.set(spec(name, version), tarball)

        dependencies.forEach(([name, wanted]) => {
            if (!tarballs.has(spec(name, wanted))) {
                queue.set(spec(name, wanted), getManifest(name, wanted))
            }
        })
    }

    return getResolvedTarballs(tarballs)
}

/**
 * Only get tarballs with spec x.x.x, not ^x.x.x or other ranges.
 * @param tarballs
 */
function getResolvedTarballs (tarballs: Map<string, string>) {
    return new Map(
        Array.from(tarballs)
            .filter(
                ([spec, _]) => isNotRange(spec)
            )
    )
}

function isNotRange (spec: string): boolean {
    let i = spec.lastIndexOf('@')
    let version = spec.substr(i + 1)
    return !isRange(version)
}

function isRange (version: string): boolean {
    let match = version.match(/^\d+\.\d+\.\d+-?[^ ]*$/)
    return match === null
}

async function getTotalSize (urls: IterableIterator<string>, agent: Agent): Promise<number> {
    let promises = []

    for (let url of urls) {
        promises.push(getTarballSize(url, agent))
    }

    let sizes = await Promise.all(promises)

    return sizes.reduce((sum, n) => sum + n, 0)
}

async function getTarballSize (href: string, agent: Agent): Promise<number> {
    let cacheSize = cache.hrefSizes.find(href)
    if (cacheSize) {
        return cacheSize.size
    }

    const size = await getHrefSize(href, agent)
    cache.hrefSizes.insert({ href, size })

    return size
}

function pretty (size: number): string {
    if (size === 0) {
        // avoid NaN, https://github.com/mal/si-prefix/issues/1
        return '0 B'
    }
    let [prettySize, postFix] = prefix.byte.convert(size)
    return prettySize.toFixed(2) + ' ' + postFix
}
