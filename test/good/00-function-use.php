<?php
$test_fu = 123;
/** Does something */
$bar = function() use ($test_fu) {
  echo $test_fu;
};
