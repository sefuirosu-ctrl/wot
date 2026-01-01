<?php
$ROOT = "/";
$WOT  = "/wot/";
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Login</title>
    <link rel="stylesheet" href="<?= $ROOT ?>css/style.css">
</head>
<body>

<div id="app">
    <div class="panel" style="max-width:360px;">
        <h3>Login</h3>

        <form method="post" action="<?= $WOT ?>login_process.php">
            <input type="text" name="username" placeholder="Username" required><br><br>
            <input type="password" name="password" placeholder="Password" required><br><br>
            <button type="submit">Login</button>
        </form>
    </div>
</div>

</body>
</html>
