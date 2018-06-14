"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validate_npm_package_name_1 = __importDefault(require("validate-npm-package-name"));
const path_1 = require("path");
const resolve_1 = require("./resolve");
const app = express_1.default();
let INDEX = path_1.join(__dirname, '..', 'index.html');
app.get('/', function (req, res) {
    res.sendFile(INDEX);
});
app.get('/:pkgSpec', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let { name, version } = parseSpec(req.params.pkgSpec);
    if (notValidPkgName(name)) {
        res.status(500).send(`"${name}" is not a valid package name\n`);
        return;
    }
    resolve_1.getDownloadSize(name, version)
        .then((resolved) => {
        res.status(200).send(resolved);
    })
        .catch((err) => {
        if (err.code === 'ETARGET') {
            res.status(404).send(`${err.message}, possible versions are ${err.versions.join(', ')}.`);
            return;
        }
        else if (err.response && err.response.status === 404) {
            res.status(404).send(`"${name}" not found\n`);
            return;
        }
        res.status(500).send('500 Server Error\n');
        console.error(err);
    });
});
function parseSpec(spec) {
    let name, version;
    let firstAt = spec.indexOf('@');
    let lastAt = spec.lastIndexOf('@');
    if (firstAt !== lastAt || lastAt !== 0) {
        name = spec.substring(0, lastAt);
        version = spec.substring(lastAt + 1);
    }
    else {
        name = spec;
        version = undefined;
    }
    return { name, version };
}
function notValidPkgName(pkg) {
    let r = validate_npm_package_name_1.default(pkg);
    return !r.validForNewPackages && !r.validForOldPackages;
}
module.exports = app;
exports.default = app;
//# sourceMappingURL=index.js.map