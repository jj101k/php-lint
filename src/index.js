var phpParser = require("php-parser");
var fs = require("fs");
require("import-export")
var lint = require("./lib/lint");

var parser = new phpParser({
    parser: {
        debug: false,
        extractDoc: false,
    },
    ast: {
        withPositions: true,
    },
});

exports.checkSourceCode = function(code, throw_on_error = true) {
    //
    return new Promise((resolve, reject) => {
        try {
            var tree = parser.parseCode(code);
            resolve(lint.check(tree, null, throw_on_error));
        } catch(e) {
            reject(e);
        }
    });
};

exports.checkSourceCodeSync = function(code, throw_on_error = true) {
    var tree = parser.parseCode(code);
    return lint.check(tree, null, throw_on_error);
};

exports.checkFile = function(filename, throw_on_error = true) {
    //
    return new Promise((resolve, reject) => {
        fs.readFile(filename, "utf8", (err, data) => {
            if(err) {
                reject(err);
            } else {
                try {
                    var tree = parser.parseCode(data, filename);
                    resolve(lint.check(tree, filename, throw_on_error));
                } catch(e) {
                    reject(e);
                }
            }
        });
    });
};
exports.checkFileSync = function(filename, throw_on_error = true) {
    //
    var data = fs.readFileSync(filename, "utf8");
    var tree = parser.parseCode(data, filename);
    return lint.check(tree, filename, throw_on_error);
};
