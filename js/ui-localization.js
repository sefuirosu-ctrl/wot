// js/ui-localization.js - ПОЛНАЯ ВЕРСИЯ С ДАННЫМИ ИЗ РЕПОЗИТОРИЯ
import { t } from './i18n.js';

// ======================
// ДАННЫЕ ИЗ РЕПОЗИТОРИЯ (js/ui-localization.js)
// ======================
const UI_TEXTS = {
    // Menu
    'title': 'WORLD OF TETRIS',
    'subtitle': 'Fragments of the Sleepless Realm',
    'start_game': 'Start Game',
    'tutorial': 'Tutorial',
    'settings': 'Settings',
    'select_hero': 'Select Hero',
    'select_pet': 'Select Pet',
    'hero_mage': '🧙 Mage',
    'hero_warrior': '🗡 Warrior',
    'hero_healer': '💖 Healer',
    'hero_berserker': '🐉 Berserker',
    'pet_cat': '🐱 Cat',
    'pet_dog': '🐶 Dog',
    'pet_fox': '🦊 Fox',
    'pet_bear': '🐻 Bear',
    
    // Game HUD
    'hold': 'HOLD',
    'next': 'NEXT',
    'score': 'SCORE',
    'level': 'LEVEL',
    'lines': 'LINES',
    'time': 'TIME',
    
    // Tutorial/Encyclopedia
    'encyclopedia_title': 'Encyclopedia',
    'tab_basics': 'Basics',
    'tab_heroes': 'Heroes',
    'tab_pets': 'Pets',
    'tab_abilities': 'Abilities',
    
    // Game States
    'game_over': 'GAME OVER',
    'press_any_key': 'Press any key to return to menu',
    'paused': 'PAUSED',
    
    // Effects
    'effect_lock_delay': 'Lock Delay +',
    'effect_slow_fall': 'Slow Fall',
    'effect_clear_boost': 'Clear Boost',
    
    // Settings
    'language': 'Language',
    'difficulty': 'Difficulty',
    'sound': 'Sound',
    'music': 'Music'
};

// ======================
// ФУНКЦИИ ЛОКАЛИЗАЦИИ
// ======================

/**
 * Локализация главного меню
 */
export function localizeMenu() {
    const menu = document.getElementById('startScreen');
    if (!menu) return;
    
    // Title panel
    const title = menu.querySelector('[data-menu="title"] h2');
    if (title) title.textContent = t('title_main') || UI_TEXTS['title'];
    
    const subtitle = menu.querySelector('[data-menu="title"] .subtitle');
    if (subtitle) subtitle.textContent = t('subtitle') || UI_TEXTS['subtitle'];
    
    // Кнопки title panel
    const startBtn = menu.querySelector('[data-action="start"]');
    if (startBtn) startBtn.textContent = t('menu_start') || UI_TEXTS['start_game'];
    
    const tutorialBtn = menu.querySelector('[data-action="tutorial"]');
    if (tutorialBtn) tutorialBtn.textContent = t('menu_tutorial') || UI_TEXTS['tutorial'];
    
    const settingsBtn = menu.querySelector('[data-action="settings"]');
    if (settingsBtn) settingsBtn.textContent = t('menu_settings') || UI_TEXTS['settings'];
    
    // Hero panel
    const heroTitle = menu.querySelector('[data-menu="hero"] h2');
    if (heroTitle) heroTitle.textContent = t('select_hero') || UI_TEXTS['select_hero'];
    
    // Pet panel
    const petTitle = menu.querySelector('[data-menu="pet"] h2');
    if (petTitle) petTitle.textContent = t('select_pet') || UI_TEXTS['select_pet'];
}

/**
 * Локализация HUD (игрового интерфейса)
 */
export function localizeHUD() {
    // Панель HOLD
    const holdLabel = document.querySelector('.panel:nth-child(1) h3');
    if (holdLabel) holdLabel.textContent = t('hold') || UI_TEXTS['hold'];
    
    // Панель NEXT
    const nextLabel = document.querySelector('.panel:nth-child(3) h3');
    if (nextLabel) nextLabel.textContent = t('next') || UI_TEXTS['next'];
    
    // Статистика
    const stats = document.querySelectorAll('.stats .stat label');
    if (stats.length >= 4) {
        stats[0].textContent = t('score') || UI_TEXTS['score'];
        stats[1].textContent = t('level') || UI_TEXTS['level'];
        stats[2].textContent = t('lines') || UI_TEXTS['lines'];
        stats[3].textContent = t('time') || UI_TEXTS['time'];
    }
}

/**
 * Локализация игровых элементов (кнопки паузы и т.д.)
 */
export function localizeGameElements() {
    // Кнопка паузы
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.title = t('pause') || 'Pause';
    }
    
    // Кнопка звука
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        soundBtn.title = t('sound') || 'Sound';
    }
}

/**
 * НОВАЯ ФУНКЦИЯ: Локализация всех элементов с data-i18n атрибутами
 */
export function localizeDataAttributes() {
    // 1. Локализация текстового содержимого
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            const translation = t(key);
            // Если перевод существует и не равен ключу
            if (translation && translation !== key) {
                el.textContent = translation;
            }
            // Иначе используем fallback из UI_TEXTS
            else if (UI_TEXTS[key]) {
                el.textContent = UI_TEXTS[key];
            }
        }
    });
    
    // 2. Локализация placeholder атрибутов
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            const translation = t(key);
            if (translation && translation !== key) {
                el.setAttribute('placeholder', translation);
            }
        }
    });
    
    // 3. Локализация title атрибутов
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) {
            const translation = t(key);
            if (translation && translation !== key) {
                el.setAttribute('title', translation);
            }
        }
    });
    
    // 4. Локализация value атрибутов
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
        const key = el.getAttribute('data-i18n-value');
        if (key) {
            const translation = t(key);
            if (translation && translation !== key) {
                el.setAttribute('value', translation);
            }
        }
    });
}

/**
 * Локализация энциклопедии/туториала
 */
export function localizeEncyclopedia() {
    const encyclopedia = document.getElementById('encyclopedia');
    if (!encyclopedia) return;
    
    // Заголовок
    const title = encyclopedia.querySelector('.encyclopedia-header h2');
    if (title) {
        title.textContent = t('tutorial_title') || UI_TEXTS['encyclopedia_title'];
    }
    
    // Табы
    const tabs = encyclopedia.querySelectorAll('.tab-btn');
    const tabKeys = ['tutorial_tab_basics', 'tutorial_tab_heroes', 
                     'tutorial_tab_pets', 'tutorial_tab_abilities',
                     'tutorial_tab_controls'];
    
    tabs.forEach((tab, index) => {
        if (tabKeys[index]) {
            tab.textContent = t(tabKeys[index]) || UI_TEXTS[`tab_${tabKeys[index].split('_').pop()}`] || tab.textContent;
        }
    });
    
    // Контент табов
    const contents = encyclopedia.querySelectorAll('.tab-content');
    contents.forEach(content => {
        const headings = content.querySelectorAll('h3[data-i18n]');
        headings.forEach(heading => {
            const key = heading.getAttribute('data-i18n');
            if (key) {
                const translation = t(key);
                if (translation && translation !== key) {
                    heading.textContent = translation;
                }
            }
        });
        
        const paragraphs = content.querySelectorAll('p[data-i18n]');
        paragraphs.forEach(p => {
            const key = p.getAttribute('data-i18n');
            if (key) {
                const translation = t(key);
                if (translation && translation !== key) {
                    p.textContent = translation;
                }
            }
        });
    });
    
    // Футер
    const prevBtn = encyclopedia.querySelector('[data-i18n="tutorial_prev"]');
    if (prevBtn) prevBtn.textContent = t('tutorial_prev') || 'Previous';
    
    const pageText = encyclopedia.querySelector('[data-i18n="tutorial_page"]');
    if (pageText) pageText.textContent = t('tutorial_page') || 'Page';
    
    const nextBtn = encyclopedia.querySelector('[data-i18n="tutorial_next"]');
    if (nextBtn) nextBtn.textContent = t('tutorial_next') || 'Next';
}

/**
 * Главная функция локализации всего интерфейса
 */
export function localizeAllUI() {
    try {
        localizeMenu();
        localizeHUD();
        localizeGameElements();
        localizeDataAttributes();
        localizeEncyclopedia();
        
        // Локализация для Game Over экрана (если игра активна)
        if (window.Game && window.Game.gameOver) {
            const canvas = document.getElementById('game');
            if (canvas) {
                // Game Over текст будет отрисовываться в main.js
                // через функцию t('game_over')
            }
        }
        
        console.log('UI localized successfully');
    } catch (error) {
        console.error('Error localizing UI:', error);
    }
}

/**
 * Инициализация локализации при загрузке
 */
document.addEventListener('DOMContentLoaded', () => {
    // Первичная локализация
    setTimeout(() => localizeAllUI(), 100);
});

/**
 * Обработчик смены языка
 */
document.addEventListener('languageChanged', () => {
    localizeAllUI();
});

// Экспорт для использования в других модулях
export default {
    localizeMenu,
    localizeHUD,
    localizeGameElements,
    localizeDataAttributes,
    localizeEncyclopedia,
    localizeAllUI
};