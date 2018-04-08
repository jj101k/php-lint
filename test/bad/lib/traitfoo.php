<?php
/**
 * Foo
 */
trait Foo {
    /**
     * @return self
     */
    public function bar(): self {
        return new DateTime();
    }
}