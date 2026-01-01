<?php
session_start();

$BASE = "/wot/";
$AUTH = "/wot/wot/";

if (isset($_SESSION['user_id'])) {
    header("Location: {$BASE}index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>World of Tetris — Login</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="<?= $BASE ?>css/style.css">
</head>
<body>

<div id="app">
    <div class="panel" style="max-width:360px;">
        <h3>Login</h3>

        <!-- ВАЖНО: action указывает в /wot/wot/ -->
        <form action="<?= $AUTH ?>login_process.php" method="post">
            <input type="text" name="username" placeholder="Username" required><br><br>
            <input type="password" name="password" placeholder="Password" required><br><br>
            <button type="submit">Login</button>
        </form>

        <hr>

        <!-- ССЫЛКА В /wot/wot/ -->
        <a href="<?= $AUTH ?>register.php">Create account</a>
    </div>
</div>

</body>
</html>
