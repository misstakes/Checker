<?php
header('Content-Type: application/json');
$pinCallBackData = file_get_contents('php://input');
$file = "PINURLcallback.json";
$log  = fopen($file, 'a');
fwrite($log, $pinCallBackData);
fclose($log);
?>