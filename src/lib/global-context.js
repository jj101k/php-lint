const fs = require("fs")
const path = require("path")

import {AnonymousFunctionContext, ClassContext, InterfaceContext, TraitContext, UnknownClassContext} from "./class-context"
import {FileContext} from "./file-context"
import * as PHPError from "./php-error"
import PHPLint from "./php-lint"
import PHPAutoloader from "./php-autoloader"

/**
 * @type {boolean} If true, autoload failure may throw. This can help with
 * debugging unexpected loads.
 */
const DEBUG_AUTOLOAD = false

/** @type {number} The maximum depth we're willing to scan files at */
const MAX_DEPTH = Infinity

/**
 * @type {string[]} From `print json_encode(get_declared_classes(), JSON_PRETTY_PRINT);`
 */
const PHPClasses = JSON.parse(fs.readFileSync(__dirname + "/../../data/php-classes.json", "utf8"))

/**
 * @type {string[]} From `print json_encode(get_declared_interfaces(), JSON_PRETTY_PRINT);`
 */
const PHPInterfaces = JSON.parse(fs.readFileSync(__dirname + "/../../data/php-interfaces.json", "utf8"))

class FileResult {
    /**
     *
     * @param {string} filename
     * @param {number} depth
     */
    constructor(filename, depth) {
        this.depth = depth
        this.filename = filename
        /** @type {?Error} */
        this.error = null
        /**
         * @type {?boolean}
         */
        this.result = null
    }
}

/**
 * This defines content that's defined from the global scope, ie. everything
 * that is not anonymous.
 */
export class GlobalContext {
    /**
     * This returns autoload config from the given composer.json
     * @param {?string} filename eg. /foo/bar/composer.json
     * @param {?string} vendor_path If unset, this will be based on the filename
     * @returns {?PHPAutoloader}
     */
    static autoloadFromComposer(filename, vendor_path = null) {
        if(!filename) return null
        /** @type {string} The current module (or whole project) root */
        let current_module_path = path.dirname(filename)
        try {
            let composer_config = JSON.parse(fs.readFileSync(filename, "utf8"))
            let autoload_paths = {}
            let classmap_paths = []
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
                let classmap = composer_config.autoload["classmap"]
                if(classmap) {
                    console.log("WARNING, this project uses classmap autoload, this is extremely unwise and takes non-trivial time to parse")
                    classmap_paths = classmap.map(
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
            }
            if(!vendor_path) {
                vendor_path = path.dirname(filename) + "/vendor"
            }
            let autoloader = new PHPAutoloader(autoload_paths, classmap_paths)
            if(composer_config.require) {
                Object.keys(composer_config.require).filter(
                    uid => uid.match(/\//)
                ).forEach(
                    uid => autoloader.add(
                        this.autoloadFromComposer(
                            `${vendor_path}/${uid}/composer.json`,
                            vendor_path
                        )
                    )
                )
            }
            return autoloader
        } catch(e) {
            if(e.errno == -2) {
                console.log(`${filename} missing, not installed?`)
                return new PHPAutoloader({})
            } else {
                throw e
            }
        }
    }

    /**
     * Builds the context
     */
    constructor() {
        /** @type {{[x: string]: ClassContext}} */
        this.classes = {}
        /** @type {FileResult[]} */
        this.results = []
        /** @type {{[x: string]: boolean}} */
        this.filesSeen = {}

        /** @type {?string} */
        this.workingDirectory = null
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
     * @type {{[x: number]: number}} The number of classes at each depth
     */
    get depthCounts() {
        let counts = {}
        this.results.forEach(fr => {
            if(!counts[fr.depth]) counts[fr.depth] = 0
            counts[fr.depth]++
        })
        return counts
    }

    /**
     * Adds a known class
     * @param {string} name Fully qualified only
     * @param {?ClassContext} [superclass]
     * @param {?FileContext} [file_context]
     * @returns {ClassContext}
     */
    addClass(name, superclass = null, file_context = null) {
        if(this.classes[name] && !(this.classes[name] instanceof UnknownClassContext)) {
            return this.classes[name]
        } else {
            return this.classes[name] = new ClassContext(
                name,
                superclass,
                file_context
            )
        }
    }

    /**
     * Adds a file to the result set, and calls the supplied function to check it.
     *
     * @param {string} filename
     * @param {number} depth
     * @param {function(): boolean} f
     */
    addFile(filename, depth, f) {
        if(!this.results.some(fr => fr.filename == filename)) {
            let fr = new FileResult(filename, depth)
            this.results.push(fr)
            try {
                fr.result = f()
            } catch(e) {
                fr.error = e
            }
        }
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
     * @param {?ClassContext} [superclass]
     * @param {?FileContext} [file_context]
     * @returns {ClassContext}
     */
    addTrait(name, superclass = null, file_context = null) {
        return this.classes[name] = this.classes[name] || new TraitContext(
            name,
            superclass,
            file_context
        )
    }

    /**
     * Adds a known interface
     * @param {string} name Fully qualified only
     * @param {?ClassContext} [superclass]
     * @param {?FileContext} [file_context]
     * @returns {ClassContext}
     */
    addInterface(name, superclass = null, file_context = null) {
        return this.classes[name] = this.classes[name] || new InterfaceContext(
            name,
            superclass,
            file_context
        )
    }

    /**
     * Checks a PHP file. This will typically affect what's defined in the
     * global namespace, including classes.
     * @param {string} filename
     * @param {number} [depth]
     */
    checkFile(filename, depth = 0) {
        let resolved_filename = path.resolve(filename)
        if(!this.filesSeen[resolved_filename]) {
            this.filesSeen[resolved_filename] = true
            PHPLint.checkFileSync(filename, false, depth)
        }
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
            let c = this.classes[name]
            if(c.fileContext) {
                let fr = this.results.find(fr => fr.filename == c.fileContext.filename)
                if(fr && fr.depth > load_depth) {
                    fr.depth = load_depth
                }
            }
            return this.classes[name]
        } else if(load_depth > MAX_DEPTH) {
            return new UnknownClassContext(name)
        } else {
            this.addUnknownClass(name)
            // Autoload go!
            if(!this.autoloader) {
                this.autoloader = GlobalContext.autoloadFromComposer(
                    this.findComposerConfig(this.workingDirectory)
                )
            }
            if(this.autoloader) {
                let full_path = this.autoloader.findClassFile(name)
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
            if(DEBUG_AUTOLOAD) {
                console.log(this.autoloader)
                throw new PHPError.ClassLoadFailed(`Could not load ${name}`)
            } else {
                console.log(`Could not load ${name}`)
                return this.classes[name]
            }
        }
    }
}