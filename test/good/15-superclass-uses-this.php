<?php
require_once "lib/SuperclassF.php";
/**
 *
 */
class FF extends SuperclassF {
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