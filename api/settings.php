<?php
// api/settings.php
header('Content-Type: application/json');
session_start();

// Конфигурация из .env
$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'vh262911_wot';
$user = getenv('DB_USER') ?: 'vh262911_wot';
$pass = getenv('DB_PASS') ?: '4929Victoria';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}

// Генерация/получение session_id
if (!isset($_SESSION['wot_session_id'])) {
    $_SESSION['wot_session_id'] = bin2hex(random_bytes(16));
}
$session_id = $_SESSION['wot_session_id'];

// Проверить/добавить необходимые поля в таблицу users
ensureSettingsColumns($pdo);

// Основная логика API
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Получить настройки
    getSettings($pdo, $session_id);
    
} elseif ($method === 'POST') {
    // Сохранить настройки
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        echo json_encode(['error' => 'Invalid JSON data']);
        exit;
    }
    
    saveSettings($pdo, $session_id, $data);
    
} else {
    echo json_encode(['error' => 'Method not allowed']);
}

/**
 * Получить настройки
 */
function getSettings($pdo, $session_id) {
    // Сначала пытаемся найти по session_id (гостевая сессия)
    $stmt = $pdo->prepare("SELECT * FROM users WHERE session_id = ? LIMIT 1");
    $stmt->execute([$session_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // Нашли гостевую сессию
        echo json_encode([
            'success' => true,
            'settings' => normalizeUserSettings($user),
            'user_type' => 'guest',
            'username' => $user['username'] ?? 'Guest'
        ]);
        return;
    }
    
    // Если нет гостевой сессии, создаём её
    $guestUsername = 'guest_' . substr($session_id, 0, 8);
    $guestEmail = $guestUsername . '@wot.game';
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO users 
            (username, nickname, email, password_hash, language, difficulty, session_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        // Создаём хэш пароля для гостя (просто session_id)
        $password_hash = password_hash($session_id, PASSWORD_DEFAULT);
        
        $stmt->execute([
            $guestUsername,
            'Guest',
            $guestEmail,
            $password_hash,
            'en',
            'normal',
            $session_id
        ]);
        
        // Получаем созданного гостя
        $userId = $pdo->lastInsertId();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'settings' => normalizeUserSettings($user),
            'user_type' => 'new_guest',
            'username' => $user['username']
        ]);
        
    } catch (PDOException $e) {
        // Если ошибка (например, дубликат username), используем настройки по умолчанию
        echo json_encode([
            'success' => true,
            'settings' => getDefaultSettings(),
            'user_type' => 'default',
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Сохранить настройки
 */
function saveSettings($pdo, $session_id, $data) {
    // Найти пользователя по session_id
    $stmt = $pdo->prepare("SELECT id FROM users WHERE session_id = ? LIMIT 1");
    $stmt->execute([$session_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        // Если пользователь не найден, создаём гостя
        $guestUsername = 'guest_' . substr($session_id, 0, 8);
        $guestEmail = $guestUsername . '@wot.game';
        
        $stmt = $pdo->prepare("
            INSERT INTO users 
            (username, nickname, email, password_hash, session_id) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $password_hash = password_hash($session_id, PASSWORD_DEFAULT);
        $stmt->execute([
            $guestUsername,
            'Guest',
            $guestEmail,
            $password_hash,
            $session_id
        ]);
        
        $userId = $pdo->lastInsertId();
    } else {
        $userId = $user['id'];
    }
    
    // Подготавливаем данные для обновления
    $updateData = prepareUpdateData($data);
    $updateData['id'] = $userId;
    
    // Строим SQL запрос
    $setParts = [];
    $params = [];
    
    foreach ($updateData as $key => $value) {
        if ($key !== 'id') {
            $setParts[] = "`$key` = :$key";
            $params[":$key"] = $value;
        }
    }
    
    $params[':id'] = $userId;
    
    $sql = "UPDATE users SET " . implode(', ', $setParts) . 
           " WHERE id = :id";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true,
            'message' => 'Settings saved successfully',
            'user_id' => $userId
        ]);
        
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Save failed: ' . $e->getMessage()
        ]);
    }
}

/**
 * Подготовить данные для обновления
 */
function prepareUpdateData($data) {
    $defaults = getDefaultSettings();
    $result = [];
    
    foreach ($defaults as $key => $defaultValue) {
        if (isset($data[$key])) {
            $result[$key] = $data[$key];
        }
    }
    
    // Преобразовать boolean значения
    $booleanFields = ['mute_sounds', 'mute_music', 'ghost_piece', 'hold_preview', 'next_preview', 'grid_lines'];
    foreach ($booleanFields as $field) {
        if (isset($result[$field])) {
            $result[$field] = $result[$field] ? 1 : 0;
        }
    }
    
    return $result;
}

/**
 * Нормализовать настройки пользователя
 */
function normalizeUserSettings($user) {
    $defaults = getDefaultSettings();
    $result = [];
    
    foreach ($defaults as $key => $defaultValue) {
        if (isset($user[$key]) && $user[$key] !== null) {
            // Преобразовать boolean значения
            if (is_bool($defaultValue)) {
                $result[$key] = (bool)$user[$key];
            } elseif (is_int($defaultValue)) {
                $result[$key] = (int)$user[$key];
            } else {
                $result[$key] = $user[$key];
            }
        } else {
            $result[$key] = $defaultValue;
        }
    }
    
    return $result;
}

/**
 * Получить настройки по умолчанию
 */
function getDefaultSettings() {
    return [
        'language' => 'en',
        'difficulty' => 'normal',
        'sound_volume' => 80,
        'music_volume' => 60,
        'mute_sounds' => false,
        'mute_music' => false,
        'ghost_piece' => true,
        'hold_preview' => true,
        'next_preview' => true,
        'grid_lines' => true
    ];
}

/**
 * Убедиться, что в таблице users есть все необходимые поля
 */
function ensureSettingsColumns($pdo) {
    $requiredColumns = [
        'sound_volume' => "INT DEFAULT 80",
        'music_volume' => "INT DEFAULT 60",
        'mute_sounds' => "TINYINT(1) DEFAULT 0",
        'mute_music' => "TINYINT(1) DEFAULT 0",
        'ghost_piece' => "TINYINT(1) DEFAULT 1",
        'hold_preview' => "TINYINT(1) DEFAULT 1",
        'next_preview' => "TINYINT(1) DEFAULT 1",
        'grid_lines' => "TINYINT(1) DEFAULT 1",
        'session_id' => "VARCHAR(255)",
        'updated_at' => "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ];
    
    foreach ($requiredColumns as $column => $definition) {
        try {
            $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE '$column'");
            if ($stmt->rowCount() === 0) {
                // Колонка отсутствует, добавляем
                $pdo->exec("ALTER TABLE users ADD COLUMN `$column` $definition");
                error_log("Added column $column to users table");
            }
        } catch (Exception $e) {
            error_log("Error adding column $column: " . $e->getMessage());
        }
    }
}
?>