<?php
/**
 * A class
 */
class Test16DateTimeModify {
    /**
     * @return \DateTime|null
     */
    public function test(): ?\DateTime {
        $dt = new \DateTime();
        $dt = $dt->modify("+5 minutes");
        if($dt) {
            return $dt;
        } else {
            return null;
        }
    }
}