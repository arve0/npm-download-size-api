"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agents_1 = __importDefault(require("./agents"));
const assert_1 = __importDefault(require("assert"));
const fs_1 = require("fs");
const index_1 = __importDefault(require("./index"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const resolve_1 = require("./resolve");
describe('getDownloadSize', () => {
    let server;
    before(function () {
        server = index_1.default.listen(3333);
    });
    after(async function () {
        server.close();
        let pool = await agents_1.default;
        await pool.drain();
        rm(path_1.default.join('storage', 'cache.sqlite3'));
    });
    it('resolves chalk 2.4.1', async function () {
        this.timeout(3 * 1000);
        let chalk = await resolve_1.getDownloadSize('chalk', '2.4.1');
        assert_1.default(chalk.version, '2.4.1');
        assert_1.default.equal(chalk.tarballSize, 9918);
        assert_1.default(Math.abs(chalk.size - 32978) < 2048, 'package size not within 2kB of last resolve');
        assert_1.default.equal(chalk.totalDependencies, 6);
        assert_1.default.equal(chalk.dependencies.length, 3);
    });
    it('accepts http get requests', async function () {
        let name = 'chalk';
        let pkg = await getJSON(`http://localhost:3333/${name}`);
        assert_1.default.equal(pkg.name, name);
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
    it('gives 404 for invalid versions @asdf', async function () {
        let version = 'asdf';
        let spec = `async@${version}`;
        try {
            await getJSON(`http://localhost:3333/${spec}`);
            assert_1.default(false, `request for ${spec} did not fail`);
        }
        catch (msg) {
            assert_1.default(msg.match("^404: No matching version found for async@asdf") !== null);
        }
    });
    it('supports namespaced packages @feathersjs/feathers', async function () {
        let spec = '@feathersjs/feathers';
        let pkg = await getJSON(`http://localhost:3333/${spec.replace('/', '%2f')}`);
        assert_1.default.equal(pkg.name, spec);
    });
    it('supports namespaced packages with version @feathersjs/feathers@3', async function () {
        let name = '@feathersjs/feathers';
        let version = '@3';
        let spec = (name + version);
        let pkg = await getJSON(`http://localhost:3333/${spec.replace('/', '%2f')}`);
        assert_1.default.equal(pkg.name, name);
        assert_1.default.equal(pkg.version.indexOf('3.'), 0);
    });
    let parcelPromise;
    it('should not block cheap requests alongside expensive requests', async function () {
        this.timeout(500);
        parcelPromise = resolve_1.getDownloadSize('parcel');
        console.time('cheap-request');
        await getJSON(`http://localhost:3333/download-size`);
        console.timeEnd('cheap-request');
    });
    it('should resolve cached requests within 20 ms alongside expensive requests', async function () {
        this.timeout(50);
        console.time('cached-request');
        await getJSON(`http://localhost:3333/chalk@2.4.1`);
        console.timeEnd('cached-request');
    });
    it('resolve parcel within 10 seconds then have it cached', async function () {
        this.timeout(10 * 1000 + 20);
        await parcelPromise;
        const start = Date.now();
        await resolve_1.getDownloadSize('parcel');
        const time = Date.now() - start;
        assert_1.default(time <= 20, `cached time was ${time}`);
    });
});
function rm(filename) {
    try {
        fs_1.unlinkSync(filename);
    }
    catch (_error) { /* noop */ }
}
function getJSON(url) {
    return new Promise((resolve, reject) => {
        http_1.default.get(url, res => {
            let data = "";
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(`${res.statusCode}: ${data}`);
                }
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
