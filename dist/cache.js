"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// @ts-ignore: declare own types on promisified stores
const nedb_1 = __importDefault(require("nedb"));
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const folder = 'storage';
// if (!fs.existsSync(folder)) {
//   fs.mkdirSync(folder)
// }
const hrefSizeDB = new nedb_1.default({
    filename: path_1.default.join(folder, 'hrefSizes.json'),
    autoload: true
});
const tarballDB = new nedb_1.default({
    filename: path_1.default.join(folder, 'tarballs.json'),
    autoload: true
});
const pkgSizeDB = new nedb_1.default({
    filename: path_1.default.join(folder, 'pkgSizes.json'),
    autoload: true
});
const hrefSizes = StoreFactory(hrefSizeDB);
const tarballs = StoreFactory(tarballDB);
const pkgSizes = StoreFactory(pkgSizeDB);
function StoreFactory(db) {
    return {
        // we need to bind nedb to preserve `this`
        findOne: util_1.promisify(db.findOne).bind(db),
        insert: util_1.promisify(db.insert).bind(db),
    };
}
module.exports = { hrefSizes, tarballs, pkgSizes };
