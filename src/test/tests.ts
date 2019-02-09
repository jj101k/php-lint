import PHPLint from "../index"
import glob from "glob"

const good_code = "<?php $foo = '1234'; echo $foo;"
const good_files = glob.sync("test/good/*.php").sort()
const bad_code = "<?php echo $foo;s"
const bad_files = glob.sync("test/bad/*.php").sort()

const skip_files = glob.sync("test/skip/*.php").sort()
const bug_files = glob.sync("test/bug/*.php").sort()

type assert = {
    ok(result: any, message: string): boolean,
    throws(callable: () => any, message: string): boolean,
}

export function async(assert: assert, done: () => void) {
    return Promise.all(
        [
            new PHPLint().checkSourceCode(good_code).then(
                result => assert.ok(result, "Valid code looks ok")
            ),
            new PHPLint().checkSourceCode(bad_code).catch(
                error => assert.ok(error, "Invalid code looks bad")
            ),
        ].concat(
            bad_files.map(
                bad_file => new PHPLint().checkFile(bad_file, 0, null).catch(
                    error => assert.ok(error, `Invalid file ${bad_file} looks bad`)
                )
            )
        ).concat(
            skip_files.map(
                skip_file => new PHPLint().checkFile(skip_file, 0, null).catch(
                    error => assert.ok(error, `Skip ${skip_file}`)
                )
            )
        ).concat(
            bug_files.map(
                file => new PHPLint().checkFile(file, 0, null).then(
                    result => assert.ok(result, `Valid file ${file} looks ok`)
                )
            )
        ).concat(
            good_files.map(
                good_file => new PHPLint().checkFile(good_file, 0, null).then(
                    result => assert.ok(result, `Valid file ${good_file} looks ok`)
                )
            )
        )
    ).then(done)
}
export function sync(assert: assert) {
    const result = new PHPLint().checkSourceCodeSync(good_code)
    assert.ok(result, "Valid code looks ok")

    good_files.forEach(good_file => assert.ok(
        new PHPLint().checkFileSync(good_file),
        `Valid file ${good_file} looks ok`
    ))
    bug_files.forEach(file => assert.ok(
        new PHPLint().checkFileSync(file),
        `Valid file ${file} looks ok`
    ))
    assert.throws(
        () => new PHPLint().checkSourceCodeSync(bad_code),
        "Invalid code looks bad"
    )
    bad_files.forEach(bad_file => assert.throws(
        () => new PHPLint().checkFileSync(bad_file),
        `Invalid file ${bad_file} looks bad`
    ))
    skip_files.forEach(skip_file => assert.throws(
        () => new PHPLint().checkFileSync(skip_file),
        `Skip ${skip_file}`
    ))
}