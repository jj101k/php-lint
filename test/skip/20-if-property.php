<?php
/**
 *
 */
class CloneFoo {
    /**
     * @property \DateTime|null
     */
    private $date;
    /**
     *
     */
    public function foo() {
        if($this->date) {
            echo $this->date->modify("+8 days");
        }
    }
}