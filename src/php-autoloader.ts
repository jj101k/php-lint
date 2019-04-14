import * as fs from "fs"
const debug = require("debug")("php-lint:autoloader")
/**
 * Approximates PHP's autoload behaviour
 */
export class PHPAutoloader {
    /**
     * True if the classmap files have been returned (if so, they should now all
     * be loaded and thus no longer needed).
     */
    private checkedClassmap = false
    /**
     * These are files or directories where *everything* is scanned for classes.
     */
    private classmapPaths: string[]
    /**
     * Class name prefixes mapped to arrays of
     * paths. Each path should end with a /, and most prefixes will also.
     */
    private paths: Map<string, string[]>

    /**
     * Build the object
     *
     * @param paths
     * @param classmap_paths Files or directories where *everything* is scanned
     * for classes. Hopefully you have none of these.
     */
    constructor(paths: Map<string, string[]>, classmap_paths: string[] = []) {
        this.classmapPaths = classmap_paths
        // We want this order so that Foo\Bar comes before Foo; and otherwise
        // just a defined order.
        const class_prefixes = [...paths.keys()]
        class_prefixes.sort((a, b) => b.length - a.length || a.localeCompare(b))

        this.paths = new Map()
        for(const prefix of class_prefixes) {
            this.paths.set(prefix, paths.get(prefix)!)
        }
    }

    /**
     * Merges another autoloader into this one.
     *
     * @param autoloader
     */
    add(autoloader: PHPAutoloader): void {
        for(const [class_ns, s] of autoloader.paths.entries()) {
            this.paths.set(
                class_ns,
                this.paths.has(class_ns) ?
                    this.paths.get(class_ns)!.concat(s) :
                    s
            )
        }
        this.classmapPaths = this.classmapPaths.concat(autoloader.classmapPaths)
    }

    /**
     * Finds the filename(s) that might hold the class. You need to load all of these.
     *
     * @param name
     */
    findClassFiles(name: string): string[] {
        debug([...this.paths.keys()])
        for(const [class_ns, s] of this.paths.entries()) {
            debug([class_ns, name])
            if(class_ns.length < name.length && class_ns == name.substr(0, class_ns.length)) {
                debug("HIT", s)
                const path_tail = name.substr(class_ns.length).replace(/\\/g, "/") + ".php"
                const full_path = s.map(
                    path => path + path_tail
                ).find(
                    path => fs.existsSync(path)
                )
                if(full_path) {
                    return [full_path]
                }
            }
        }
        if(!this.checkedClassmap) {
            /** Files (*.php / *.inc only) */
            const filenames: string[] = []
            for(const path of this.classmapPaths) {
                /** Files (any) or directories */
                let paths = [path]
                while(paths.length) {
                    const pd: string = paths.shift()!
                    if(fs.statSync(pd).isDirectory()) {
                        paths = paths.concat(
                            fs.readdirSync(pd).filter(
                                p => ![".", ".."].includes(p)
                            ).map(
                                p => `${pd}/${p}`
                            )
                        )
                    } else if(pd.match(/[.](php|inc)$/)) {
                        filenames.push(pd)
                    }
                }
            }
            return filenames
        } else {
            return []
        }
    }
}