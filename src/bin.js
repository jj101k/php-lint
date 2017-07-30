const PHPLint = require("./index")
let start_time = new Date().valueOf()
process.argv.slice(2).forEach(
    filename => PHPLint.checkFileSync(filename, false)
)
let end_time = new Date().valueOf()
//console.log(PHPLint.depthCounts)
console.log(`${PHPLint.processed} files processed in ${(end_time - start_time)/1000} seconds`)
