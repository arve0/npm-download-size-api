"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
// @ts-ignore: declare own types on promisified stores
const nedb_1 = __importDefault(require("nedb"));
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const folder = 'storage';
const dbFilename = path_1.default.join(folder, 'cache.sqlite3');
if (!fs_1.default.existsSync(folder)) {
    fs_1.default.mkdirSync(folder);
}
const db = new better_sqlite3_1.default(dbFilename);
// initial db setup
const HREF_SIZE = 'href_size';
db.prepare(`CREATE TABLE IF NOT EXISTS ${HREF_SIZE} (href text, size integer)`).run();
const tarballDB = new nedb_1.default({
    filename: path_1.default.join(folder, 'tarballs.json'),
    autoload: true
});
const pkgSizeDB = new nedb_1.default({
    filename: path_1.default.join(folder, 'pkgSizes.json'),
    autoload: true
});
const hrefSizes = {
    find: function (href) {
        return db.prepare(`SELECT size FROM ${HREF_SIZE} WHERE href = ?`).get(href);
    },
    insert: function (hrefSize) {
        db.prepare(`INSERT OR REPLACE INTO ${HREF_SIZE} (href, size) VALUES (?, ?)`)
            .run(hrefSize.href, hrefSize.size);
    }
};
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
