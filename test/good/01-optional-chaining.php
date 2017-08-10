<?php

require_once "lib/foo.php";
require_once "lib/bar.php";

$foo = new Foo();

if(
    $foo and
    $bar = $foo->justFoo() and
    $bar->justBar()
) {
    echo 1;
}
