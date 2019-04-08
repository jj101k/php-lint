<?php
$dt = (new \DateTime())->modify("x");
if($dt instanceof \DateTime) {
    echo $dt->setDate(2000, 1, 2)->format("c");
} else {
    echo $dt ?: "false";
}
if(is_a($dt, "DateTime")) {
    echo $dt->setDate(2000, 1, 2)->format("c");
} else {
    echo $dt ?: "false";
}