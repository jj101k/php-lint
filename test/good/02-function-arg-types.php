<?php
class Foo {

}
function foo(Foo $foo, array $bar, Foo $f = null, array $b = null) {
    echo $foo;
    echo $b;
}
foo();