const getopt = require("node-getopt")
const PHPLint = require("./index")

let opt = getopt.create([
    ["x" , "exclude-tests=ARG" , "List of tests to exclude"],
    ["t" , "show-tests"  , "Show list of tests which will be included"],
    ["h" , "help" , "Display this help"],
    ["v" , "version" , "Show version"]
]).bindHelp().parseSystem()

if(opt.options.version) {
    console.log("0.2.0")
} else {
    if(opt.options["exclude-tests"]) {
        opt.options["exclude-tests"].split(/,/).forEach(x => {
            /** @type {string[]} */
            let parts = x.split(/[.]/)
            let ignore_map = PHPLint.ignoreErrorMap
            if(parts.length > 1) {
                parts.slice(0, parts.length - 1).forEach(
                    p => {
                        ignore_map = ignore_map[p]
                    }
                )
            }
            ignore_map[parts[parts.length - 1]] = true
        })
    }
    if(opt.options["show-tests"]) {
        let out = {}
        Object.keys(PHPLint.ignoreErrorMap).forEach(
            k => {
                if(typeof PHPLint.ignoreErrorMap[k] == "boolean") {
                    out[k] = PHPLint.ignoreErrorMap[k]
                } else {
                    Object.keys(PHPLint.ignoreErrorMap[k]).filter(
                        m => typeof PHPLint.ignoreErrorMap[k][m] == "boolean"
                    ).forEach(
                        m => {
                            out[k + "." + m] = PHPLint.ignoreErrorMap[k][m]
                        }
                    )
                }
            }
        )
        let test_refs = Object.keys(out).filter(k => !out[k])
        console.log("Enabled tests: " + test_refs.join(","))
    }
    let start_time = new Date().valueOf()
    opt.argv.forEach(
        filename => PHPLint.checkFileSync(filename, false)
    )
    let end_time = new Date().valueOf()
    //console.log(PHPLint.depthCounts)
    console.log(`${PHPLint.processed} files processed in ${(end_time - start_time)/1000} seconds`)
}
