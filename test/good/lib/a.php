<?php
/** test */
class A {
    /** @return self */
    public function aa() {
        return $this;
    }
    /** @return self */
    public function a() {
        return $this->aa();
    }
}
