<?php
/**
 * This tests that the relatively common "computed default value" pattern works
 * without actually allowing null.
 *
 * In other words, foo() should be allowed but foo(null) should not.
 *
 * PHP doesn't (and won't) support this, but it is the correct expression of
 * intent.
 *
 * @param string $bar
 */
function foo(?string $bar = null) {
    $bar = $bar ?? bar();
}
/**
 * @return string
 */
function bar(): string {
    return "foo";
}
/**
 * Does something
 */
function baz() {
    foo(null);
}