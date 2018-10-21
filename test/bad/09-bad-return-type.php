<?php
/** */
function foo(): int {
    return "1"; /// @assert bad type: is string, must be int
}
