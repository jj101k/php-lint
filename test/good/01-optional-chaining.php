<?php

require_once "lib/foo.php";
require_once "lib/bar.php";

$test_oc = new Foo();

if(
    $test_oc and
    $bar = $test_oc->justFoo() and
    $bar->justBar()
) {
    echo 1;
}
