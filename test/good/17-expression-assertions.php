<?php
/**
 * @return string
 */
function foo(): string {
    $plaintext = openssl_decrypt("abc");
    if($plaintext) {
        return $plaintext;
    } else {
        return "NOOO";
    }
}
/**
 * @return string
 */
function bar(): string {
    $plaintext = openssl_decrypt("abc");
    if(!$plaintext) {
        return "NOOOO";
    } else {
        return $plaintext;
    }
}
/**
 * @return \DateTime
 */
function baz(): \DateTime {
    $dt = (new \DateTime())->modify("+1 day");
    if($dt) {
        return $dt;
    } else {
        return new \DateTime();
    }
}
/**
 * @return string
 */
function boz(): string {
    $dt = (new \DateTime())->modify("+1 day");
    if($dt) {
        return $dt->format("c");
    } else {
        return (new \DateTime())->format("c");
    }
}
/**
 * @return string
 */
function bez(): string {
    $dt = (new \DateTime())->modify("+1 day");
    if(!$dt) {
        return (new \DateTime())->format("c");
    } else {
        return $dt->format("c");
    }
}