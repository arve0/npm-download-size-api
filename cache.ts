// @ts-ignore: declare own types on promisified stores
import fs from 'fs'
import path from 'path'
import Database, { Database as SqliteDatabase } from 'better-sqlite3'

const folder = 'storage'
const dbFilename = path.join(folder, 'cache.sqlite3')

if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder)
}

const db = new Database(dbFilename)

const HREF_SIZE = 'href_size'
db.prepare(`CREATE TABLE IF NOT EXISTS ${HREF_SIZE} (href text, size integer)`).run()

const hrefSizes = {
  find: function (href: string): undefined | { size: number } {
    return db.prepare(`SELECT size FROM ${HREF_SIZE} WHERE href = ?`).get(href)
  },
  insert: function (hrefSize: HrefDownloadSize) {
    db.prepare(`INSERT OR REPLACE INTO ${HREF_SIZE} (href, size) VALUES (?, ?)`)
      .run(hrefSize.href, hrefSize.size)
  }
}

const TARBALL = 'tarball'
db.prepare(`CREATE TABLE IF NOT EXISTS ${TARBALL} (name text, version text, tarballs text)`).run()

const tarballs = {
  find: function (name: string, version: string): undefined | [string, string][] {
    const result = db.prepare(`SELECT tarballs FROM ${TARBALL} WHERE name = ? AND version = ?`)
      .get(name, version)

    if (result === undefined) {
      return undefined
    }

    return JSON.parse(result.tarballs)
  },
  insert: function ({ name, version, tarballs }: CacheTarballs) {
    db.prepare(`INSERT OR REPLACE INTO ${TARBALL} (name, version, tarballs) VALUES (?, ?, ?)`)
      .run(name, version, JSON.stringify(tarballs))
  }
}

const PACKAGE_SIZE = 'package_size'
db.prepare(`
  CREATE TABLE IF NOT EXISTS ${PACKAGE_SIZE}
  (
    name text,
    version text,
    tarballSize integer,
    totalDependencies integer,
    size integer,
    prettySize text,
    dependencies text
  )
`).run()

const pkgSizes = {
  find: function (name: string, version: string): undefined | PkgDownloadSize {
    const result = db.prepare(`
      SELECT tarballSize, totalDependencies, size, prettySize, dependencies FROM ${PACKAGE_SIZE} WHERE name = ? AND version = ?
    `).get(name, version)

    if (result === undefined) {
      return undefined
    }

    return {
      name,
      version,
      wanted: '',
      tarballSize: result.tarballSize,
      totalDependencies: result.totalDependencies,
      size: result.size,
      prettySize: result.prettySize,
      dependencies: JSON.parse(result.dependencies)
    }
  },
  insert: function ({ name, version, tarballSize,  totalDependencies,  size,  prettySize,  dependencies }: PkgDownloadSize) {
    db.prepare(`
      INSERT OR REPLACE INTO ${PACKAGE_SIZE}
        (name, version, tarballSize,  totalDependencies,  size,  prettySize,  dependencies)
        VALUES
        (?, ?, ?, ?, ?, ?, ?)
    `).run(name, version, tarballSize,  totalDependencies,  size,  prettySize,  JSON.stringify(dependencies))
  }
}

export = { hrefSizes, tarballs, pkgSizes }
