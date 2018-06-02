<?php
/**
 * @param callable $a
 * @return callable
 */
function foo(callable $a): callable {
    $a();
    return function() {};
}
foo(function() {});