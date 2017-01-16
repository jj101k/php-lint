<?php
$foo = 123;
$bar = function() use ($foo) {
  echo $foo;
};
