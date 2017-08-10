<?php
class A {
    public function _a() {
        return $this;
    }
    public function a() {
        return $this->_a();
    }
}
