<?php

class Foo {
    public function justFoo() {
        return new Bar();
    }
}
class Bar {
    public function justBar() {
        return 1;
    }
}

$foo = new Foo();

if(
    $foo and
    $bar = $foo->justFoo() and
    $bar->justBar()
) {
    echo 1;
}
