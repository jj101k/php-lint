const tests = require("../dist/test/tests.js")

exports["test async"] = tests.async
exports["test sync"] = tests.sync

if(module == require.main) {
    require("test").run(exports)
}
