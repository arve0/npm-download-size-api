declare module 'pacote' {
    let manifest: (spec: string, options: { cache: string }) => Promise<PacoteManifest>
}

declare interface PacoteManifest {
    name: string,
    version: string,
    dependencies: { [index: string]: string } | undefined,
    _id: string,
    _resolved: string,
}

declare interface Manifest {
    name: string,
    version: string,
    dependencies: [string, string][],
    tarball: string,
}

declare module 'si-prefix' {
    let byte: {
        convert: (size: number) => [number, string]
    }
}

declare interface Store<T> {
    findOne: (query: Partial<T>) => Promise<T>
    insert: (newDoc: T) => Promise<T>
}

declare interface HrefDownloadSize {
    href: string,
    size: number
}

declare interface CacheTarballs {
    name: string,
    version: string,
    tarballs: [string, string][],
}

declare interface PkgDownloadSize extends PkgDownloadSizeSimple {
    dependencies: PkgDownloadSizeSimple[]
}

declare interface PkgDownloadSizeSimple {
    name: string,
    wanted: string,
    version: string,
    tarballSize: number,
    totalDependencies: number,
    size: number,
    prettySize: string,
}

declare module 'validate-npm-package-name' {
    let validate: (pkg: string) =>  {
        validForNewPackages: boolean,
        validForOldPackages: boolean,
    }
    export = validate
}