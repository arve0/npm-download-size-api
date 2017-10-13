/**
 * Resolves dependencies of npm packages.
 */
const pacote = require('pacote')
const prefix = require('si-prefix')
const copy = require('deep-copy')
const request = require('./request')
const store = require('./cache').store

function getPathUpTo (me, to) {
  if (me.name === to) {
    return []
  }
  return getPathUpTo(me.parent, to).concat(me.name)
}

module.exports = resolve
async function resolve (name, wanted = 'latest', parent = null) {
  let pending = []  // promises to be resolved
  let manifest = await pacote.manifest(`${name}@${wanted}`)
  let version = manifest.version

  if (!parent) {
    let cache = await store.findOne({ name, version })
    if (cache) {
      return cache
    }
  }

  let tarball = manifest._resolved
  let dependencies = []  // fill with recursive resolve
  let cyclic = []

  let cyclicParent = findEqualParent(name, version, parent)
  if (cyclicParent) {
    // me found somewhere in parent -> parent -> ...
    // add reference to me in cyclicParent
    cyclicParent.cyclic.push({
      path: getPathUpTo(parent, name),
      wanted
    })
    // return early, stop recursion
    return { isCyclic: true }
  }

  let tarballSize = 0
  let me = { name, wanted, version, tarball, tarballSize, dependencies, cyclic, parent }
  pending.push(getTarballSize(tarball).then(size => { me.tarballSize = size }))

  for (let dep in manifest.dependencies || {}) {
    let name = dep
    let wanted = manifest.dependencies[dep]
    pending.push(resolve(name, wanted, me).then(dependency => {
      if (dependency.isCyclic) {
        return
      }
      dependencies.push(dependency)
    }))
  }

  await Promise.all(pending)

  if (!parent) {
    // root -> sum up sizes
    parseTree(me)
    let shallow = shallowManifest(me)
    store.insert(shallow)
    return shallow
  }

  return me
}

function findEqualParent (name, version, parent) {
  if (!parent) {
    return
  }
  return (name === parent.name && version === parent.version)
    ? parent
    : findEqualParent(name, version, parent.parent)
}

function parseTree (me) {
  let allDepentents = {}

  for (let dependency of me.dependencies) {
    let { deps } = parseTree(dependency)
    let { name, version, tarballSize } = dependency

    allDepentents[`${name}@${version}`] = {
      name, version, tarballSize
    }

    // prune / deduplicate
    Object.assign(allDepentents, deps)
  }

  me.totalDependencies = 0
  me.size = me.tarballSize
  for (let key in allDepentents) {
    me.totalDependencies += 1
    me.size += allDepentents[key].tarballSize
  }
  me.prettySize = pretty(me.size)

  if (me.cyclic && me.cyclic.length === 0) {
    delete me.cyclic
  }

  // remove parent
  delete me.parent

  return {
    deps: allDepentents
  }
}

async function getTarballSize (href) {
  let cache = await store.findOne({ tarball: href })
  if (cache) {
    return cache.tarballSize
  }
  const response = await request.head({ href })

  if (!response.headers['content-length']) {
    throw new Error(`Did not get content length for ${href}`)
  }

  let size = parseInt(response.headers['content-length'])
  if (typeof size !== 'number' || !isFinite(size)) {
    throw new Error(`Unable to parse content-length ${response.headers['content-length']} of ${href}`)
  }
  store.insert({ tarball: href, tarballSize: size })
  return size
}

function pretty (size) {
  if (size === 0) {
    // avoid NaN, https://github.com/mal/si-prefix/issues/1
    return [0, 'B']
  }
  let converted = prefix.byte.convert(size)
  let output = converted[0].toFixed(2) + ' ' + converted[1]
  return output
}

/**
 * Cache 1 level deep manifests. Remove dependencies of dependencies.
 * @param {object} manifest
 */
function shallowManifest (manifest) {
  let shallow = copy(manifest)
  for (let dependency of shallow.dependencies) {
    delete dependency.dependencies
    delete dependency.tarball
  }
  delete shallow.tarball
  return shallow
}
