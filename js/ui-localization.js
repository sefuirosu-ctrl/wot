// js/ui-localization.js
import { t } from "./i18n.js";

/**
 * UI Localization Bridge
 * Содержит ВСЕ функции локализации интерфейса
 * main.js будет только импортировать и вызывать их
 */

export function localizeMenu() {
  const menu = document.getElementById('startScreen');
  if (!menu) return;
  
  // Localize menu panels
  const menuPanels = menu.querySelectorAll('.menu-panel');
  
  menuPanels.forEach(panel => {
    const menuType = panel.getAttribute('data-menu');
    
    // Localize panel titles
    const title = panel.querySelector('h2');
    if (title) {
      switch(menuType) {
        case 'title':
          title.textContent = t('title_main') || 'WORLD OF TETRIS';
          break;
        case 'hero':
          title.textContent = t('select_hero');
          break;
        case 'pet':
          title.textContent = t('select_pet');
          break;
      }
    }
    
    // Localize buttons with data-action
    const buttons = panel.querySelectorAll('button[data-action]');
    buttons.forEach(btn => {
      const action = btn.getAttribute('data-action');
      const translations = {
        'start': 'menu_start',
        'tutorial': 'menu_tutorial',
        'settings': 'menu_settings'
      };
      if (translations[action]) {
        btn.textContent = t(translations[action]);
      }
    });
    
    // Localize hero/pet selection
    panel.querySelectorAll('button[data-hero]').forEach(btn => {
      const hero = btn.getAttribute('data-hero');
      btn.textContent = t(`hero_${hero}`) || btn.textContent;
    });
    
    panel.querySelectorAll('button[data-pet]').forEach(btn => {
      const pet = btn.getAttribute('data-pet');
      btn.textContent = t(`pet_${pet}`) || btn.textContent;
    });
  });
}

export function localizeHUD() {
  // Safely localize HUD elements
  const selectors = [
    ['.hud-item:nth-child(1)', 'score'],
    ['.hud-item:nth-child(2)', 'level'],
    ['.hud-item:nth-child(3)', 'lines'],
    ['.hud-item:nth-child(4)', 'time']
  ];
  
  selectors.forEach(([selector, key]) => {
    const element = document.querySelector(selector);
    if (element?.childNodes[0]) {
      element.childNodes[0].textContent = t(key) + ' ';
    }
  });
}

export function localizeGameElements() {
  // Localize control hints
  const controlsHint = document.getElementById('controlsHint');
  if (controlsHint) {
    controlsHint.textContent = t('controls_hint') || 
      '← → move | ↑ rotate | ↓ soft drop | Space hard drop | Shift / Ctrl hold';
  }
  
  // Localize panel titles
  const holdTitle = document.querySelector('.panel:first-child h3');
  const nextTitle = document.querySelector('.panel:last-child h3');
  
  if (holdTitle) holdTitle.textContent = t('hold') || 'HOLD';
  if (nextTitle) nextTitle.textContent = t('next') || 'NEXT';
}

/**
 * Main bridge function - вызывается из main.js
 */
export function localizeAllUI() {
  localizeMenu();
  localizeHUD();
  localizeGameElements();
}

document.addEventListener('languageChanged', () => {
  localizeAllUI();
});