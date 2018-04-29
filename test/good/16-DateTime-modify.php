<?php
/**
 * A class
 */
class Test16DateTimeModify {
    /**
     * @return \DateTime
     */
    public function test(): \DateTime {
        $dt = new \DateTime();
        return $dt->modify("+5 minutes");
    }
}