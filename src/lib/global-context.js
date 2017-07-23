const fs = require("fs")
const path = require("path")

import {AnonymousFunctionContext, ClassContext, TraitContext, UnknownClassContext} from "./class-context"
import {FileContext} from "./file-context"
import {PHPContextlessError} from "./phpstricterror"
import PHPLint from "./php-lint"

/** @type {boolean} If true, autoload failure may throw. */
const DEBUG_AUTOLOAD = false

/** @type {number} The maximum depth we're willing to scan files at */
const MAX_DEPTH = 2

/**
 * @type {string[]} From `print json_encode(get_declared_classes(), JSON_PRETTY_PRINT);`
 */
const PHPClasses = JSON.parse(fs.readFileSync(__dirname + "/../../data/php-classes.json", "utf8"))

/**
 * @type {string[]} From `print json_encode(get_declared_interfaces(), JSON_PRETTY_PRINT);`
 */
const PHPInterfaces = JSON.parse(fs.readFileSync(__dirname + "/../../data/php-interfaces.json", "utf8"))

/**
 * This defines content that's defined from the global scope, ie. everything
 * that is not anonymous.
 */
export class GlobalContext {
    /**
     * This returns autoload config from the given composer.json
     * @param {?string} filename eg. /foo/bar/composer.json
     * @param {?string} vendor_path If unset, this will be based on the filename
     * @returns {?Object.<string,string[]>} Class name prefixes mapped to arrays
     * of paths. Each path should end with a /, and most prefixes will also.
     */
    static autoloadFromComposer(filename, vendor_path = null) {
        if(!filename) return null
        /** @type {string} The current module (or whole project) root */
        let current_module_path = path.dirname(filename)
        try {
            let composer_config = JSON.parse(fs.readFileSync(filename, "utf8"))
            let autoload_paths = {}
            if(composer_config.autoload) {
                let psr0 = composer_config.autoload["psr-0"]
                if(psr0) {
                    Object.keys(psr0).forEach(
                        prefix => {
                            autoload_paths[prefix] = [psr0[prefix]].map(
                                path => `${current_module_path}/${path}${prefix.replace(/[_\\]/g, "/")}/`
                            )
                        }
                    )
                }
                let psr4 = composer_config.autoload["psr-4"]
                if(psr4) {
                    Object.keys(psr4).forEach(
                        prefix => {
                            autoload_paths[prefix] = (psr4[prefix] instanceof Array ?
                                psr4[prefix] :
                                [psr4[prefix]]
                            ).map(
                                path => {
                                    if(path.match(/\/$/) || path == "") {
                                        return `${current_module_path}/${path}`
                                    } else {
                                        //console.log(`Path ${path} for ${prefix} is missing a trailing slash`)
                                        return `${current_module_path}/${path}/`
                                    }
                                }
                            )
                        }
                    )
                }
            }
            if(!vendor_path) {
                vendor_path = path.dirname(filename) + "/vendor"
            }
            if(composer_config.require) {
                Object.keys(composer_config.require).filter(
                    uid => uid.match(/\//)
                ).forEach(
                    uid => autoload_paths = Object.assign(
                        {},
                        this.autoloadFromComposer(
                            `${vendor_path}/${uid}/composer.json`,
                            vendor_path
                        ),
                        autoload_paths
                    )
                )
            }
            return autoload_paths
        } catch(e) {
            if(e.errno == -2) {
                console.log(`${filename} missing, not installed?`)
                return {}
            } else {
                throw e
            }
        }
    }

    /**
     * Builds the context
     */
    constructor() {
        this.classes = {}
        /** @type {Object.<string,number>} The minimum depth for each class */
        this.depths = {
            "": 0
        }
        PHPClasses.forEach(
            name => this.addUnknownClass("\\" + name)
        )
        PHPInterfaces.forEach(
            name => this.addUnknownClass("\\" + name)
        )
        this.addUnknownClass("mixed")
        this.addUnknownClass("object")
    }

    /**
     * @type {Object.<number,number>} The number of classes at each depth
     */
    get depthCounts() {
        let counts = {}
        Object.values(this.depths).forEach(n => {
            if(!counts[n]) counts[n] = 0
            counts[n]++
        })
        return counts
    }

    /**
     * Adds a known class
     * @param {string} name Fully qualified only
     * @param {?ClassContext} superclass
     * @returns {ClassContext}
     */
    addClass(name, superclass = null) {
        return this.classes[name] = this.classes[name] || new ClassContext(
            name,
            superclass
        )
    }

    /**
     * Adds an unknown class. For when the real name isn't known and you have to
     * use a placeholder. You can get the name from the return value.
     * @param {?string} [name]
     * @returns {UnknownClassContext}
     */
    addUnknownClass(name = null) {
        if(!name) {
            name = "Unknown" + Math.random()
        }
        return this.classes[name] = new UnknownClassContext(name)
    }

    /**
     * Adds a known trait
     * @param {string} name Fully qualified only
     * @param {?ClassContext} superclass
     * @returns {ClassContext}
     */
    addTrait(name, superclass = null) {
        return this.classes[name] = this.classes[name] || new TraitContext(
            name,
            superclass
        )
    }

    /**
     * Checks a PHP file. This will typically affect what's defined in the
     * global namespace, including classes.
     * @param {string} filename
     * @param {number} [depth]
     */
    checkFile(filename, depth = 0) {
        PHPLint.checkFileSync(filename, false, depth)
    }

    /**
     * Given a path for the current file, walks up the tree looking for composer.json.
     *
     * @param {string} actual_path eg. /foo/bar/lib/Baz/
     * @return {?string} eg. /foo/bar/composer.json
     */
    findComposerConfig(actual_path) {
        while(actual_path.match(/^\/+[^\/]/)) {
            if(fs.existsSync(`${actual_path}/composer.json`)) {
                return `${actual_path}/composer.json`
            }
            actual_path = path.dirname(actual_path)
        }
        return null
    }

    /**
     * Finds the class context with the given name
     * @param {string} name Fully qualified only
     * @param {FileContext} file_context
     * @param {number} [depth] The current load depth
     * @returns {?ClassContext}
     */
    findClass(name, file_context, depth = 0) {
        if(name.match(/ -> /)) {
            return AnonymousFunctionContext.inst
        }
        let load_depth = depth + 1
        let filename = file_context.filename
        if(this.classes.hasOwnProperty(name)) {
            if(load_depth < this.depths[name]) {
                this.depths[name] = load_depth
            }
            return this.classes[name]
        } else if(load_depth > MAX_DEPTH) {
            return new UnknownClassContext(name)
        } else {
            this.addUnknownClass(name)
            this.depths[name] = load_depth
            // Autoload go!
            if(!this.autoloadPaths) {
                this.autoloadPaths = GlobalContext.autoloadFromComposer(
                    this.findComposerConfig(file_context.directory)
                )
            }
            if(this.autoloadPaths) {
                let canonical_class_name = name.replace(/^\\+/, "").replace(/_/g, '\\')
                let paths = Object.keys(this.autoloadPaths)
                paths.sort((a, b) => b.length - a.length || a.localeCompare(b))
                for(let k of paths) {
                    if(
                        k.length < canonical_class_name.length &&
                        k == canonical_class_name.substr(0, k.length)
                    ) {
                        let path_tail = canonical_class_name.substr(k.length).replace(/\\/g, "/") + ".php"
                        let full_path = this.autoloadPaths[k].map(
                            path => path + path_tail
                        ).find(
                            path => fs.existsSync(path)
                        )
                        if(full_path) {
                            this.checkFile(full_path, load_depth)
                            if(!this.classes[name]) {
                                console.log(
                                    `Class ${name} not found at ${full_path}`
                                )
                                this.addUnknownClass(name)
                            }
                            return this.classes[name]
                        }

                    }
                }
            }
            if(DEBUG_AUTOLOAD) {
                console.log(this.autoloadPaths)
                throw new PHPContextlessError(`Could not load ${name}`)
            } else {
                console.log(`Could not load ${name}`)
                return this.classes[name]
            }
        }
    }
}