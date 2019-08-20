// @ts-ignore: declare own types on promisified stores
import NeDB from 'nedb'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const folder = 'storage'

// if (!fs.existsSync(folder)) {
//   fs.mkdirSync(folder)
// }

const hrefSizeDB = new NeDB({
  filename: path.join(folder, 'hrefSizes.json'),
  autoload: true
})

const tarballDB = new NeDB({
  filename: path.join(folder, 'tarballs.json'),
  autoload: true
})

const pkgSizeDB = new NeDB({
  filename: path.join(folder, 'pkgSizes.json'),
  autoload: true
})

const hrefSizes: Store<HrefDownloadSize> = StoreFactory(hrefSizeDB)
const tarballs: Store<CacheTarballs> = StoreFactory(tarballDB)
const pkgSizes: Store<PkgDownloadSize> = StoreFactory(pkgSizeDB)

function StoreFactory (db: any) {
  return {
    // we need to bind nedb to preserve `this`
    findOne: promisify(db.findOne).bind(db),
    insert: promisify(db.insert).bind(db),
  }
}

export = { hrefSizes, tarballs, pkgSizes }
