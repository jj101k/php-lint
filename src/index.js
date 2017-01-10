var phpParser = require("php-parser");
var fs = require("fs");
var lint = require("./lint");

var parser = new phpParser({
    parser: {
        debug: false,
        extractDoc: false,
    },
    ast: {
        withPositions: true,
    },
});

exports.checkSourceCode = function(code) {
    //
    return new Promise((resolve, reject) => {
        try {
            var tree = parser.parseCode(code);
            resolve(lint.check(tree));
        } catch(e) {
            reject(e);
        }
    });
};

exports.checkSourceCodeSync = function(code) {
    var tree = parser.parseCode(code);
    return lint.check(tree);
};

exports.checkFile = function(filename) {
    //
    return new Promise((resolve, reject) => {
        fs.readFile(filename, "utf8", (err, data) => {
            if(err) {
                reject(err);
            } else {
                try {
                    var tree = parser.parseCode(data, filename);
                    resolve(lint.check(tree));
                } catch(e) {
                    reject(e);
                }
            }
        });
    });
};
exports.checkFileSync = function(filename) {
    //
    var data = fs.readFileSync(filename, "utf8");
    var tree = parser.parseCode(data, filename);
    return lint.check(tree);
};
