<?php
/** test */
class InheritA {
    /** @return self */
    public function aa() {
        return $this;
    }
    /** @return self */
    public function a() {
        return $this->aa();
    }
}
