// js/i18n.js - МЕЖДУНАРОДИЗАЦИЯ (обновленная версия)
import en from '../lang/en.js';
import ru from '../lang/ru.js';
import es from '../lang/es.js';
import fr from '../lang/fr.js';
import de from '../lang/de.js';

// Глобальный объект переводов
let currentTranslations = en;
let currentLanguage = 'en';

// Доступные языки
const LANGUAGES = {
    'en': { name: 'English', data: en },
    'ru': { name: 'Русский', data: ru },
    'es': { name: 'Español', data: es },
    'fr': { name: 'Français', data: fr },
    'de': { name: 'Deutsch', data: de }
};

/**
 * Загрузка языка
 * @param {string} langCode - Код языка (en, ru, es, fr, de)
 * @returns {Promise} - Промис загрузки
 */
export async function loadLanguage(langCode) {
    return new Promise((resolve, reject) => {
        try {
            if (!LANGUAGES[langCode]) {
                console.warn(`Language ${langCode} not found, falling back to English`);
                langCode = 'en';
            }
            
            currentTranslations = LANGUAGES[langCode].data;
            currentLanguage = langCode;
            
            // Сохраняем выбор в localStorage
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('wot_language', langCode);
            }
            
            // Сохраняем в PlayerSettings
            if (window.PlayerSettings) {
                window.PlayerSettings.language = langCode;
            }
            
            console.log(`Language loaded: ${LANGUAGES[langCode].name}`);
            
            // Диспетчер событий для уведомления о смене языка
            document.dispatchEvent(new CustomEvent('languageChanged', {
                detail: { language: langCode, languageName: LANGUAGES[langCode].name }
            }));
            
            resolve();
        } catch (error) {
            console.error('Error loading language:', error);
            // Fallback to English
            currentTranslations = en;
            currentLanguage = 'en';
            reject(error);
        }
    });
}

/**
 * Функция перевода
 * @param {string} key - Ключ перевода
 * @returns {string} - Переведенный текст или ключ если перевод не найден
 */
export function t(key) {
    if (!key) return '';
    
    // Поиск перевода в текущем языке
    if (currentTranslations[key] !== undefined) {
        return currentTranslations[key];
    }
    
    // Fallback на английский если перевод не найден
    if (currentLanguage !== 'en' && LANGUAGES.en.data[key] !== undefined) {
        console.warn(`Translation key "${key}" not found in ${currentLanguage}, using English fallback`);
        return LANGUAGES.en.data[key];
    }
    
    // Если ключ не найден даже в английском
    console.warn(`Translation key "${key}" not found in any language`);
    return key;
}

/**
 * Получение текущего языка
 * @returns {string} - Код текущего языка
 */
export function getCurrentLanguage() {
    return currentLanguage;
}

/**
 * Получение названия текущего языка
 * @returns {string} - Название языка
 */
export function getCurrentLanguageName() {
    return LANGUAGES[currentLanguage]?.name || 'English';
}

/**
 * Получение списка доступных языков
 * @returns {Array} - Массив объектов {code, name}
 */
export function getAvailableLanguages() {
    return Object.entries(LANGUAGES).map(([code, data]) => ({
        code,
        name: data.name
    }));
}

/**
 * Инициализация языка при загрузке
 */
export function initLanguage() {
    // 1. Проверка localStorage
    let savedLang = 'en';
    if (typeof localStorage !== 'undefined') {
        savedLang = localStorage.getItem('wot_language') || 'en';
    }
    
    // 2. Проверка языка браузера (только если нет сохраненного)
    if (savedLang === 'en' && typeof navigator !== 'undefined') {
        const browserLang = navigator.language.split('-')[0];
        if (LANGUAGES[browserLang]) {
            savedLang = browserLang;
        }
    }
    
    // 3. Проверка PlayerSettings
    if (window.PlayerSettings && window.PlayerSettings.language) {
        savedLang = window.PlayerSettings.language;
    }
    
    // 4. Загрузка языка
    return loadLanguage(savedLang);
}

/**
 * Смена языка
 * @param {string} langCode - Код языка
 */
export async function changeLanguage(langCode) {
    if (!LANGUAGES[langCode]) {
        throw new Error(`Language ${langCode} is not supported`);
    }
    
    await loadLanguage(langCode);
}

/**
 * Получение перевода с параметрами
 * @param {string} key - Ключ перевода
 * @param {Object} params - Параметры для замены
 * @returns {string} - Переведенный текст с подставленными параметрами
 */
export function tWithParams(key, params = {}) {
    let translation = t(key);
    
    // Замена параметров вида {paramName}
    Object.entries(params).forEach(([param, value]) => {
        const regex = new RegExp(`{${param}}`, 'g');
        translation = translation.replace(regex, value);
    });
    
    return translation;
}

// Автоматическая инициализация при импорте модуля
document.addEventListener('DOMContentLoaded', () => {
    initLanguage().then(() => {
        console.log('Language system initialized');
    });
});

// Экспорт для глобального использования
window.t = t;
window.changeLanguage = changeLanguage;
window.getCurrentLanguage = getCurrentLanguage;

export default {
    loadLanguage,
    t,
    tWithParams,
    getCurrentLanguage,
    getCurrentLanguageName,
    getAvailableLanguages,
    initLanguage,
    changeLanguage,
    LANGUAGES
};