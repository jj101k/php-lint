<?php
/** test */
class InheritC {
    /** test */
    public function c() {
        $bee = new InheritB();
        $bee->a()->bb();
    }
}
