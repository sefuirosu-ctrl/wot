// js/i18n.js (дополненная версия)
let dictionary = {};
let currentLanguage = "en";

export async function loadLanguage(lang) {
  try {
    const module = await import(`/wot/lang/${lang}.js`);
    dictionary = module.default;
    currentLanguage = lang;
    
    // Dispatch event for UI updates
    document.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: lang }
    }));
    
    return true;
  } catch (e) {
    console.warn(`Language ${lang} not found, fallback to EN`);
    const fallback = await import(`/wot/lang/en.js`);
    dictionary = fallback.default;
    currentLanguage = "en";
    return false;
  }
}

export function t(key) {
  return dictionary[key] || key;
}

export function getLanguage() {
  return currentLanguage;
}

/**
 * Check if key exists in dictionary
 */
export function hasKey(key) {
  return key in dictionary;
}

/**
 * Get all available translation keys
 */
export function getTranslationKeys() {
  return Object.keys(dictionary);
}