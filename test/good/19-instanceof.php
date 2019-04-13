<?php
$dt = (new \DateTime())->modify("x");
// This tests type inference via instanceof
if($dt instanceof \DateTime) {
    // If in here, dt has a specific type (\DateTime)
    echo $dt->setDate(2000, 1, 2)->format("c");
} else {
    // If we're in here, because the other types have been exhausted, it's
    // false.
    echo $dt ?: "false";
}
// This tests type inference via is_a.
if(is_a($dt, "DateTime")) {
    // If we're in here, either $dt is a class name <= DateTime, or an instance
    // of DateTime. Since only one is supported, that should be the one we get.
    echo $dt->setDate(2000, 1, 2)->format("c");
} else {
    // If we're in here, because the other types have been exhausted, it's
    // false.
    echo $dt ?: "false";
}