const tests = require("../dist/test/tests.js")

exports["test sync"] = tests.sync

if(module == require.main) {
    require("test").run(exports)
}
