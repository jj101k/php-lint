<?php

/**
 * @return int[]
 */
function foo(): array {
    return [1,2,3];
}

/**
 * @return int
 */
function bar(): int {
    foreach(foo() as $f) {
        return $f;
    }
}
/**
 * @return int|null
 */
function baz(): ?int {
    return foo()[0];
}