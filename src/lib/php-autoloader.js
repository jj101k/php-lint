let fs = require("fs")
export default class PHPAutoloader {
    /**
     * Build the object
     * @param {{[x: string]: string[]}} paths 
     */
    constructor(paths) {
        this.paths = paths
    }
    /**
     * @type {{[x: string]: string[]}} Class name prefixes mapped to arrays of
     * paths. Each path should end with a /, and most prefixes will also.
     */
    get paths() {
        return this._paths
    }
    set paths(v) {
        this._paths = v
    }
    /**
     * Merges another autoloader into this one.
     * @param {PHPAutoloader} autoloader 
     */
    add(autoloader) {
        this.paths = Object.assign(
            {},
            this.paths,
            autoloader.paths
        )
    }
    /**
     * Finds the filename that holds the class, if possible.
     * @param {string} class_name
     * @returns {?string}
     */
    findClassFile(name) {
        let canonical_class_name = name.replace(/^\\+/, "").replace(/_/g, '\\')
        let paths = Object.keys(this.paths)
        paths.sort((a, b) => b.length - a.length || a.localeCompare(b))
        for(let k of paths) {
            if(
                k.length < canonical_class_name.length &&
                k == canonical_class_name.substr(0, k.length)
            ) {
                let path_tail = canonical_class_name.substr(k.length).replace(/\\/g, "/") + ".php"
                let full_path = this.paths[k].map(
                    path => path + path_tail
                ).find(
                    path => fs.existsSync(path)
                )
                if(full_path) {
                    return full_path
                }
            }
        }
        return null
    }
}