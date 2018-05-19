const fs = require("fs")
const path = require("path")
const zlib = require("zlib")

import * as ClassContext from "./class-context"
import {FileContext} from "./file-context"
import * as PHPError from "./php-error"
import PHPLint from "./php-lint"
import * as PHPType from "./php-type"
import PHPAutoloader from "./php-autoloader"
import * as ShadowTree from "./shadowtree"
import Context from "./context"
import {LintSingle} from "./lint"

/**
 * Reads JSON from a compressed PHP info data file
 *
 * @param {string} filename
 * @returns {*}
 */
function readPHPInfo(filename) {
    let compressed = fs.readFileSync(
        __dirname + "/../../data/" + filename
    )
    return JSON.parse(zlib.gunzipSync(compressed).toString("utf8"))
}

/**
 * @type {boolean} If true, autoload failure may throw. This can help with
 * debugging unexpected loads.
 */
const DEBUG_AUTOLOAD = false

/** @type {number} The maximum depth we're willing to scan files at */
const MAX_DEPTH = Infinity

/**
 * @type {string[]} From ./php-bin/php-classes | gzip > data/php-classes.json.gz
 */
const PHPClasses = Object.keys(readPHPInfo("php-classes.json.gz"))

/**
 * @type {string[]} From ./php-bin/php-interfaces | gzip > data/php-interfaces.json.gz
 */
const PHPInterfaces = readPHPInfo("php-interfaces.json.gz")

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
                            autoload_paths[prefix] =
                                (psr4[prefix] instanceof Array ?
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
                    console.log(
                        `WARNING, this project uses classmap autoload at ${filename}, this is extremely unwise and takes non-trivial time to parse`
                    )
                    classmap_paths = classmap.map(
                        // Directory paths may be garbage here, but won't know
                        // until we try to use them.
                        path => `${current_module_path}/${path}`
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
     *
     * @param {LintSingle} lint_single
     */
    constructor(lint_single) {
        /** @type {{[x: string]: ClassContext.Class}} */
        this.classes = {}
        /** @type {{[x: string]: boolean}} */
        this.filesSeen = {}
        /** @type {FileResult[]} */
        this.results = []
        /** @type {{[x: string]: ClassContext.Trait}} */
        this.traits = {}

        /** @type {?string} */
        this.workingDirectory = null
        PHPClasses.forEach(
            name => {
                let c = this.addUnknownClass("\\" + name)
                if(name == "DateTime") {
                    c.addIdentifier(
                        "modify",
                        "public",
                        false,
                        new PHPType.Union(
                            new PHPType.Function(
                                [PHPType.Core.types.string],
                                PHPType.Core.named("\\" + name).addTypesFrom(
                                    PHPType.Core.types.bool.withValue(false)
                                )
                            )
                        )
                    )
                    c.addIdentifier(
                        "format",
                        "public",
                        false,
                        new PHPType.Union(
                            new PHPType.Function(
                                [PHPType.Core.types.string],
                                PHPType.Core.types.string.addTypesFrom(
                                    PHPType.Core.types.bool.withValue(false)
                                )
                            )
                        )
                    )
                }
            }
        )
        PHPInterfaces.forEach(
            name => this.addUnknownClass("\\" + name)
        )
        this.addUnknownClass("mixed")
        this.addUnknownClass("object")

        this.lintSingle = lint_single
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
     * @param {?ClassContext.Class} [superclass]
     * @param {?FileContext} [file_context]
     * @param {?{context: Context, node: ShadowTree.Class}} [warm_info]
     * @param {string[]} [interface_names]
     * @returns {ClassContext.Class}
     */
    addClass(
        name,
        superclass = null,
        file_context = null,
        warm_info = null,
        interface_names = []
    ) {
        if(
            this.classes[name] &&
            !(this.classes[name] instanceof ClassContext.UnknownClass)
        ) {
            return this.classes[name]
        } else {
            return this.classes[name] = new ClassContext.Class(
                name,
                superclass,
                file_context,
                warm_info,
                interface_names
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
     * @returns {ClassContext.UnknownClass}
     */
    addUnknownClass(name = null) {
        if(!name) {
            name = "Unknown" + Math.random()
        }
        return this.classes[name] = new ClassContext.UnknownClass(name)
    }

    /**
     * Adds an unknown trait. For when the real name isn't known and you have to
     * use a placeholder. You can get the name from the return value.
     *
     * @param {?string} [name]
     * @returns {ClassContext.UnknownTrait}
     */
    addUnknownTrait(name = null) {
        if(!name) {
            name = "Unknown" + Math.random()
        }
        return this.traits[name] = new ClassContext.UnknownTrait(name)
    }

    /**
     * Adds a known trait
     * @param {string} name Fully qualified only
     * @param {?ClassContext.Trait} superclass
     * @param {?FileContext} file_context
     * @param {ShadowTree.Trait} trait_node
     * @returns {ClassContext.Trait}
     */
    addTrait(name, superclass, file_context, trait_node) {
        if(
            this.traits[name] &&
            !(this.traits[name] instanceof ClassContext.UnknownTrait)
        ) {
            return this.traits[name]
        } else {
            return this.traits[name] = new ClassContext.Trait(
                name,
                superclass,
                file_context,
                trait_node
            )
        }
    }

    /**
     * Adds a known interface
     * @param {string} name Fully qualified only
     * @param {?ClassContext.Class} [superclass]
     * @param {?FileContext} [file_context]
     * @returns {ClassContext.Class}
     */
    addInterface(name, superclass = null, file_context = null) {
        if(
            this.classes[name] &&
            !(this.classes[name] instanceof ClassContext.UnknownClass)
        ) {
            return this.classes[name]
        } else {
            return this.classes[name] = new ClassContext.Interface(
                name,
                superclass,
                file_context
            )
        }
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
            let data = fs.readFileSync(filename, "utf8")
            let tree = PHPLint.parser.parseCode(data, filename)
            return this.lintSingle.checkTree(
                tree,
                filename,
                false,
                depth,
                null
            )
        }
    }

    /**
     * Given a path for the current file, walks up the tree looking for
     * composer.json.
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
     * @param {boolean} [expecting_miss] True if you're expecting not to find it
     * @returns {?ClassContext.Class}
     */
    findClass(name, file_context, depth = 0, expecting_miss = false) {
        if(name.match(/ -> /)) {
            return ClassContext.AnonymousFunction.inst
        }
        let load_depth = depth + 1
        let filename = file_context.filename
        if(this.classes.hasOwnProperty(name)) {
            let c = this.classes[name]
            if(c.fileContext) {
                let fr = this.results.find(
                    fr => fr.filename == c.fileContext.filename
                )
                if(fr && fr.depth > load_depth) {
                    fr.depth = load_depth
                }
            }
            return this.classes[name]
        } else if(load_depth > MAX_DEPTH) {
            return new ClassContext.UnknownClass(name)
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
                throw new PHPError.ClassLoadFailed(`Could not autoload ${name}`)
            } else {
                if(!expecting_miss) {
                    console.log(`Could not autoload ${name}`)
                }
                return this.classes[name]
            }
        }
    }

    /**
     * Finds the trait context with the given name
     *
     * @param {string} name Fully qualified only
     * @param {FileContext} file_context
     * @param {number} [depth] The current load depth
     * @param {boolean} [expecting_miss] True if you're expecting not to find it
     * @returns {?ClassContext.Trait}
     */
    findTrait(name, file_context, depth = 0, expecting_miss = false) {
        let load_depth = depth + 1
        let filename = file_context.filename
        if(this.traits.hasOwnProperty(name)) {
            let t = this.traits[name]
            if(t.fileContext) {
                let fr = this.results.find(
                    fr => fr.filename == t.fileContext.filename
                )
                if(fr && fr.depth > load_depth) {
                    fr.depth = load_depth
                }
            }
            return this.traits[name]
        } else {
            this.addUnknownTrait(name)
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
                    if(!this.traits[name]) {
                        console.log(
                            `Trait ${name} not found at ${full_path}`
                        )
                        this.addUnknownTrait(name)
                    }
                    return this.traits[name]
                }
            }
            if(DEBUG_AUTOLOAD) {
                console.log(this.autoloader)
                throw new PHPError.ClassLoadFailed(`Could not autoload ${name}`)
            } else {
                if(!expecting_miss) {
                    console.log(`Could not autoload ${name}`)
                }
                return this.traits[name]
            }
        }
    }
}