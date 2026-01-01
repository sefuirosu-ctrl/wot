<?php
// wot/db.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$host = "localhost";
$dbname = "vh262911_wot";
$user = "vh262911_wot";
$pass = "4929Victoria";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        $options
    );
} catch (PDOException $e) {
    die("Database connection failed");
}

/**
 * Ensure user has language & difficulty
 * Columns are assumed to exist
 */
function ensureUserDefaults(PDO $pdo, int $userId): array {
    $stmt = $pdo->prepare("
        SELECT language, difficulty
        FROM users
        WHERE id = ?
    ");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    $language = $user['language'] ?: 'en';
    $difficulty = $user['difficulty'] ?: 'normal';

    if (!$user['language'] || !$user['difficulty']) {
        $update = $pdo->prepare("
            UPDATE users
            SET language = ?, difficulty = ?
            WHERE id = ?
        ");
        $update->execute([$language, $difficulty, $userId]);
    }

    return [
        'language' => $language,
        'difficulty' => $difficulty
    ];
}
