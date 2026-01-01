<?php
// check_tables.php
header('Content-Type: text/plain');

// Конфигурация из .env
$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'vh262911_wot';
$user = getenv('DB_USER') ?: 'vh262911_wot';
$pass = getenv('DB_PASS') ?: '4929Victoria';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database: $dbname\n\n";
    
    // Показать все таблицы
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "Available tables:\n";
    foreach ($tables as $table) {
        echo "- $table\n";
    }
    
    echo "\n";
    
    // Для каждой таблицы показать структуру
    foreach ($tables as $table) {
        echo "Structure of table '$table':\n";
        $stmt = $pdo->query("DESCRIBE $table");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo str_pad("Field", 20) . str_pad("Type", 20) . str_pad("Null", 8) . str_pad("Key", 8) . "Default\n";
        echo str_repeat("-", 60) . "\n";
        
        foreach ($columns as $col) {
            echo str_pad($col['Field'], 20) . 
                 str_pad($col['Type'], 20) . 
                 str_pad($col['Null'], 8) . 
                 str_pad($col['Key'], 8) . 
                 ($col['Default'] ?? 'NULL') . "\n";
        }
        echo "\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>