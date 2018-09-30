<?php
/** test */
class Foo {
    /** test
      * @param mixed $test_md
      * @return mixed
      */
    public function recurses($test_md) {
        if($test_md > 1) {
            return $test_md * $this->recurses($test_md - 1);
        } else {
            return $test_md;
        }
    }
    /** test
      * @return string
      */
    public function early() {
        return $this->toolate();
    }
    /** test
      * @return string
      */
    private function toolate() {
        return "";
    }
    /** test
      * @return string
      */
    public function late() {
        return $this->toolate();
    }
}
