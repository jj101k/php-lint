<?php

$abc = "abcde";
preg_match("/abc/", $abc, $md);

print_r($md);

function foo(&$bar) {
    $bar = 1;
}

foo($baz);
echo $baz . "\n";
