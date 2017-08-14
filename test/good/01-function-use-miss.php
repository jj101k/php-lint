<?php
$foo = 123;
/** test */
$bar = function() use ($foo) {
  echo 234;
};
