<?php
/** test */
class InheritB extends InheritA {
    /** test */
    public function bb() {
    }
    /** test */
    public function b() {
        $this->a()->bb();
    }
}
