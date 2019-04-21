const PHPLint = require("./index").default

const files = process.argv.slice(2)

for(const file of files) {
    new PHPLint().checkFileSync(file, 0, null)
}