// @ts-ignore: declare own types on promisified stores
import NeDB from 'nedb'
import { promisify } from 'util'

const hrefStore = new NeDB({
  filename: 'hrefSizes.json',
  autoload: true
})

const tarballsStore = new NeDB({
  filename: 'pkgSizes.json',
  autoload: true
})

const hrefSizes: Store<HrefDownloadSize> = {
  // we need to bind nedb to preserve this
  findOne: promisify(hrefStore.findOne).bind(hrefStore),
  insert: promisify(hrefStore.insert).bind(hrefStore),
}

const tarballs: Store<CacheTarballs> = {
  findOne: promisify(tarballsStore.findOne).bind(tarballsStore),
  insert: promisify(tarballsStore.insert).bind(tarballsStore),
}

export = { hrefSizes, tarballs }
