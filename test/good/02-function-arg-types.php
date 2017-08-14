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
  * @param Foo $foo
  * @param array $bar
  * @param Foo|null $f
  * @param array|null $b
  */
function foo(Foo $foo, array $bar, Foo $f = null, array $b = null) {
    echo \Foo::f();
    echo Foo::f();
    echo $foo->g();
    echo $b;
}
foo();
