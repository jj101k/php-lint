PHPLint = require("./index")
process.argv.slice(2).forEach(
    filename => PHPLint.checkFileSync(filename)
)
