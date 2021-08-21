// @ts-ignore: declare own types on promisified stores
import NeDB from 'nedb'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import Database, { Database as SqliteDatabase } from 'better-sqlite3'

const folder = 'storage'
const dbFilename = path.join(folder, 'cache.sqlite3')

if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder)
}

const db = new Database(dbFilename)

// initial db setup
const HREF_SIZE = 'href_size'
db.prepare(`CREATE TABLE IF NOT EXISTS ${HREF_SIZE} (href text, size integer)`).run()
const TARBALL = 'tarball'
db.prepare(`CREATE TABLE IF NOT EXISTS ${TARBALL} (name text, version text, tarballs text)`).run()

const pkgSizeDB = new NeDB({
  filename: path.join(folder, 'pkgSizes.json'),
  autoload: true
})

const hrefSizes = {
  find: function (href: string): undefined | { size: number } {
    return db.prepare(`SELECT size FROM ${HREF_SIZE} WHERE href = ?`).get(href)
  },
  insert: function (hrefSize: HrefDownloadSize) {
    db.prepare(`INSERT OR REPLACE INTO ${HREF_SIZE} (href, size) VALUES (?, ?)`)
      .run(hrefSize.href, hrefSize.size)
  }
}

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

const pkgSizes: Store<PkgDownloadSize> = StoreFactory(pkgSizeDB)

function StoreFactory (db: any) {
  return {
    // we need to bind nedb to preserve `this`
    findOne: promisify(db.findOne).bind(db),
    insert: promisify(db.insert).bind(db),
  }
}

export = { hrefSizes, tarballs, pkgSizes }
