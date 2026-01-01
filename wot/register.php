<?php
$BASE = "/wot/";
$AUTH = "/wot/wot/";
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>World of Tetris — Register</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="<?= $BASE ?>css/style.css">
</head>
<body>

<div id="app">
    <div class="panel" style="max-width:360px;">
        <h3>Create Account</h3>

        <!-- КРИТИЧНО: action В /wot/wot/register_process.php -->
        <form method="post" action="<?= $AUTH ?>register_process.php">
            <input type="text" name="username" placeholder="Username" required><br><br>
            <input type="text" name="nickname" placeholder="Nickname" required><br><br>
            <input type="email" name="email" placeholder="Email" required><br><br>
            <input type="password" name="password" placeholder="Password" required><br><br>
            <button type="submit">Register</button>
        </form>

        <br>

        <!-- Назад в старт -->
        <a href="<?= $BASE ?>start.php">Back to login</a>
    </div>
</div>

</body>
</html>
