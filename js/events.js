// js/events.js
// Central event bus for game systems

export const Events = {
  _listeners: {},

  on(event, handler) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(handler);
  },

  emit(event, payload) {
    const list = this._listeners[event];
    if (!list) return;
    list.forEach(fn => fn(payload));
  },

  clear() {
    this._listeners = {};
  }
};
