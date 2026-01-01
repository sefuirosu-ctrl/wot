<?php
// wot/login_process.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require_once __DIR__ . "/db.php";

try {

    // ✔ ИСПРАВЛЕНО ЗДЕСЬ
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        throw new Exception("Empty login or password");
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        throw new Exception("User not found");
    }

    if (!password_verify($password, $user['password_hash'])) {
        throw new Exception("Invalid password");
    }

    $_SESSION['user_id']  = (int)$user['id'];
    $_SESSION['nickname'] = $user['nickname'];

    $settings = ensureUserDefaults($pdo, (int)$user['id']);
    $_SESSION['language']   = $settings['language'];
    $_SESSION['difficulty'] = $settings['difficulty'];

    header("Location: /wot/index.php");
    exit;

} catch (Throwable $e) {
    http_response_code(500);
    echo "<pre>";
    echo "LOGIN ERROR\n\n";
    echo $e->getMessage();
    echo "</pre>";
    exit;
}
