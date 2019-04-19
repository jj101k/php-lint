import { NodeTypes } from "./content/ast";
import { Context } from "./context";
import PHPLint from "./php-lint";
import {PHPAutoloader} from "./php-autoloader";
import * as fs from "fs"
import * as path from "path"
import { LintError } from "./lint-error";
export default class Lint {
    private lastContext: Context | null = null
    private phplint: PHPLint

    /**
     * The directory for relative includes. This may be mutated.
     */
    public workingDirectory: string | null = null

    /**
     *
     * @param phplint The parent object, for recursive file lint requests
     */
    constructor(phplint: PHPLint) {
        this.phplint = phplint
    }
    /**
     *
     * @param name
     */
    autoload(name: string): boolean | null {
        this.lastContext!.setConstant(name, null)
        const filenames = Lint.autoloadFromComposer("composer.json").findClassFiles(name)
        let last_file_state: boolean | null = null
        for(const filename of filenames) {
            last_file_state = this.checkFile(filename)
        }
        return last_file_state
    }
    /**
     * This returns autoload config from the given composer.json
     * @param filename eg. /foo/bar/composer.json
     * @param vendor_path If unset, this will be based on the filename
     */
    static autoloadFromComposer(
        filename: string,
        vendor_path: string | null = null
    ): PHPAutoloader {
        /** The current module (or whole project) root */
        const current_module_path = path.dirname(filename)
        try {
            const composer_config: {
                autoload?: {
                    classmap: string[],
                    "psr-0"?: {[prefix: string]: string},
                    "psr-4"?: {[prefix: string]: string | string[]}
                },
                require?: {[name: string]: string},
            } = JSON.parse(fs.readFileSync(filename, "utf8"))
            const autoload_paths = new Map<string, string[]>()
            let classmap_paths: string[] = []
            if(composer_config.autoload) {
                const psr0 = composer_config.autoload["psr-0"]
                if(psr0) {
                    for(const [prefix, path] of Object.entries(psr0)) {
                        const qualified_path = `${current_module_path}/${path}${prefix.replace(/[_\\]/g, "/")}/`
                        autoload_paths.set(prefix, [qualified_path])
                    }
                }
                const psr4 = composer_config.autoload["psr-4"]
                if(psr4) {
                    for(const [prefix, path_s] of Object.entries(psr4)) {
                        autoload_paths.set(
                            prefix,
                            (path_s instanceof Array ? path_s : [path_s]).map(
                                path => {
                                    if(path.match(/\/$/) || path == "") {
                                        return `${current_module_path}/${path}`
                                    } else {
                                        //console.log(`Path ${path} for ${prefix} is missing a trailing slash`)
                                        return `${current_module_path}/${path}/`
                                    }
                                }
                            )
                        )
                    }
                }
                const classmap = composer_config.autoload["classmap"]
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
            const autoloader = new PHPAutoloader(autoload_paths, classmap_paths)
            if(composer_config.require) {
                for(const uid of Object.keys(composer_config.require)) {
                    if(uid.includes("/")) {
                        autoloader.add(
                            this.autoloadFromComposer(
                                `${vendor_path}/${uid}/composer.json`,
                                vendor_path
                            )
                        )
                    }
                }
            }
            return autoloader
        } catch(e) {
            if(e.errno == -2) {
                console.log(`${filename} missing, not installed?`)
                return new PHPAutoloader(new Map())
            } else {
                throw e
            }
        }
    }
    /**
     *
     * @param filename
     */
    checkFile(filename: string): boolean | null {
        return this.phplint.checkFileSync(
            filename,
            false,
            1,
            this.workingDirectory,
            true
        )
    }
    /**
     *
     * @param tree
     * @param reuse_context
     * @param filename
     * @param depth
     */
    checkTree(tree: NodeTypes.Program, reuse_context = false, filename: string | null = null, depth = 0): boolean {
        try {
            if(this.lastContext && reuse_context) {
                this.lastContext = new Context(this.lastContext)
                if(depth > 0) {
                    this.lastContext.including = true
                }
            } else {
                this.lastContext = new Context()
                this.lastContext.lint = this
            }
            this.lastContext.check(tree)
            return true
        } catch(e) {
            if(e instanceof LintError && filename) {
                throw new LintError(`${filename}: ${e.message}`)
            } else {
                throw e
            }
        }
    }
}