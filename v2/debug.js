"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = __importDefault(require("./"));
const http_1 = __importDefault(require("http"));
const assert_1 = __importDefault(require("assert"));
main();
async function main() {
    let version = 'asdf';
    let spec = `async@${version}`;
    _1.default.listen(3333, () => {
        http_1.default.get(`http://localhost:3333/${spec}`, res => {
            assert_1.default.equal(res.statusCode, 200);
            let data = "";
            res.on('data', chunk => {
                data += chunk;
            });
            res.on('end', () => {
                let pkg = JSON.parse(data);
                assert_1.default.equal(pkg.version, version);
            });
        });
    });
    // try {
    //   let pkg = await getDownloadSize(process.argv[2] || 'webpack')
    //   printJSON(pkg)
    // } catch (error) {
    //   printError(error)
    // }
}
function printError(err) {
    console.error('---- error ----');
    console.error(err);
}
function printJSON(obj) {
    console.log('---- printing ----');
    console.log(JSON.stringify(obj, null, 2));
}
//# sourceMappingURL=debug.js.map