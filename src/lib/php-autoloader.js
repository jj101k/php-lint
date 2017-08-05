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
}