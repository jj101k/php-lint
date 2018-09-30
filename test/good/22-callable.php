<?php
/**
 * @param callable $test_c
 * @return callable
 */
function foo(callable $test_c): callable {
    $test_c();
    return function() {};
}
foo(function() {});
