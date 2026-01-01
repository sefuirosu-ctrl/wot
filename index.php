<?php
session_start();

$BASE = "/wot/";
$AUTH = "/wot/wot/";

if (!isset($_SESSION['user_id'])) {
    header("Location: {$BASE}start.php");
    exit;
}

$nickname = htmlspecialchars($_SESSION['nickname'] ?? 'Player');
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>World of Tetris: Fragments of the Sleepless Realm</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- MAIN GAME STYLE -->
    <link rel="stylesheet" href="<?= $BASE ?>css/style.css">
    <!-- ENCYCLOPEDIA STYLE -->
    <link rel="stylesheet" href="<?= $BASE ?>css/encyclopedia.css">
</head>
<body>

<div id="app">

    <!-- =========================
         START SCREEN (FSM MENU)
    ========================== -->
    <div id="startScreen" class="menu menu-title">

        <!-- TITLE -->
        <div class="menu-panel" data-menu="title">
            <h2>WORLD OF TETRIS</h2>
            <div class="subtitle">Fragments of the Sleepless Realm</div>

            <button type="button" class="btn-primary" data-action="start">
                Start Game
            </button>

            <div class="menu-row">
                <button type="button" data-action="tutorial">Tutorial</button>
                <button type="button" data-action="settings">Settings</button>
            </div>

            <div class="build">Build 1.0</div>
        </div>

        <!-- HERO SELECT -->
        <div class="menu-panel" data-menu="hero">
            <h2>Select Hero</h2>
            <div class="select-grid">
                <button type="button" data-hero="mage">🧙 Mage</button>
                <button type="button" data-hero="healer">💖 Healer</button>
                <button type="button" data-hero="warrior">🗡 Warrior</button>
                <button type="button" data-hero="berserker">🐉 Berserker</button>
            </div>
        </div>

        <!-- PET SELECT -->
        <div class="menu-panel" data-menu="pet">
            <h2>Select Pet</h2>
            <div class="select-grid">
                <button type="button" data-pet="cat">🐱 Cat</button>
                <button type="button" data-pet="dog">🐶 Dog</button>
                <button type="button" data-pet="fox">🦊 Fox</button>
                <button type="button" data-pet="bear">🐻 Bear</button>
            </div>
        </div>

    </div>
    <!-- =========================
         END START SCREEN
    ========================== -->

    <!-- =========================
         GAME AREA
    ========================== -->
    <div id="gameArea">

        <div class="panel">
            <h3>HOLD</h3>
            <canvas id="hold" width="120" height="120"></canvas>
        </div>

        <div class="panel">
            <canvas id="game" width="300" height="600"></canvas>

            <div id="hud">
                <div class="hud-item">Score <span id="score">0</span></div>
                <div class="hud-item">Level <span id="level">1</span></div>
                <div class="hud-item">Lines <span id="lines">0</span></div>
                <div class="hud-item">Time <span id="time">00:00</span></div>
            </div>

            <div id="controlsHint">
                ← → move | ↑ rotate | ↓ soft drop | Space hard drop | Shift / Ctrl hold
            </div>
        </div>

        <div class="panel">
            <h3>NEXT</h3>
            <canvas id="next" width="120" height="120"></canvas>
        </div>

    </div>

    <!-- =========================
         ENCYCLOPEDIA SCREEN
    ========================== -->
    <div id="encyclopediaScreen" class="hidden">

        <div class="encyclopedia-panel">
            <button id="encyclopediaClose" class="encyclopedia-close">✕</button>

            <div class="encyclopedia-layout">
                <div id="encyclopediaTopics" class="encyclopedia-topics"></div>
                <div id="encyclopediaContent" class="encyclopedia-content">
                    <h3>Select a topic</h3>
                </div>
            </div>
        </div>

    </div>

</div>

<!-- USER BAR -->
<div id="userBar">
    Logged in as <strong><?= $nickname ?></strong> |
    <a href="<?= $AUTH ?>logout.php">Logout</a>
</div>

<!-- LOOCALIZATION -->
<script type="module" src="<?= $BASE ?>js/ui-localization.js"></script>

<!-- GAME CORE -->
<script type="module" src="<?= $BASE ?>js/main.js"></script>

<!-- ENCYCLOPEDIA -->
<script type="module" src="<?= $BASE ?>js/encyclopedia.js"></script>

</body>
</html>
