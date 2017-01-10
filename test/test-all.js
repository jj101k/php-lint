var phpLint = require("../src/index");

var good_code = "<?php $foo = '1234'; echo $foo;";
var good_file = "test/good-sample.php";
var bad_code = "<?php echo $foo;";
var bad_file = "test/bad-sample.php";

exports["test async"] = (assert, done) => {
    return Promise.all([
        phpLint.checkSourceCode(good_code).then(
            result => assert.ok(result, "Valid code looks ok")
        ),
        phpLint.checkFile(good_file).then(
            result => assert.ok(result, "Valid file looks ok")
        ),
        phpLint.checkSourceCode(bad_code).catch(
            error => assert.ok(error, "Invalid code looks bad")
        ),
        phpLint.checkFile(bad_file).catch(
            error => assert.ok(error, "Invalid file looks bad")
        ),
    ]).then(() => {
        done();
    });
};
exports["test sync"] = (assert) => {
    var result = phpLint.checkSourceCodeSync(good_code);
    assert.ok(result, "Valid code looks ok");
    var result = phpLint.checkFileSync(good_file);
    assert.ok(result, "Valid file looks ok");
    assert.throws(() => {
        var result = phpLint.checkSourceCodeSync(bad_code);
    }, "Invalid code looks bad");
    assert.throws(() => {
        var result = phpLint.checkFileSync(bad_file);
    }, "Invalid file looks bad");
};

if (module == require.main) require('test').run(exports)
