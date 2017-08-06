<?php
class A {
    public function _a() {
        return $this;
    }
    public function a() {
        return $this->_a();
    }
}
class B extends A {
    public function _b() {
    }
    public function b() {
        $this->a()->_b();
    }
}
class C {
    public function c() {
        $b = new B();
        $b->a()->_b();
    }
}
