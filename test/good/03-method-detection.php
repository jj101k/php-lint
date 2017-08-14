<?php
/** test */
class Foo {
    /** test
      * @param mixed $a
      * @return mixed
      */
    public function recurses($a) {
        if($a > 1) {
            return $a * $this->recurses($a - 1);
        } else {
            return $a;
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
