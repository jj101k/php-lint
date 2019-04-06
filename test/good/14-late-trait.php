<?php
require_once "lib/LateTraitD.php";
require_once "lib/LateTraitE.php";
/**
 *
 */
class Foo {
    use LateTraitD;
    use LateTraitE;
}