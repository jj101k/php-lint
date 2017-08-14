<?php
/** test */
class B extends A {
    /** test */
    public function bb() {
    }
    /** test */
    public function b() {
        $this->a()->bb();
    }
}
