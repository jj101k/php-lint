<?php
$foo = 123;
/** Does something */
$bar = function() use ($foo) {
  echo $foo;
};
