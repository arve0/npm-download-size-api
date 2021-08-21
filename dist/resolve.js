"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Resolves dependencies of npm packages.
 */
const pacote_1 = __importDefault(require("pacote"));
const si_prefix_1 = __importDefault(require("si-prefix"));
const request_1 = __importDefault(require("./request"));
const cache_1 = __importDefault(require("./cache"));
const agents_1 = __importDefault(require("./agents"));
const path_1 = __importDefault(require("path"));
const lru_cache_1 = __importDefault(require("lru-cache"));
async function getDownloadSize(name, wanted = 'latest') {
    let { version, dependencies: deps } = await getManifest(name, wanted);
    let downloadSizeCache = cache_1.default.pkgSizes.find(name, version);
    if (downloadSizeCache !== undefined) {
        // use wanted from request, not db
        return Object.assign({}, downloadSizeCache, { wanted });
    }
    let pool = await agents_1.default;
    let agent = await pool.get();
    let dependencies = await Promise.all(deps.map(([name, wanted]) => getDownloadSizeSimple(name, wanted, agent)));
    let pkg = await getDownloadSizeSimple(name, wanted, agent);
    pool.put(agent);
    cache_1.default.pkgSizes.insert(Object.assign({}, pkg, { dependencies }));
    return Object.assign({}, pkg, { dependencies });
}
exports.getDownloadSize = getDownloadSize;
let pacoteOptions = {
    cache: path_1.default.join(process.env.APPDATA || process.env.HOME || path_1.default.resolve('~'), '.npm', '_cacache'),
    memoize: lru_cache_1.default({
        // @ts-ignore
        length: m => m._contentLength,
        max: 200 * 1024 * 1024,
        maxAge: 10 * 60 * 1000 // 10 minutes
    })
};
async function getManifest(name, wanted) {
    let { version, dependencies, _resolved: tarball } = await pacote_1.default.manifest(spec(name, wanted), pacoteOptions);
    return { name, version, dependencies: Object.entries(dependencies || {}), tarball };
}
function spec(name, wanted) {
    return `${name}@${wanted}`;
}
async function getDownloadSizeSimple(name, wanted, agent) {
    let { version, tarball } = await getManifest(name, wanted);
    let tarballSize, tarballs;
    let tarballsCached = cache_1.default.tarballs.find(name, version);
    if (tarballsCached !== undefined) {
        tarballs = new Map(tarballsCached);
    }
    else {
        tarballs = await getAllTarballs(name, version);
        cache_1.default.tarballs.insert({ name, version, tarballs: Array.from(tarballs.entries()) });
    }
    tarballSize = await getTarballSize(tarball, agent);
    let totalDependencies = tarballs.size - 1; // minus me
    let size = await getTotalSize(tarballs.values(), agent);
    let prettySize = pretty(size);
    return { name, wanted, version, tarballSize, totalDependencies, size, prettySize };
}
exports.getDownloadSizeSimple = getDownloadSizeSimple;
async function getAllTarballs(name, wanted) {
    let tarballs = new Map();
    let queue = new Map();
    queue.set(spec(name, wanted), getManifest(name, wanted));
    for (let [spec_, manifestPromise] of queue) {
        let { name, version, tarball, dependencies } = await manifestPromise;
        tarballs.set(spec_, tarball);
        tarballs.set(spec(name, version), tarball);
        dependencies.forEach(([name, wanted]) => {
            if (!tarballs.has(spec(name, wanted))) {
                queue.set(spec(name, wanted), getManifest(name, wanted));
            }
        });
    }
    return getResolvedTarballs(tarballs);
}
/**
 * Only get tarballs with spec x.x.x, not ^x.x.x or other ranges.
 * @param tarballs
 */
function getResolvedTarballs(tarballs) {
    return new Map(Array.from(tarballs)
        .filter(([spec, _]) => isNotRange(spec)));
}
function isNotRange(spec) {
    let i = spec.lastIndexOf('@');
    let version = spec.substr(i + 1);
    return !isRange(version);
}
function isRange(version) {
    let match = version.match(/^\d+\.\d+\.\d+-?[^ ]*$/);
    return match === null;
}
async function getTotalSize(urls, agent) {
    let promises = [];
    for (let url of urls) {
        promises.push(getTarballSize(url, agent));
    }
    let sizes = await Promise.all(promises);
    return sizes.reduce((sum, n) => sum + n, 0);
}
async function getTarballSize(href, agent) {
    let cacheSize = cache_1.default.hrefSizes.find(href);
    if (cacheSize) {
        return cacheSize.size;
    }
    const size = await request_1.default(href, agent);
    cache_1.default.hrefSizes.insert({ href, size });
    return size;
}
function pretty(size) {
    if (size === 0) {
        // avoid NaN, https://github.com/mal/si-prefix/issues/1
        return '0 B';
    }
    let [prettySize, postFix] = si_prefix_1.default.byte.convert(size);
    return prettySize.toFixed(2) + ' ' + postFix;
}
