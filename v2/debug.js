"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resolve_1 = require("./resolve");
async function main() {
    try {
        let pkg = await resolve_1.getDownloadSize(process.argv[2] || 'webpack');
        printJSON(pkg);
    }
    catch (error) {
        printError(error);
    }
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