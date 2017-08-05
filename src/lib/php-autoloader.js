let fs = require("fs")
import Lint from "./lint"
import {GlobalContext} from "./global-context"
import PHPLint from "./php-lint"
import * as ShadowTree from "./shadowtree"
export default class PHPAutoloader {
    /**
     * Build the object
     * @param {{[x: string]: string[]}} paths 
     * @param {string[]} [classmap_paths]
     */
    constructor(paths, classmap_paths = []) {
        this.classmapPaths = classmap_paths
        this.paths = paths
    }
    /**
     * @type {{[x: string]: string}} Maps class names to filenames for the
     * classmap autoload
     */
    get classmapResults() {
        if(!this._classmapResults) {
            let s = new Date()
            let classmap_results = {}
            this.classmapPaths.forEach(
                path => {
                    let directories = [path]
                    let filenames = []
                    while(directories.length) {
                        let d = directories.shift()
                        if(fs.statSync(d).isDirectory()) {
                            directories = directories.concat(
                                fs.readdirSync(d).filter(
                                    p => !p.match(/^([.]|[.][.])$/)
                                ).map(
                                    p => d + "/" + p
                                )
                            )
                        } else if(d.match(/[.](php|inc)$/)) {
                            filenames.push(d)
                        }
                    }
                    filenames.forEach(filename => {
                        var data = fs.readFileSync(filename, "utf8")
                        var tree = PHPLint.parser.parseCode(data, filename)
                        let top = ShadowTree.Node.typed(tree)
                        let nodes = [top]

                        let namespace
                        while(nodes.length) {
                            let node = nodes.shift()
                            if(
                                node instanceof ShadowTree.Program
                            ) {
                                nodes = node.children.concat(nodes)
                            } else if(
                                node instanceof ShadowTree.UseGroup
                            ) {
                                //
                            } else if(
                                node instanceof ShadowTree.Namespace
                            ) {
                                namespace = node.name
                                nodes = node.children.concat(nodes)
                            } else if(
                                node instanceof ShadowTree.Class
                            ) {
                                let class_name
                                if(namespace) {
                                    class_name = namespace + "\\" + node.name
                                } else {
                                    class_name = node.name
                                }
                                classmap_results[class_name] = filename
                            }
                        }
                    })
                }
            )
            let e = new Date()
            if(this.classmapPaths.length) {
                console.log(`Trivial classmap load took ${(e-s)/1000} seconds`)
            }
            this._classmapResults = classmap_results
        }
        return this._classmapResults
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
        for(var k in autoloader.paths) {
            this.paths[k] = (this.paths[k]||[]).concat(autoloader.paths[k])
        }
        this.classmapPaths = this.classmapPaths.concat(autoloader.classmapPaths)
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
        return this.classmapResults[canonical_class_name]
    }
}