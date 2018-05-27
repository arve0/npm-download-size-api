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
        try {
            fs_1.unlinkSync('tarballs.json');
        }
        catch (_a) { }
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
        assert_1.default.equal(chalk.size, 32978);
        assert_1.default.equal(chalk.totalDependencies, 6);
        assert_1.default.equal(chalk.dependencies.length, 3);
    });
    it('resolves poi in 20 seconds', async function () {
        this.timeout(20 * 1000);
        let poi = await getDownloadSize('poi');
        assert_1.default(poi.size > 15 * 1024 * 1024, "total size is at least 15 MB");
    });
});
//# sourceMappingURL=test.js.map