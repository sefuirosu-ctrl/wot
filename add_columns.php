<?php
// add_columns.php - безопасное добавление колонок
$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'vh262911_wot';
$user = getenv('DB_USER') ?: 'vh262911_wot';
$pass = getenv('DB_PASS') ?: '4929Victoria';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database: $dbname\n\n";
    
    // Колонки для добавления
    $columns = [
        'sound_volume' => "INT DEFAULT 80 AFTER difficulty",
        'music_volume' => "INT DEFAULT 60 AFTER sound_volume",
        'mute_sounds' => "TINYINT(1) DEFAULT 0 AFTER music_volume",
        'mute_music' => "TINYINT(1) DEFAULT 0 AFTER mute_sounds",
        'ghost_piece' => "TINYINT(1) DEFAULT 1 AFTER mute_music",
        'hold_preview' => "TINYINT(1) DEFAULT 1 AFTER ghost_piece",
        'next_preview' => "TINYINT(1) DEFAULT 1 AFTER hold_preview",
        'grid_lines' => "TINYINT(1) DEFAULT 1 AFTER next_preview",
        'session_id' => "VARCHAR(255) AFTER grid_lines",
        'updated_at' => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER session_id"
    ];
    
    foreach ($columns as $column => $definition) {
        try {
            // Проверяем существование колонки
            $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE '$column'");
            if ($stmt->rowCount() === 0) {
                // Колонка не существует, добавляем
                $sql = "ALTER TABLE users ADD COLUMN `$column` $definition";
                $pdo->exec($sql);
                echo "✓ Added column: $column\n";
            } else {
                echo "✓ Column already exists: $column\n";
            }
        } catch (PDOException $e) {
            echo "✗ Error with column $column: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n✅ Database update completed!\n";
    
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>