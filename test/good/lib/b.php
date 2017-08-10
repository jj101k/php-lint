<?php
class B extends A {
    public function bb() {
    }
    public function b() {
        $this->a()->bb();
    }
}
