<?php
/**
 * @param mixed $in
 * @return mixed
 */
function foo($in) {
    return $in;
}
/**
 * @param DateTime $in
 * @return DateTime
 */
function bar(DateTime $in): DateTime {
    return foo($in);
}
echo bar(new DateTime())->format("c");