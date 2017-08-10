<?php
class A {
    public function aa() {
        return $this;
    }
    public function a() {
        return $this->aa();
    }
}
