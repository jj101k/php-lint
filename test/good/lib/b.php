<?php
class B extends A {
    public function _b() {
    }
    public function b() {
        $this->a()->_b();
    }
}
