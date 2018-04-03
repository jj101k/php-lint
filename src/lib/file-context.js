const path = require("path")

/** @type {boolean} If true, all file loads will be mentioned */
const DEBUG_FILE_LOAD = false

export class FileContext {
    /**
     * Builds the object
     *
     * @param {string} filename
     * @param {number} [depth] The load depth
     */
    constructor(filename, depth = 0) {
        this.filename = filename && path.resolve(filename)
        if(DEBUG_FILE_LOAD) {
            console.info(`Loading ${filename} at depth ${depth}`)
        }
        this._namespace = null
        this.aliases = {}
    }

    /** @type {string} The directory the file's in (resolved) */
    get directory() {
        return path.resolve(path.dirname(this.filename))
    }

    /** @type {?string} eg "\\Foo" for the class \Foo\Bar */
    get namespace() {
        return this._namespace
    }
    set namespace(v) {
        this._namespace = v
    }

    /**
     * Creates an alias, as from `use \Foo\Bar` or `use \Foo as Bar`
     *
     * @param {string} real_name eg "\\Foo\\Bar"
     * @param {string} alias eg. "Bar"
     */
    alias(real_name, alias) {
        this.aliases[alias] = real_name.replace(/^\\+/, "")
    }

    /**
     * If there's an alias by that name, returns its name.
     *
     * @param {string} name
     * @returns {?string}
     */
    resolveAliasName(name) {
        return this.aliases[name] && "\\" + this.aliases[name]
    }

    /**
     * The fully resolved name
     *
     * @param {string} name
     * @returns {string}
     */
    resolveName(name) {
        let alias_name = this.resolveAliasName(name)
        if(alias_name) {
            return alias_name
        } else if(this.namespace) {
            return `\\${this.namespace}\\${name}`
        } else {
            return `\\${name}`
        }
    }
}