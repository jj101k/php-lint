var phpLint = require("../src/index");
var glob = require("glob");

var good_code = "<?php $foo = '1234'; echo $foo;";
var good_files = glob.sync('test/good-*.php');
var bad_code = "<?php echo $foo;";
var bad_files = glob.sync('test/bad-*.php');

exports["test async"] = (assert, done) => {
    return Promise.all(
        [
            phpLint.checkSourceCode(good_code).then(
                result => assert.ok(result, "Valid code looks ok")
            ),
            phpLint.checkSourceCode(bad_code).catch(
                error => assert.ok(error, "Invalid code looks bad")
            ),
        ].concat(
            bad_files.map(bad_file => phpLint.checkFile(bad_file).catch(
                error => assert.ok(error, `Invalid file ${bad_file} looks bad`)
            ))
        ).concat(
            good_files.map(good_file => phpLint.checkFile(good_file).then(
                result => assert.ok(result, `Valid file ${good_file} looks ok`)
            ))
        )
    ).then(() => {
        done();
    });
};
exports["test sync"] = (assert) => {
    var result = phpLint.checkSourceCodeSync(good_code);
    assert.ok(result, "Valid code looks ok");
    good_files.forEach(good_file => assert.ok(
        phpLint.checkFileSync(good_file),
        `Valid file ${good_file} looks ok`
    ));
    assert.throws(() => {
        var result = phpLint.checkSourceCodeSync(bad_code);
    }, "Invalid code looks bad");
    bad_files.forEach(bad_file => assert.throws(() => {
        var result = phpLint.checkFileSync(bad_file);
    }, `Invalid file ${bad_file} looks bad`));
};

if (module == require.main) require('test').run(exports)
