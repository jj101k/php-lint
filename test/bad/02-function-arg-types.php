<?php
/** */
class Foo {
    /** */
    public static function f() {
        return 1;
    }
    /** */
    public function g() {
        return "2";
    }
}
/** */
function foo(Foo $foo, array $bar, Foo $f = null, array $b = null) {
    echo \Foo::g();
    echo $foo->g();
    echo $b; /// @assert wrong type for echo
}
foo(new Foo(), []);
/// @know typeof(b) == [array, null]
/// @know typeof(echo.arguments[0]) == string