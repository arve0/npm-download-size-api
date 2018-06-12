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
let getDownloadSize;
describe('getDownloadSize', () => {
    before(function () {
        rm('tarballs.json');
        rm('pkgSizes.json');
        // import after deleting cache, as importing will read cache to memory
        return Promise.resolve().then(() => __importStar(require('./v2/resolve'))).then((m) => {
            getDownloadSize = m.getDownloadSize;
        });
    });
    after(async function () {
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
});
function rm(filename) {
    try {
        fs_1.unlinkSync(filename);
    }
    catch (_a) { }
}
//# sourceMappingURL=test.js.map