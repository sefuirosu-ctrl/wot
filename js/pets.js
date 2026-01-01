// js/pets.js
import { Events } from "./events.js";

export const PETS = {

  cat: {
    id: "cat",
    name: "Cat",
    emoji: "🐱",
    cooldown: 12000,
    act() {
      Events.emit("effect:add", {
        type: "LOCK_DELAY_BOOST",
        value: 120,
        duration: 2000
      });
    }
  },

  dog: {
    id: "dog",
    name: "Dog",
    emoji: "🐶",
    cooldown: 15000,
    act() {
      Events.emit("effect:add", {
        type: "LOCK_DELAY_BOOST",
        value: 180,
        duration: 2500
      });
    }
  },

  fox: {
    id: "fox",
    name: "Fox",
    emoji: "🦊",
    cooldown: 18000,
    act() {
      Events.emit("effect:add", {
        type: "SHIFT_RANDOM_ROW"
      });
    }
  },

  bear: {
    id: "bear",
    name: "Bear",
    emoji: "🐻",
    cooldown: 20000,
    act() {
      Events.emit("effect:add", {
        type: "BREAK_RANDOM_BLOCK"
      });
    }
  }

};