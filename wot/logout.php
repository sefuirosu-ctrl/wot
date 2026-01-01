<?php
session_start();

$BASE = "/wot/";

session_unset();
session_destroy();

header("Location: {$BASE}start.php");
exit;
