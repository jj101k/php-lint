const PHPLint = require("./index").default

const files = process.argv.slice(2)

files.forEach(
    file => new PHPLint().checkFile(file, 0, null)
)