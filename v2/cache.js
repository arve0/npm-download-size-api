"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// @ts-ignore: declare own types on promisified stores
const nedb_1 = __importDefault(require("nedb"));
const util_1 = require("util");
const hrefStore = new nedb_1.default({
    filename: 'hrefSizes.json',
    autoload: true
});
const tarballsStore = new nedb_1.default({
    filename: 'tarballs.json',
    autoload: true
});
const hrefSizes = {
    // we need to bind nedb to preserve this
    findOne: util_1.promisify(hrefStore.findOne).bind(hrefStore),
    insert: util_1.promisify(hrefStore.insert).bind(hrefStore),
};
const tarballs = {
    findOne: util_1.promisify(tarballsStore.findOne).bind(tarballsStore),
    insert: util_1.promisify(tarballsStore.insert).bind(tarballsStore),
};
module.exports = { hrefSizes, tarballs };
//# sourceMappingURL=cache.js.map