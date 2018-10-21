<?php
/** test */
class Foo {
    /** test
      * @return int
      */
    public static function f() {
        return 1;
    }
    /** test
      * @return string
      */
    public function g() {
        return "2";
    }
}
/** test
  * @param Foo $test_fat
  * @param array $bar
  * @param Foo|null $f
  * @param array|null $b
  */
function foo(Foo $test_fat, array $bar, Foo $f = null, array $b = null) {
    echo \Foo::f();
    echo Foo::f();
    echo $test_fat->g();
    echo $b;
}
foo(new Foo(), []);
