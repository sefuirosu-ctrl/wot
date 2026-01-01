// js/settings.js
import { t, getAvailableLanguages, changeLanguage } from './i18n.js';
import { localizeAllUI } from './ui-localization.js';

// Конфигурация
const SETTINGS_API = 'api/settings.php';

// Глобальное состояние настроек
const GameSettings = {
    language: 'en',
    difficulty: 'normal',
    sound_volume: 80,
    music_volume: 60,
    mute_sounds: false,
    mute_music: false,
    ghost_piece: true,
    hold_preview: true,
    next_preview: true,
    grid_lines: true,
    initialized: false,
    userId: null
};

/**
 * Инициализация системы настроек
 */
export async function initSettings() {
    console.log('Initializing settings system...');
    
    try {
        // Загружаем настройки с сервера
        const response = await fetch(SETTINGS_API);
        const data = await response.json();
        
        if (data.success && data.settings) {
            // Обновляем GameSettings
            Object.assign(GameSettings, data.settings);
            
            // Сохраняем ID пользователя если есть
            if (data.user_id) {
                GameSettings.userId = data.user_id;
            }
            
            // Применяем настройки к игре
            applySettingsToGame();
            
            // Обновляем PlayerSettings для совместимости
            if (window.PlayerSettings) {
                window.PlayerSettings.language = GameSettings.language;
                window.PlayerSettings.difficulty = GameSettings.difficulty;
            }
            
            GameSettings.initialized = true;
            console.log('Settings loaded from server:', GameSettings);
            
            // Если язык из настроек отличается от текущего, меняем
            if (window.getCurrentLanguage && GameSettings.language !== window.getCurrentLanguage()) {
                await changeLanguage(GameSettings.language);
            }
        } else {
            throw new Error(data.error || 'Failed to load settings');
        }
    } catch (error) {
        console.warn('Could not load settings from server, using defaults:', error);
        // Используем настройки по умолчанию
        applySettingsToGame();
        GameSettings.initialized = true;
    }
    
    // Настраиваем обработчики UI
    setupSettingsUI();
}

/**
 * Сохранить настройки на сервер
 */
export async function saveSettings() {
    // Обновляем GameSettings из UI
    updateSettingsFromUI();
    
    try {
        const response = await fetch(SETTINGS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(GameSettings)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSaveStatus('success', t('settings_saved') || 'Settings saved successfully!');
            
            // Применяем настройки к игре
            applySettingsToGame();
            
            // Обновляем PlayerSettings для совместимости
            if (window.PlayerSettings) {
                window.PlayerSettings.language = GameSettings.language;
                window.PlayerSettings.difficulty = GameSettings.difficulty;
            }
            
            // Сохраняем ID пользователя если есть
            if (data.user_id) {
                GameSettings.userId = data.user_id;
            }
            
            // Диспетчер событий для уведомления других модулей
            document.dispatchEvent(new CustomEvent('settingsChanged', {
                detail: { settings: GameSettings }
            }));
            
            return true;
        } else {
            showSaveStatus('error', data.error || t('save_failed') || 'Save failed');
            return false;
        }
    } catch (error) {
        console.error('Failed to save settings:', error);
        showSaveStatus('error', t('connection_error') || 'Connection error');
        return false;
    }
}

/**
 * Обновление настроек из UI элементов
 */
function updateSettingsFromUI() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    // Язык
    const langOption = modal.querySelector('.language-option.active');
    if (langOption) {
        GameSettings.language = langOption.dataset.lang;
    }
    
    // Сложность
    const diffRadio = modal.querySelector('input[name="difficulty"]:checked');
    if (diffRadio) {
        GameSettings.difficulty = diffRadio.value;
    }
    
    // Звук
    GameSettings.sound_volume = parseInt(document.getElementById('soundVolume').value) || 80;
    GameSettings.music_volume = parseInt(document.getElementById('musicVolume').value) || 60;
    GameSettings.mute_sounds = document.getElementById('muteSounds').checked;
    GameSettings.mute_music = document.getElementById('muteMusic').checked;
    
    // Геймплей
    GameSettings.ghost_piece = document.getElementById('ghostPiece').checked;
    GameSettings.hold_preview = document.getElementById('holdPreview').checked;
    GameSettings.next_preview = document.getElementById('nextPreview').checked;
    GameSettings.grid_lines = document.getElementById('gridLines').checked;
}

/**
 * Обновление UI из текущих настроек
 */
function updateUIFromSettings() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    // Язык
    const langOptions = modal.querySelectorAll('.language-option');
    langOptions.forEach(option => {
        option.classList.remove('active');
        if (option.dataset.lang === GameSettings.language) {
            option.classList.add('active');
        }
    });
    
    // Сложность
    const diffRadio = modal.querySelector(`input[name="difficulty"][value="${GameSettings.difficulty}"]`);
    if (diffRadio) {
        diffRadio.checked = true;
        diffRadio.parentElement.classList.add('active');
    }
    
    // Снимаем активность с других сложностей
    modal.querySelectorAll('input[name="difficulty"]').forEach(radio => {
        if (radio.value !== GameSettings.difficulty) {
            radio.parentElement.classList.remove('active');
        }
    });
    
    // Звук
    document.getElementById('soundVolume').value = GameSettings.sound_volume;
    document.getElementById('musicVolume').value = GameSettings.music_volume;
    document.getElementById('soundPercent').textContent = GameSettings.sound_volume + '%';
    document.getElementById('musicPercent').textContent = GameSettings.music_volume + '%';
    document.getElementById('muteSounds').checked = GameSettings.mute_sounds;
    document.getElementById('muteMusic').checked = GameSettings.mute_music;
    
    // Геймплей
    document.getElementById('ghostPiece').checked = GameSettings.ghost_piece;
    document.getElementById('holdPreview').checked = GameSettings.hold_preview;
    document.getElementById('nextPreview').checked = GameSettings.next_preview;
    document.getElementById('gridLines').checked = GameSettings.grid_lines;
}

/**
 * Применение настроек к игровому движку
 */
function applySettingsToGame() {
    // Применяем язык
    if (window.changeLanguage && GameSettings.language !== window.PlayerSettings?.language) {
        changeLanguage(GameSettings.language).then(() => {
            localizeAllUI();
        });
    }
    
    // Применяем сложность
    if (window.PlayerSettings) {
        window.PlayerSettings.difficulty = GameSettings.difficulty;
    }
    
    // Применяем настройки графики
    applyGraphicsSettings();
    
    // Сохраняем в localStorage для быстрого доступа
    try {
        localStorage.setItem('wot_settings', JSON.stringify(GameSettings));
    } catch (e) {
        // Игнорируем ошибки localStorage
    }
}

/**
 * Применение графических настроек
 */
function applyGraphicsSettings() {
    // Эти настройки будут использоваться в main.js
    console.log('Graphics settings applied:', {
        ghostPiece: GameSettings.ghost_piece,
        gridLines: GameSettings.grid_lines,
        holdPreview: GameSettings.hold_preview,
        nextPreview: GameSettings.next_preview
    });
}

/**
 * Настройка UI элементов настроек
 */
function setupSettingsUI() {
    const modal = document.getElementById('settingsModal');
    if (!modal) {
        console.error('Settings modal not found!');
        return;
    }
    
    // Обработчики для открытия/закрытия
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        if (btn.dataset.action === 'settings') {
            openSettingsModal();
        }
        
        if (btn.dataset.action === 'close-settings') {
            closeSettingsModal();
        }
        
        if (btn.dataset.action === 'save-settings') {
            saveSettings();
        }
        
        if (btn.dataset.action === 'reset-settings') {
            resetToDefaults();
        }
    });
    
    // Обработчики для выбора языка
    modal.addEventListener('click', (e) => {
        const langOption = e.target.closest('.language-option');
        if (langOption) {
            selectLanguageOption(langOption);
        }
    });
    
    // Обработчики для выбора сложности
    modal.addEventListener('change', (e) => {
        if (e.target.name === 'difficulty') {
            selectDifficultyOption(e.target);
        }
    });
    
    // Обработчики слайдеров громкости
    const soundSlider = document.getElementById('soundVolume');
    const musicSlider = document.getElementById('musicVolume');
    
    if (soundSlider) {
        soundSlider.addEventListener('input', (e) => {
            document.getElementById('soundPercent').textContent = e.target.value + '%';
        });
    }
    
    if (musicSlider) {
        musicSlider.addEventListener('input', (e) => {
            document.getElementById('musicPercent').textContent = e.target.value + '%';
        });
    }
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeSettingsModal();
        }
    });
    
    // Закрытие по клавише ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeSettingsModal();
        }
    });
}

/**
 * Выбор языковой опции
 */
function selectLanguageOption(option) {
    const modal = document.getElementById('settingsModal');
    const options = modal.querySelectorAll('.language-option');
    
    options.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
}

/**
 * Выбор опции сложности
 */
function selectDifficultyOption(radio) {
    const options = document.querySelectorAll('.setting-option');
    options.forEach(opt => opt.classList.remove('active'));
    radio.parentElement.classList.add('active');
}

/**
 * Открытие модального окна настроек
 */
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const gameArea = document.getElementById('gameArea');
    const startScreen = document.getElementById('startScreen');
    
    // Обновляем UI текущими настройками
    updateUIFromSettings();
    
    // Показываем модальное окно
    modal.classList.remove('hidden');
    
    // Диспетчер событий
    document.dispatchEvent(new CustomEvent('settingsModal:opened'));
}

/**
 * Закрытие модального окна настроек
 */
function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.classList.add('hidden');
    
    // Диспетчер событий
    document.dispatchEvent(new CustomEvent('settingsModal:closed'));
}

/**
 * Сброс настроек к значениям по умолчанию
 */
function resetToDefaults() {
    if (confirm(t('confirm_reset') || 'Reset all settings to default values?')) {
        // Сброс к значениям по умолчанию
        const defaults = {
            language: 'en',
            difficulty: 'normal',
            sound_volume: 80,
            music_volume: 60,
            mute_sounds: false,
            mute_music: false,
            ghost_piece: true,
            hold_preview: true,
            next_preview: true,
            grid_lines: true
        };
        
        Object.assign(GameSettings, defaults);
        updateUIFromSettings();
        showSaveStatus('info', t('settings_reset') || 'Settings reset to defaults');
        
        // Сохраняем сброшенные настройки
        saveSettings();
    }
}

/**
 * Показать статус сохранения
 */
function showSaveStatus(type, message) {
    const statusEl = document.getElementById('saveStatus');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `save-status ${type}`;
    
    setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'save-status';
    }, 3000);
}

/**
 * Получение текущих настроек
 */
export function getCurrentSettings() {
    return { ...GameSettings };
}

/**
 * Обновление настроек (для внешнего использования)
 */
export function updateSettings(newSettings) {
    Object.assign(GameSettings, newSettings);
    applySettingsToGame();
}

// Загрузить настройки из localStorage при загрузке
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('wot_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(GameSettings, parsed);
        }
    } catch (e) {
        // Игнорируем ошибки
    }
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Сначала загружаем из localStorage для быстрого старта
    loadFromLocalStorage();
    
    // Затем инициализируем полную систему
    initSettings();
});

// Экспорт для глобального использования
window.GameSettings = GameSettings;
window.initSettings = initSettings;
window.getCurrentSettings = getCurrentSettings;
window.saveSettings = saveSettings;

export default {
    initSettings,
    getCurrentSettings,
    updateSettings,
    saveSettings
};