<?php
// index.php - ГЛАВНЫЙ ФАЙЛ С АУТЕНТИФИКАЦИЕЙ И НАСТРОЙКАМИ
session_start();

// Подключение к базе данных
$host = getenv('DB_HOST') ?: 'localhost';
$dbname = getenv('DB_NAME') ?: 'vh262911_wot';
$user = getenv('DB_USER') ?: 'vh262911_wot';
$pass = getenv('DB_PASS') ?: '4929Victoria';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die('Database connection failed: ' . $e->getMessage());
}

// Проверка аутентификации
$isLoggedIn = isset($_SESSION['user_id']);
$currentUser = null;

if ($isLoggedIn) {
    $stmt = $pdo->prepare("SELECT id, username, nickname, language, difficulty FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Устанавливаем язык из настроек пользователя
    if ($currentUser && $currentUser['language']) {
        $_SESSION['language'] = $currentUser['language'];
    }
}

// Установка языка
$availableLanguages = ['en', 'ru', 'es', 'fr', 'de'];
$defaultLanguage = 'en';

if (isset($_GET['lang']) && in_array($_GET['lang'], $availableLanguages)) {
    $_SESSION['language'] = $_GET['lang'];
} elseif (!isset($_SESSION['language'])) {
    $_SESSION['language'] = $defaultLanguage;
}

$currentLanguage = $_SESSION['language'];

// Обработка выхода
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="<?php echo $currentLanguage; ?>" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-i18n="title_main">WORLD OF TETRIS</title>
    
    <!-- CSS Files -->
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/menu.css">
    <link rel="stylesheet" href="css/encyclopedia.css">
    <link rel="stylesheet" href="css/modals.css">
</head>
<body>
    <!-- Информация о пользователе -->
    <?php if ($isLoggedIn && $currentUser): ?>
    <div class="user-info">
        <span data-i18n="welcome">Welcome</span>, <strong><?php echo htmlspecialchars($currentUser['nickname']); ?></strong>
        <a href="?logout=1" data-i18n="logout">Logout</a>
    </div>
    <?php endif; ?>

    <!-- ===============================
        AUTHENTICATION FORMS
    ================================ -->
    <?php if (!$isLoggedIn): ?>
        <?php if (isset($_GET['register'])): ?>
            <!-- REGISTRATION FORM -->
            <div class="auth-form">
                <h2 data-i18n="register_title">Register</h2>
                
                <?php if (isset($_GET['error'])): ?>
                <div class="message error">
                    <?php 
                    $errors = [
                        'empty' => 'Please fill all fields',
                        'username_taken' => 'Username already taken',
                        'email_taken' => 'Email already registered',
                        'password_mismatch' => 'Passwords do not match',
                        'invalid_email' => 'Invalid email address',
                        'weak_password' => 'Password must be at least 6 characters'
                    ];
                    echo $errors[$_GET['error']] ?? 'Registration failed';
                    ?>
                </div>
                <?php endif; ?>
                
                <?php if (isset($_GET['success'])): ?>
                <div class="message success">
                    <span data-i18n="register_success">Registration successful! You can now login.</span>
                </div>
                <?php endif; ?>
                
                <form action="wot/register_process.php" method="POST">
                    <div class="form-group">
                        <label data-i18n="username">Username</label>
                        <input type="text" name="username" required 
                               value="<?php echo htmlspecialchars($_GET['username'] ?? ''); ?>">
                    </div>
                    
                    <div class="form-group">
                        <label data-i18n="nickname">Nickname</label>
                        <input type="text" name="nickname" required 
                               value="<?php echo htmlspecialchars($_GET['nickname'] ?? ''); ?>">
                    </div>
                    
                    <div class="form-group">
                        <label data-i18n="email">Email</label>
                        <input type="email" name="email" required 
                               value="<?php echo htmlspecialchars($_GET['email'] ?? ''); ?>">
                    </div>
                    
                    <div class="form-group">
                        <label data-i18n="password">Password</label>
                        <input type="password" name="password" required>
                    </div>
                    
                    <div class="form-group">
                        <label data-i18n="confirm_password">Confirm Password</label>
                        <input type="password" name="confirm_password" required>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="window.location.href='index.php'">
                            <span data-i18n="back">Back</span>
                        </button>
                        <button type="submit" class="btn-primary" data-i18n="register">Register</button>
                    </div>
                </form>
                
                <div class="auth-links">
                    <span data-i18n="already_have_account">Already have an account?</span>
                    <a href="index.php" data-i18n="login_here">Login here</a>
                </div>
            </div>
            
        <?php else: ?>
            <!-- LOGIN FORM -->
            <div class="auth-form">
                <h2 data-i18n="login_title">Login</h2>
                
                <?php if (isset($_GET['error'])): ?>
                <div class="message error">
                    <?php 
                    $errors = [
                        'empty' => 'Please fill all fields',
                        'invalid_credentials' => 'Invalid username or password',
                        'not_found' => 'User not found'
                    ];
                    echo $errors[$_GET['error']] ?? 'Login failed';
                    ?>
                </div>
                <?php endif; ?>
                
                <form action="wot/login_process.php" method="POST">
                    <div class="form-group">
                        <label data-i18n="username_email">Username or Email</label>
                        <input type="text" name="username" required 
                               value="<?php echo htmlspecialchars($_GET['username'] ?? ''); ?>">
                    </div>
                    
                    <div class="form-group">
                        <label data-i18n="password">Password</label>
                        <input type="password" name="password" required>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary" data-i18n="login">Login</button>
                    </div>
                </form>
                
                <div class="auth-links">
                    <span data-i18n="no_account">Don't have an account?</span>
                    <a href="index.php?register=1" data-i18n="register_here">Register here</a>
                </div>
            </div>
        <?php endif; ?>
    <?php else: ?>
    
    <!-- ===============================
        START SCREEN - MENU SYSTEM (только для авторизованных)
    ================================ -->
    <div id="startScreen" class="start-screen menu-title">
        <!-- TITLE MENU -->
        <div class="menu-panel" data-menu="title">
            <h2 data-i18n="title_main">WORLD OF TETRIS</h2>
            <div class="subtitle" data-i18n="subtitle">Fragments of the Sleepless Realm</div>
            
            <button type="button" class="btn-primary" data-action="start" data-i18n="menu_start">
                Start Game
            </button>
            
            <div class="menu-row">
                <button type="button" data-action="tutorial" data-i18n="menu_tutorial">Tutorial</button>
                <button type="button" data-action="settings" data-i18n="menu_settings">Settings</button>
            </div>
            
            <div class="user-welcome">
                <span data-i18n="logged_in_as">Logged in as</span>: 
                <strong><?php echo htmlspecialchars($currentUser['nickname']); ?></strong>
            </div>
        </div>

        <!-- HERO SELECT MENU -->
        <div class="menu-panel" data-menu="hero">
            <h2 data-i18n="select_hero">Select Hero</h2>
            <div class="select-grid">
                <button type="button" data-hero="mage" data-i18n="hero_mage">🧙 Mage</button>
                <button type="button" data-hero="healer" data-i18n="hero_healer">💖 Healer</button>
                <button type="button" data-hero="warrior" data-i18n="hero_warrior">🗡 Warrior</button>
                <button type="button" data-hero="berserker" data-i18n="hero_berserker">🐉 Berserker</button>
            </div>
        </div>

<!-- PET SELECT MENU -->
<div class="menu-panel" data-menu="pet">
    <h2 data-i18n="select_pet">Select Pet</h2>
    <div class="select-grid">
        <button type="button" data-pet="cat" data-i18n="pet_cat">🐱 Cat</button>
        <button type="button" data-pet="dog" data-i18n="pet_dog">🐶 Dog</button>
        <button type="button" data-pet="fox" data-i18n="pet_fox">🦊 Fox</button>
        <button type="button" data-pet="bear" data-i18n="pet_bear">🐻 Bear</button>
    </div>
</div>

    <!-- ===============================
        MAIN GAME AREA
    ================================ -->
    <main id="gameArea" class="hidden">
        <div class="game-container">
            <!-- HOLD PANEL -->
            <div class="panel">
                <h3 data-i18n="hold">HOLD</h3>
                <canvas id="hold" width="120" height="120"></canvas>
            </div>

            <!-- MAIN GAME FIELD -->
            <div class="game-field">
                <canvas id="game" width="300" height="600"></canvas>
                <div class="game-controls">
                    <button id="pauseBtn" class="btn-icon" data-action="pause" data-i18n-title="pause">⏸</button>
                    <button id="soundBtn" class="btn-icon" data-action="toggle-sound" data-i18n-title="sound">🔊</button>
                </div>
            </div>

            <!-- NEXT PANEL -->
            <div class="panel">
                <h3 data-i18n="next">NEXT</h3>
                <canvas id="next" width="120" height="120"></canvas>
            </div>

            <!-- STATISTICS PANEL -->
            <div class="panel stats">
                <div class="stat">
                    <label data-i18n="score">SCORE</label>
                    <span id="score">0</span>
                </div>
                <div class="stat">
                    <label data-i18n="level">LEVEL</label>
                    <span id="level">1</span>
                </div>
                <div class="stat">
                    <label data-i18n="lines">LINES</label>
                    <span id="lines">0</span>
                </div>
                <div class="stat">
                    <label data-i18n="time">TIME</label>
                    <span id="time">00:00</span>
                </div>
            </div>
        </div>
    </main>

    <!-- ===============================
        ENCYCLOPEDIA / TUTORIAL
    ================================ -->
    <div id="encyclopedia" class="encyclopedia hidden" data-i18n-page="tutorial">
        <div class="encyclopedia-header">
            <h2 data-i18n="tutorial_title">Tutorial</h2>
            <button class="btn-close" data-action="close-encyclopedia" aria-label="Close">×</button>
        </div>
        
        <div class="encyclopedia-tabs">
            <button class="tab-btn active" data-tab="basics" data-i18n="tutorial_tab_basics">Basics</button>
            <button class="tab-btn" data-tab="heroes" data-i18n="tutorial_tab_heroes">Heroes</button>
            <button class="tab-btn" data-tab="pets" data-i18n="tutorial_tab_pets">Pets</button>
            <button class="tab-btn" data-tab="abilities" data-i18n="tutorial_tab_abilities">Abilities</button>
            <button class="tab-btn" data-tab="controls" data-i18n="tutorial_tab_controls">Controls</button>
        </div>
        
        <div class="encyclopedia-content">
            <!-- BASICS TAB -->
            <div class="tab-content active" data-tab-content="basics">
                <h3 data-i18n="tutorial_basics_title">Game Basics</h3>
                <p data-i18n="tutorial_basics_placeholder">Tutorial content about game basics will be here...</p>
            </div>
            
            <!-- HEROES TAB -->
            <div class="tab-content" data-tab-content="heroes">
                <h3 data-i18n="tutorial_heroes_title">Heroes & Classes</h3>
                <p data-i18n="tutorial_heroes_placeholder">Tutorial content about heroes will be here...</p>
            </div>
            
            <!-- PETS TAB -->
            <div class="tab-content" data-tab-content="pets">
                <h3 data-i18n="tutorial_pets_title">Pets & Companions</h3>
                <p data-i18n="tutorial_pets_placeholder">Tutorial content about pets will be here...</p>
            </div>
            
            <!-- ABILITIES TAB -->
            <div class="tab-content" data-tab-content="abilities">
                <h3 data-i18n="tutorial_abilities_title">Special Abilities</h3>
                <p data-i18n="tutorial_abilities_placeholder">Tutorial content about abilities will be here...</p>
            </div>
            
            <!-- CONTROLS TAB -->
            <div class="tab-content" data-tab-content="controls">
                <h3 data-i18n="tutorial_controls_title">Controls</h3>
                <div class="controls-list">
                    <div class="control-item">
                        <kbd>← →</kbd>
                        <span data-i18n="control_move">Move piece left/right</span>
                    </div>
                    <div class="control-item">
                        <kbd>↑</kbd>
                        <span data-i18n="control_rotate">Rotate piece</span>
                    </div>
                    <div class="control-item">
                        <kbd>↓</kbd>
                        <span data-i18n="control_soft_drop">Soft drop</span>
                    </div>
                    <div class="control-item">
                        <kbd>Space</kbd>
                        <span data-i18n="control_hard_drop">Hard drop</span>
                    </div>
                    <div class="control-item">
                        <kbd>Shift</kbd>
                        <span data-i18n="control_hold">Hold piece</span>
                    </div>
                    <div class="control-item">
                        <kbd>P</kbd>
                        <span data-i18n="control_pause">Pause game</span>
                    </div>
                    <div class="control-item">
                        <kbd>ESC</kbd>
                        <span data-i18n="control_menu">Return to menu</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="encyclopedia-footer">
            <button class="btn-secondary" disabled data-i18n="tutorial_prev">Previous</button>
            <div class="page-indicator">
                <span data-i18n="tutorial_page">Page</span> 
                <span class="page-current">1</span> / 
                <span class="page-total">5</span>
            </div>
            <button class="btn-secondary" data-i18n="tutorial_next">Next</button>
        </div>
    </div>

    <!-- ===============================
        SETTINGS MODAL WINDOW
    ================================ -->
    <div id="settingsModal" class="modal hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h2 data-i18n="settings_title">Game Settings</h2>
                <button class="btn-close" data-action="close-settings" aria-label="Close">×</button>
            </div>
            
            <div class="modal-body">
                <!-- User Info -->
                <div class="setting-section">
                    <h3 data-i18n="account">Account</h3>
                    <div class="setting-row">
                        <span data-i18n="logged_in_as">Logged in as</span>
                        <strong><?php echo htmlspecialchars($currentUser['nickname']); ?></strong>
                    </div>
                    <div class="setting-row">
                        <span data-i18n="username">Username</span>
                        <span><?php echo htmlspecialchars($currentUser['username']); ?></span>
                    </div>
                </div>
                
                <!-- Language Selection -->
                <div class="setting-section">
                    <h3 data-i18n="language">Language</h3>
                    <div class="setting-options" id="languageOptions">
                        <div class="language-option <?php echo $currentUser['language'] === 'en' ? 'active' : ''; ?>" data-lang="en">
                            <div class="flag">🇺🇸</div>
                            <div class="lang-name">English</div>
                            <div class="check">✓</div>
                        </div>
                        <div class="language-option <?php echo $currentUser['language'] === 'ru' ? 'active' : ''; ?>" data-lang="ru">
                            <div class="flag">🇷🇺</div>
                            <div class="lang-name">Русский</div>
                        </div>
                        <div class="language-option <?php echo $currentUser['language'] === 'es' ? 'active' : ''; ?>" data-lang="es">
                            <div class="flag">🇪🇸</div>
                            <div class="lang-name">Español</div>
                        </div>
                        <div class="language-option <?php echo $currentUser['language'] === 'fr' ? 'active' : ''; ?>" data-lang="fr">
                            <div class="flag">🇫🇷</div>
                            <div class="lang-name">Français</div>
                        </div>
                        <div class="language-option <?php echo $currentUser['language'] === 'de' ? 'active' : ''; ?>" data-lang="de">
                            <div class="flag">🇩🇪</div>
                            <div class="lang-name">Deutsch</div>
                        </div>
                    </div>
                </div>
                
                <!-- Difficulty Selection -->
                <div class="setting-section">
                    <h3 data-i18n="difficulty">Difficulty</h3>
                    <div class="setting-options" id="difficultyOptions">
                        <label class="setting-option <?php echo $currentUser['difficulty'] === 'easy' ? 'active' : ''; ?>">
                            <input type="radio" name="difficulty" value="easy" <?php echo $currentUser['difficulty'] === 'easy' ? 'checked' : ''; ?>>
                            <span data-i18n="difficulty_easy">Easy</span>
                            <span class="setting-desc" data-i18n="difficulty_easy_desc">Slower falling speed</span>
                        </label>
                        <label class="setting-option <?php echo $currentUser['difficulty'] === 'normal' ? 'active' : ''; ?>">
                            <input type="radio" name="difficulty" value="normal" <?php echo $currentUser['difficulty'] === 'normal' ? 'checked' : ''; ?>>
                            <span data-i18n="difficulty_normal">Normal</span>
                            <span class="setting-desc" data-i18n="difficulty_normal_desc">Standard gameplay</span>
                        </label>
                        <label class="setting-option <?php echo $currentUser['difficulty'] === 'hard' ? 'active' : ''; ?>">
                            <input type="radio" name="difficulty" value="hard" <?php echo $currentUser['difficulty'] === 'hard' ? 'checked' : ''; ?>>
                            <span data-i18n="difficulty_hard">Hard</span>
                            <span class="setting-desc" data-i18n="difficulty_hard_desc">Faster falling speed</span>
                        </label>
                        <label class="setting-option <?php echo $currentUser['difficulty'] === 'hardcore' ? 'active' : ''; ?>">
                            <input type="radio" name="difficulty" value="hardcore" <?php echo $currentUser['difficulty'] === 'hardcore' ? 'checked' : ''; ?>>
                            <span data-i18n="difficulty_hardcore">Hardcore</span>
                            <span class="setting-desc" data-i18n="difficulty_hardcore_desc">Expert challenge</span>
                        </label>
                    </div>
                </div>
                
                <!-- Sound Settings -->
                <div class="setting-section">
                    <h3 data-i18n="audio">Audio</h3>
                    <div class="setting-row">
                        <label data-i18n="sound_effects">Sound Effects</label>
                        <input type="range" id="soundVolume" min="0" max="100" value="80" class="slider">
                        <span class="volume-percent" id="soundPercent">80%</span>
                    </div>
                    <div class="setting-row">
                        <label data-i18n="music">Music</label>
                        <input type="range" id="musicVolume" min="0" max="100" value="60" class="slider">
                        <span class="volume-percent" id="musicPercent">60%</span>
                    </div>
                    <div class="setting-row">
                        <label>
                            <input type="checkbox" id="muteSounds">
                            <span data-i18n="mute_sounds">Mute Sound Effects</span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <label>
                            <input type="checkbox" id="muteMusic">
                            <span data-i18n="mute_music">Mute Music</span>
                        </label>
                    </div>
                </div>
                
                <!-- Gameplay Settings -->
                <div class="setting-section">
                    <h3 data-i18n="gameplay">Gameplay</h3>
                    <div class="setting-row">
                        <label>
                            <input type="checkbox" id="ghostPiece" checked>
                            <span data-i18n="ghost_piece">Show Ghost Piece</span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <label>
                            <input type="checkbox" id="holdPreview" checked>
                            <span data-i18n="hold_preview">Show Hold Preview</span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <label>
                            <input type="checkbox" id="nextPreview" checked>
                            <span data-i18n="next_preview">Show Next Piece Preview</span>
                        </label>
                    </div>
                    <div class="setting-row">
                        <label>
                            <input type="checkbox" id="gridLines" checked>
                            <span data-i18n="grid_lines">Show Grid Lines</span>
                        </label>
                    </div>
                </div>
                
                <!-- Save/Load Buttons -->
                <div class="setting-section">
                    <div class="setting-row buttons">
                        <button type="button" class="btn-secondary" data-action="reset-settings" data-i18n="reset_defaults">
                            Reset to Defaults
                        </button>
                        <button type="button" class="btn-primary" data-action="save-settings" data-i18n="save_settings">
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <div class="save-status" id="saveStatus"></div>
            </div>
        </div>
    </div>
    
    <?php endif; // конец проверки авторизации ?>

    <!-- ===============================
        SCRIPTS - CRITICAL ORDER
    ================================ -->
    <!-- 1. Global settings -->
<script type="module">
window.PlayerSettings = {
    language: '<?php echo $currentUser['language'] ?? 'en'; ?>',
    difficulty: '<?php echo $currentUser['difficulty'] ?? 'normal'; ?>'
};
</script>
        
        window.GameSettings = {
            language: '<?php echo $currentUser['language'] ?? 'en'; ?>',
            difficulty: '<?php echo $currentUser['difficulty'] ?? 'normal'; ?>',
            sound_volume: 80,
            music_volume: 60,
            mute_sounds: false,
            mute_music: false,
            ghost_piece: true,
            hold_preview: true,
            next_preview: true,
            grid_lines: true,
            initialized: false,
            userId: <?php echo $currentUser['id'] ?? 'null'; ?>
        };
        
        window.isLoggedIn = <?php echo $isLoggedIn ? 'true' : 'false'; ?>;
    </script>
    
    <?php if ($isLoggedIn): ?>
    <!-- 2. Core modules (только для авторизованных) -->
<script type="module" src="./js/i18n.js"></script>
<script type="module" src="./js/ui-localization.js"></script>
<script type="module" src="./js/settings.js"></script>
    
    <!-- 3. Game logic -->
    <script type="module" src="./js/main.js"></script>
    <script type="module" src="./js/events.js"></script>
    <script type="module" src="./js/pets.js"></script>
    
    <!-- 4. UI modules -->
    <script type="module" src="./js/encyclopedia.js"></script>

    <!-- 5. Initialization -->
    <script type="module">
        // Инициализация при загрузке DOM
        document.addEventListener('DOMContentLoaded', async () => {
            console.log('DOM loaded, initializing game...');
            
            try {
                // Загружаем язык и настройки
                const i18n = await import('./js/i18n.js');
                await i18n.initLanguage();
                
                // Загружаем настройки
                const settings = await import('./js/settings.js');
                await settings.initSettings();
                
                // Применяем настройки к PlayerSettings
                const currentSettings = settings.getCurrentSettings();
                window.PlayerSettings.language = currentSettings.language;
                window.PlayerSettings.difficulty = currentSettings.difficulty;
                
                // Локализация интерфейса
                const uiLocalization = await import('./js/ui-localization.js');
                uiLocalization.localizeAllUI();
                
                // Инициализация энциклопедии
                const encyclopedia = await import('./js/encyclopedia.js');
                encyclopedia.initEncyclopedia();
                
                console.log('Game initialized successfully');
                
            } catch (error) {
                console.error('Initialization error:', error);
            }
        });
        
        // Обработчик изменения языка
        document.addEventListener('languageChanged', () => {
            import('./js/ui-localization.js').then(ui => {
                ui.localizeAllUI();
            });
        });
        
        // Обработчик изменения настроек
        document.addEventListener('settingsChanged', (event) => {
            console.log('Settings changed:', event.detail.settings);
            // Обновляем PlayerSettings
            if (window.PlayerSettings && event.detail.settings) {
                window.PlayerSettings.language = event.detail.settings.language;
                window.PlayerSettings.difficulty = event.detail.settings.difficulty;
            }
        });
    </script>
    <?php endif; ?>

<script>
// Отладочный код
document.addEventListener('DOMContentLoaded', function() {
  console.log('=== MENU DEBUG ===');
  
  const startScreen = document.getElementById('startScreen');
  if (!startScreen) {
    console.error('ERROR: startScreen element not found!');
    return;
  }
  
  console.log('StartScreen ID exists');
  console.log('Classes:', startScreen.className);
  
  // Проверяем CSS
  const style = window.getComputedStyle(startScreen);
  console.log('Display:', style.display);
  console.log('Visibility:', style.visibility);
  
  // Проверяем панели
  const panels = document.querySelectorAll('.menu-panel');
  panels.forEach((panel, i) => {
    const display = window.getComputedStyle(panel).display;
    console.log(`Panel ${i} (${panel.dataset.menu}): display = ${display}`);
  });
  
  // Тестируем переключение
  console.log('\n=== TESTING MENU SWITCH ===');
  console.log('Before click - Current class:', startScreen.className);
  
  // Добавляем тестовый обработчик
  startScreen.addEventListener('click', function(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    console.log('\nButton clicked:', btn.textContent);
    console.log('Dataset:', btn.dataset);
    
    if (btn.dataset.action === 'start') {
      startScreen.classList.remove('menu-title');
      startScreen.classList.add('menu-hero');
      console.log('Switched to menu-hero');
      console.log('New classes:', startScreen.className);
    }
  });
});
</script>

<script>
// Отладка для Tutorial и Settings
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DEBUG SETTINGS/TUTORIAL ===');
    
    // Проверка элементов
    const settingsModal = document.getElementById('settingsModal');
    const encyclopedia = document.getElementById('encyclopedia');
    
    console.log('Settings modal exists:', !!settingsModal);
    console.log('Encyclopedia exists:', !!encyclopedia);
    
    // Принудительно показываем если нужно
    window.debugShowSettings = function() {
        if (settingsModal) {
            settingsModal.classList.remove('hidden');
            console.log('Settings shown');
        }
    };
    
    window.debugShowTutorial = function() {
        if (encyclopedia) {
            encyclopedia.classList.remove('hidden');
            console.log('Tutorial shown');
        }
    };
});
</script>

</body>
</html>