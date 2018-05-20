<?php
/**
 * @return \DateTime|null
 */
function x(): ?\DateTime {
    if(true) {
        $times = array_combine(
            ["foo"],
            [new \DateTime()]
        );
        return $times["foo"];
    } elseif(true) {
        $times = array_filter([new \DateTime()]);
        return $times[0];
    } elseif(true) {
        $times = array_map(function() {return new \DateTime();}, [0]);
        return $times[0];
    } elseif(true) {
        $times = [new \DateTime()];
        return array_pop($times);
    } elseif(true) {
        $times = [new \DateTime()];
        return array_shift($times);
    } elseif(true) {
        $times = array_values(["foo" => new \DateTime()]);
        return $times[0];
    }
}
echo x()->format("c");
