var phpLint = require("../src/index");
var glob = require("glob");

var good_code = "<?php $foo = '1234'; echo $foo;";
var good_files = glob.sync('test/good/*.php');
var bad_code = "<?php echo $foo;";
var bad_files = glob.sync('test/bad/*.php');

var skip_files = glob.sync('test/skip/*.php')
var bug_files = glob.sync('test/bug/*.php')


exports["test async"] = (assert, done) => {
    return Promise.all(
        [
            phpLint.resetGlobalState().checkSourceCode(good_code).then(
                result => assert.ok(result, "Valid code looks ok")
            ),
            phpLint.resetGlobalState().checkSourceCode(bad_code).catch(
                error => assert.ok(error, "Invalid code looks bad")
            ),
        ].concat(
            bad_files.map(bad_file => phpLint.resetGlobalState().checkFile(bad_file, 0, null).catch(
                error => assert.ok(error, `Invalid file ${bad_file} looks bad`)
            ))
        ).concat(
            skip_files.map(skip_file => phpLint.resetGlobalState().checkFile(skip_file, 0, null).catch(
                error => assert.ok(error, `Skip ${skip_file}`)
            ))
        ).concat(
            bug_files.map(file => phpLint.resetGlobalState().checkFile(file, 0, null).then(
                result => assert.ok(result, `Valid file ${file} looks ok`)
            ))
        ).concat(
            good_files.map(good_file => phpLint.resetGlobalState().checkFile(good_file, 0, null).then(
                result => assert.ok(result, `Valid file ${good_file} looks ok`)
            ))
        )
    ).then(() => {
        done();
    });
};
exports["test sync"] = (assert) => {
    var result = phpLint.resetGlobalState().checkSourceCodeSync(good_code);
    assert.ok(result, "Valid code looks ok");
    good_files.forEach(good_file => assert.ok(
        phpLint.resetGlobalState().checkFileSync(good_file),
        `Valid file ${good_file} looks ok`
    ));
    bug_files.forEach(file => assert.ok(
        phpLint.resetGlobalState().checkFileSync(file),
        `Valid file ${file} looks ok`
    ));
    assert.throws(() => {
        var result = phpLint.resetGlobalState().checkSourceCodeSync(bad_code);
    }, "Invalid code looks bad");
    bad_files.forEach(bad_file => assert.throws(() => {
        var result = phpLint.resetGlobalState().checkFileSync(bad_file);
    }, `Invalid file ${bad_file} looks bad`));
    skip_files.forEach(skip_file => assert.throws(() => {
        var result = phpLint.resetGlobalState().checkFileSync(skip_file);
    }, `Skip ${skip_file}`));
};

if (module == require.main) require('test').run(exports)
