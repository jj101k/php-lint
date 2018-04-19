<?php
require_once "lib/f.php";
/**
 *
 */
class FF extends F {
    /**
     * @return int
     */
    public function ff() {
        return 1;
    }
    /**
     * @return int
     */
    public function ff2() {
        return $this->f()->ff();
    }
}