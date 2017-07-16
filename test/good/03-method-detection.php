<?php
class Foo {
    public function recurses($a) {
        if($a > 1) {
            return $a * $this->recurses($a - 1);
        } else {
            return $a;
        }
    }
    public function early() {
        return $this->toolate();
    }
    private function toolate() {
        return "";
    }
    public function late() {
        return $this->toolate();
    }
}
