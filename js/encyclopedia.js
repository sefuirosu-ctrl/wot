import { getLanguage } from "./i18n.js";

const screen = document.getElementById("encyclopediaScreen");
const topicsEl = document.getElementById("encyclopediaTopics");
const contentEl = document.getElementById("encyclopediaContent");
const closeBtn = document.getElementById("encyclopediaClose");

let encyclopediaData = null;

/* ======================
   OPEN / CLOSE
====================== */
export function openEncyclopedia() {
  screen.classList.remove("hidden");
}

window.openEncyclopedia = openEncyclopedia;

/* MENU → ENCYCLOPEDIA BRIDGE */
document.addEventListener("open-encyclopedia", () => {
  loadEncyclopedia();
  openEncyclopedia();
});

closeBtn.onclick = () => screen.classList.add("hidden");

/* ======================
   LOAD DATA (LANG-BASED)
====================== */
async function loadEncyclopedia() {
  const lang = getLanguage?.() || "en";
  const url = `/wot/data/encyclopedia/${lang}.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Not found");
    encyclopediaData = await res.json();
  } catch (e) {
    // fallback to EN
    const fallback = await fetch("/wot/data/encyclopedia/en.json");
    encyclopediaData = await fallback.json();
  }

  renderTopics();
}

/* ======================
   RENDER
====================== */
function renderTopics() {
  topicsEl.innerHTML = "";
  contentEl.innerHTML = "";

  encyclopediaData.chapters.forEach((ch, i) => {
    const div = document.createElement("div");
    div.className = "encyclopedia-topic";
    div.textContent = `${ch.icon ?? ""} ${ch.title}`;
    div.onclick = () => selectTopic(i);
    topicsEl.appendChild(div);
  });

  if (encyclopediaData.chapters.length > 0) {
    selectTopic(0);
  }
}

function selectTopic(index) {
  document.querySelectorAll(".encyclopedia-topic")
    .forEach(el => el.classList.remove("active"));

  topicsEl.children[index].classList.add("active");
  renderContent(encyclopediaData.chapters[index]);
}

function renderContent(chapter) {
  contentEl.innerHTML = `<h3>${chapter.title}</h3>`;

  chapter.sections.forEach(sec => {
    const block = document.createElement("div");
    block.className = "encyclopedia-section";

    const h = document.createElement("h4");
    h.innerHTML = `${sec.icon ?? ""} ${sec.title}`;

    const p = document.createElement("p");
    p.textContent = sec.text;

    block.appendChild(h);
    block.appendChild(p);

    if (sec.diagram) {
      block.appendChild(renderDiagram(sec.diagram, sec.interactive));
    }

    contentEl.appendChild(block);
  });
}

/* ======================
   DIAGRAMS (UNCHANGED)
====================== */
function renderDiagram(type, interactive) {
  const container = document.createElement("div");
  container.className = "diagram" + (interactive ? " interactive" : "");

  const grid = document.createElement("div");
  grid.className = "diagram-grid";

  const patterns = {
    soft_drop: [1, 5, 9, 13],
    hard_drop: [1, 5, 9, 13],
    rotate_piece: [5, 6, 9, 10],
    hold_piece: [1, 2, 5, 6],
    move_left_right: [4, 5, 6]
  };

  const active = patterns[type] || [];
  const cells = [];

  for (let i = 0; i < 16; i++) {
    const c = document.createElement("div");
    c.className = "diagram-cell" + (active.includes(i) ? " block" : "");
    grid.appendChild(c);
    cells.push(c);
  }

  container.appendChild(grid);

  if (interactive) {
    container.onclick = () => playDiagram(type, cells, container);
  }

  return container;
}

function playDiagram(type, cells, container) {
  container.classList.add("playing");
  cells.forEach(c => c.classList.remove("active", "fade"));

  const paths = {
    soft_drop: [1, 5, 9, 13],
    hard_drop: [1, 5, 9, 13],
    rotate_piece: [5, 6, 9, 10],
    move_left_right: [4, 5, 6]
  };

  (paths[type] || []).forEach((idx, i) => {
    setTimeout(() => {
      cells.forEach(c => c.classList.add("fade"));
      cells[idx].classList.add("active");
    }, i * 200);
  });

  setTimeout(() => container.classList.remove("playing"), 1200);
}
