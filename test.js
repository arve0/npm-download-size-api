"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const agents_1 = __importDefault(require("./v2/agents"));
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const index_1 = __importDefault(require("./v2/index"));
const http_1 = __importDefault(require("http"));
let getDownloadSize;
describe('getDownloadSize', () => {
    let server;
    before(function () {
        rm('tarballs.json');
        rm('pkgSizes.json');
        server = index_1.default.listen(3333);
        // import after deleting cache, as importing will read cache to memory
        return Promise.resolve().then(() => __importStar(require('./v2/resolve'))).then((m) => {
            getDownloadSize = m.getDownloadSize;
        });
    });
    after(async function () {
        server.close();
        let pool = await agents_1.default;
        await pool.drain();
    });
    it('resolves chalk 2.4.1', async function () {
        this.timeout(3 * 1000);
        let chalk = await getDownloadSize('chalk', '2.4.1');
        assert_1.default(chalk.version, '2.4.1');
        assert_1.default.equal(chalk.tarballSize, 9918);
        assert_1.default(Math.abs(chalk.size - 32978) < 2048, 'package size not within 2kB of last resolve');
        assert_1.default.equal(chalk.totalDependencies, 6);
        assert_1.default.equal(chalk.dependencies.length, 3);
    });
    it('resolves parcel in 10 seconds', async function () {
        this.timeout(10 * 1000);
        let parcel = await getDownloadSize('parcel');
        assert_1.default(parcel.size > 9 * 1024 * 1024, "total size is at least 9 MB");
    });
    it('caches parcel and responds within 20 ms', async function () {
        this.timeout(20);
        await getDownloadSize('parcel');
    });
    it('accepts package version', async function () {
        let version = '1.0.0';
        let spec = `async@${version}`;
        let pkg = await getJSON(`http://localhost:3333/${spec}`);
        assert_1.default.equal(pkg.version, version);
    });
    it('accepts range version', async function () {
        let version = '^1.0.0';
        let resolvesTo = '1.5.2';
        let spec = `async@${version}`;
        let pkg = await getJSON(`http://localhost:3333/${spec}`);
        assert_1.default.equal(pkg.version, resolvesTo);
    });
});
function rm(filename) {
    try {
        fs_1.unlinkSync(filename);
    }
    catch (_a) { }
}
function getJSON(url) {
    return new Promise((resolve, reject) => {
        http_1.default.get(url, res => {
            if (res.statusCode !== 200) {
                return reject(`Got status ${res.statusCode}`);
            }
            let data = "";
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    let pkg = JSON.parse(data);
                    resolve(pkg);
                }
                catch (_a) {
                    reject('Unable to parse JSON');
                }
            });
        });
    });
}
//# sourceMappingURL=test.js.map