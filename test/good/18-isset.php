<?php
$dt = (new \DateTime())->modify("-10 minutes");
if($dt) {
    $dtn = $dt;
} else {
    $dtn = null;
}
if(isset($dtn)) {
    echo $dtn->format("c");
}