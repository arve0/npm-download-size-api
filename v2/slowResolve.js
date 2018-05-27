"use strict";
// let resolving = 0;
// // let ii = setInterval(() => {
// //     console.log(`resolving ${resolving} packages`)
// // }, 1000)
// let resolvedBefore: {
//     [index:string]: number
// } = {}
// const queue: Map<string, Promise<Dependency>> = new Map()
// async function resolve(name: string, wanted: string, path: string[]): Promise<Dependency> {
//     resolving += 1;
//     // let rb = resolvedBefore[spec(name, wanted)]
//     // if (rb) {
//     //     resolvedBefore[spec(name, wanted)] += 1
//     //     console.time(`resolved ${spec(name, wanted)} time ${rb}`)
//     // } else {
//     //     resolvedBefore[spec(name, wanted)] = 1
//     //     console.time(`resolved ${spec(name, wanted)} first time`)
//     // }
//     let manifest = await pacote.manifest(spec(name, wanted), pacoteOpts)
//     let { version, _id, _resolved: tarball, dependencies: wantedDependencies = {} } = manifest
//     // if (rb) {
//     //     console.timeEnd(`resolved ${spec(name, wanted)} time ${rb}`)
//     // } else {
//     //     console.timeEnd(`resolved ${spec(name, wanted)} first time`)
//     // }
//     if (path.includes(_id)) {
//         // cyclic dependency
//         resolving -= 1;
//         return { name, version, tarball, dependencies: [] }
//     }
//     let dependencies = await resolveDependencies(wantedDependencies, path.concat(_id))
//     resolving -= 1;
//     return { name, version, tarball, dependencies }
// }
// function spec(name: string, wanted: string) {
//     return `${name}@${wanted}`
// }
// function resolveDependencies(dependencies: Manifest['dependencies'], path: string[]): Promise<Dependency[]> {
//     return Promise.all(
//         Object.entries(dependencies || {}).map(
//             ([name, version]) => resolve(name, version, path)
//         )
//     )
// }
// /**
//  * Get all dependencies in tree as Map(spec, tarballUrl).
//  *
//  * @param root Root dependency.
//  */
// function getTarballs(root: Dependency): Map<string, string> {
//     let tarballs: Map<string, string> = new Map()
//     for (let { name, version, tarball } of everyDependencyIn(root)) {
//         tarballs.set(spec(name, version), tarball)
//     }
//     return tarballs
// }
// function* everyDependencyIn(root: Dependency) {
//     let queue = root.dependencies
//     let node: Dependency | undefined;
//     while (node = queue.shift()) {
//         yield node
//         queue = queue.concat(node.dependencies)
//     }
// }
//# sourceMappingURL=slowResolve.js.map