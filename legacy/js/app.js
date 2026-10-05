const TYPES = {
  "alter-ego": { label: "Alter-ego", family: "hero", typeText: "Alter-ego" },
  identity: { label: "Identidad", family: "hero", typeText: "Hero" },
  ally: { label: "Aliado", family: "hero", typeText: "Aliado" },
  event: { label: "Evento", family: "hero", typeText: "Evento" },
  upgrade: { label: "Mejora", family: "hero", typeText: "Mejora" },
  support: { label: "Apoyo", family: "hero", typeText: "Apoyo" },
  resource: { label: "Recurso", family: "hero", typeText: "Recurso" },
  obligation: { label: "Obligación", family: "hero", typeText: "Obligación" },
  "player-scheme": { label: "Plan del jugador", family: "hero", typeText: "Plan", landscape: true },
  villain: { label: "Villano", family: "villain", typeText: "Villano" },
  minion: { label: "Esbirro", family: "villain", typeText: "Esbirro" },
  attachment: { label: "Vinculada", family: "villain", typeText: "Vinculada" },
  treachery: { label: "Traición", family: "villain", typeText: "Traición" },
  environment: { label: "Entorno", family: "villain", typeText: "Entorno" },
  "side-scheme": { label: "Plan secundario", family: "villain", typeText: "Plan", landscape: true },
  "main-scheme": { label: "Plan principal", family: "villain", typeText: "Plan principal", landscape: true }
};

const ASPECTS = {
  Identidad: ["#c41218", "#1a4f9c"],
  Agresión: ["#b12020", "#e14b4b"],
  Justicia: ["#c9b42e", "#f3e58a"],
  Liderazgo: ["#2ea7b8", "#7fd4df"],
  Protección: ["#46991b", "#86c85a"],
  Básico: ["#87868f", "#c8c7cc"],
  Pool: ["#d074ac", "#f0b4d6"]
};

const SPLIT_TYPES = new Set(["alter-ego"]);
const COST_TYPES = new Set(["ally", "event", "upgrade", "support", "resource", "player-scheme"]);
const RESOURCE_TYPES = new Set(["ally", "event", "upgrade", "support", "resource", "player-scheme"]);
const BOOST_TYPES = new Set(["minion", "attachment", "treachery", "environment", "side-scheme"]);
const KEY = "mc-manager-cards-v1";

const fieldsEl = document.querySelector("#fields");
const cardEl = document.querySelector("#card");
const fitEl = document.querySelector("#fit");
const listEl = document.querySelector("#card-list");
const typeEl = document.querySelector("#card-type");
const statusEl = document.querySelector("#status");
const zoomEl = document.querySelector("#zoom");

let cards = [];
let active = 0;
let writing = false;
let saveTimer = 0;

function blankCard(type = "alter-ego") {
  return {
    id: crypto.randomUUID(),
    type,
    title: "",
    subtitle: "",
    typeLabel: "",
    traits: "",
    rules: "",
    quote: "",
    copyright: "",
    setLine: "",
    cost: "",
    costStar: false,
    thw: "",
    thwStar: false,
    atk: "",
    atkStar: false,
    def: "",
    defStar: false,
    rec: "",
    recStar: false,
    hp: "",
    handSize: "",
    identityHp: "",
    stage: "",
    threat: "",
    schemeNo: "",
    boosts: 0,
    boostStar: false,
    attAtk: "",
    attSch: "",
    resources: ["none", "none", "none"],
    cracks: true,
    showSplash: true,
    starSplash: false,
    darkText: false,
    aspect: "",
    left: "#ba8c2c",
    leftAccent: "#ffb81d",
    right: "#263b80",
    rightAccent: "#6f93c4",
    divider: "#d9d3c7",
    outer: "#87868f",
    outerAccent: "#c5c4c8",
    gradTop: "#6e6d76",
    gradBottom: "#2b2a2f",
    photo: "",
    photoZoom: 1,
    photoX: 0,
    photoY: 0,
    headshot: "",
    headZoom: 1,
    headX: 0,
    headY: 0
  };
}

function seed() {
  const card = blankCard("alter-ego");
  card.title = "Nerea Sol";
  card.traits = "Científica.";
  card.rules = "**Acción**: gasta recursos mentales para robar 1 carta.";
  card.quote = "El laboratorio también es un campo de batalla.";
  card.rec = "3";
  card.handSize = "6";
  card.identityHp = "11";
  card.setLine = "Set propio";
  card.copyright = "Contenido propio";
  return card;
}

const SPEC = [
  { section: "Texto", key: "title", label: "Título", control: "textarea", wide: true, show: () => true },
  { section: "Texto", key: "subtitle", label: "Subtítulo", control: "text", show: (c) => c.type === "ally" },
  { section: "Texto", key: "typeLabel", label: "Tipo en la carta", control: "text", show: () => true, placeholder: "Si lo dejas vacío, usa el del tipo" },
  { section: "Texto", key: "traits", label: "Traits", control: "text", wide: true, show: () => true },
  { section: "Texto", key: "rules", label: "Reglas", control: "textarea", wide: true, show: () => true, hint: "Los saltos de línea se respetan. **así** sale en negrita." },
  { section: "Texto", key: "quote", label: "Cita", control: "textarea", wide: true, show: () => true },
  { section: "Texto", key: "setLine", label: "Set", control: "text", show: () => true },
  { section: "Texto", key: "copyright", label: "Autor", control: "text", show: () => true },
  { section: "Texto", key: "darkText", label: "Autor y set en negro", control: "check", show: () => true },

  { section: "Valores", key: "cost", label: "Coste", control: "text", show: (c) => COST_TYPES.has(c.type) },
  { section: "Valores", key: "costStar", label: "Estrella de coste", control: "check", show: (c) => COST_TYPES.has(c.type) },
  { section: "Valores", key: "thw", label: "THW / SCH", control: "text", show: (c) => ["ally", "identity", "minion", "villain"].includes(c.type) },
  { section: "Valores", key: "thwStar", label: "Estrella THW", control: "check", show: (c) => ["ally", "identity", "minion", "villain"].includes(c.type) },
  { section: "Valores", key: "atk", label: "ATK", control: "text", show: (c) => ["ally", "identity", "minion", "villain"].includes(c.type) },
  { section: "Valores", key: "atkStar", label: "Estrella ATK", control: "check", show: (c) => ["ally", "identity", "minion", "villain"].includes(c.type) },
  { section: "Valores", key: "def", label: "DEF", control: "text", show: (c) => c.type === "identity" },
  { section: "Valores", key: "defStar", label: "Estrella DEF", control: "check", show: (c) => c.type === "identity" },
  { section: "Valores", key: "rec", label: "REC", control: "text", show: (c) => c.type === "alter-ego" },
  { section: "Valores", key: "recStar", label: "Estrella REC", control: "check", show: (c) => c.type === "alter-ego" },
  { section: "Valores", key: "hp", label: "PV", control: "text", show: (c) => ["ally", "minion", "villain"].includes(c.type) },
  { section: "Valores", key: "handSize", label: "Mano", control: "text", show: (c) => ["identity", "alter-ego"].includes(c.type) },
  { section: "Valores", key: "identityHp", label: "PV de identidad", control: "text", show: (c) => ["identity", "alter-ego"].includes(c.type) },
  { section: "Valores", key: "stage", label: "Fase (I, II, A…)", control: "text", show: (c) => c.type === "villain" },
  { section: "Valores", key: "threat", label: "Amenaza inicial", control: "text", show: (c) => ["side-scheme", "main-scheme", "player-scheme"].includes(c.type) },
  { section: "Valores", key: "schemeNo", label: "Número de fase", control: "text", show: (c) => c.type === "main-scheme" },
  { section: "Valores", key: "boosts", label: "Iconos de boost", control: "select", options: ["0", "1", "2", "3", "4", "5"],   show: (c) => BOOST_TYPES.has(c.type) },
  { section: "Valores", key: "boostStar", label: "Estrella de boost", control: "check", show: (c) => BOOST_TYPES.has(c.type) },
  { section: "Valores", key: "attAtk", label: "ATK vinculada", control: "text", show: (c) => c.type === "attachment" },
  { section: "Valores", key: "attSch", label: "SCH vinculada", control: "text", show: (c) => c.type === "attachment" },
  { section: "Valores", key: "resource0", label: "Recurso inferior", control: "resource", show: (c) => RESOURCE_TYPES.has(c.type) },
  { section: "Valores", key: "resource1", label: "Recurso medio", control: "resource", show: (c) => RESOURCE_TYPES.has(c.type) },
  { section: "Valores", key: "resource2", label: "Recurso superior", control: "resource", show: (c) => RESOURCE_TYPES.has(c.type) },

  { section: "Imagen", key: "photo", label: "Foto de fondo", control: "file", show: () => true },
  { section: "Imagen", key: "photoZoom", label: "Zoom de la foto", control: "range", min: 1, max: 4, step: 0.01, show: () => true },
  { section: "Imagen", key: "photoX", label: "Foto horizontal", control: "range", min: -1600, max: 1600, step: 1, show: () => true },
  { section: "Imagen", key: "photoY", label: "Foto vertical", control: "range", min: -1600, max: 1600, step: 1, show: () => true },
  { section: "Imagen", key: "showSplash", label: "Mostrar esquina", control: "check", show: (c) => familyOf(c) === "hero" },
  { section: "Imagen", key: "starSplash", label: "Esquina en estrella", control: "check", show: (c) => familyOf(c) === "hero" },
  { section: "Imagen", key: "headshot", label: "Retrato de esquina", control: "file", show: (c) => familyOf(c) === "hero" },
  { section: "Imagen", key: "headZoom", label: "Zoom del retrato", control: "range", min: 0.4, max: 3, step: 0.01, show: (c) => familyOf(c) === "hero" },
  { section: "Imagen", key: "headX", label: "Retrato horizontal", control: "range", min: -200, max: 200, step: 1, show: (c) => familyOf(c) === "hero" },
  { section: "Imagen", key: "headY", label: "Retrato vertical", control: "range", min: -200, max: 200, step: 1, show: (c) => familyOf(c) === "hero" },
  { section: "Imagen", key: "cracks", label: "Grietas en el marco", control: "check", show: (c) => familyOf(c) === "villain" },

  { section: "Color", key: "aspects", label: "Atajo de aspecto", control: "aspects", wide: true, show: (c) => familyOf(c) === "hero" && !SPLIT_TYPES.has(c.type) },
  { section: "Color", key: "frame", label: "Color del marco", control: "color", show: (c) => familyOf(c) === "hero" && !SPLIT_TYPES.has(c.type) && c.aspect !== "Identidad" },
  { section: "Color", key: "frameAccent", label: "Acento del marco", control: "color", show: (c) => familyOf(c) === "hero" && !SPLIT_TYPES.has(c.type) && c.aspect !== "Identidad" },
  { section: "Color", key: "primary", label: "Color principal", control: "color", show: (c) => c.type === "identity" && c.aspect === "Identidad" },
  { section: "Color", key: "secondary", label: "Color secundario", control: "color", show: (c) => c.type === "identity" && c.aspect === "Identidad" },
  { section: "Color", key: "left", label: "Color izquierdo", control: "color", show: (c) => SPLIT_TYPES.has(c.type) },
  { section: "Color", key: "leftAccent", label: "Acento izquierdo", control: "color", show: (c) => SPLIT_TYPES.has(c.type) },
  { section: "Color", key: "right", label: "Color derecho", control: "color", show: (c) => SPLIT_TYPES.has(c.type) },
  { section: "Color", key: "rightAccent", label: "Acento derecho", control: "color", show: (c) => SPLIT_TYPES.has(c.type) },
  { section: "Color", key: "divider", label: "Divisor", control: "color", show: (c) => SPLIT_TYPES.has(c.type) },
  { section: "Color", key: "outer", label: "Borde exterior", control: "color", show: (c) => familyOf(c) === "villain" },
  { section: "Color", key: "outerAccent", label: "Acento del borde", control: "color", show: (c) => familyOf(c) === "villain" },
  { section: "Color", key: "gradTop", label: "Degradado superior", control: "color", show: (c) => familyOf(c) === "villain" },
  { section: "Color", key: "gradBottom", label: "Degradado inferior", control: "color", show: (c) => familyOf(c) === "villain" }
];

function familyOf(card) {
  return TYPES[card.type]?.family || "hero";
}

function current() {
  return cards[active];
}

function setStatus(text) {
  statusEl.textContent = text;
}

function statText(value, star) {
  if (!value && !star) return "";
  return `${value || ""}${star ? "★" : ""}`;
}

function formatRules(raw) {
  const escaped = String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}

function show(el, on) {
  el.hidden = !on;
}

function renderCard() {
  const card = current();
  const meta = TYPES[card.type];
  cardEl.dataset.type = card.type;
  cardEl.dataset.family = meta.family;
  cardEl.dataset.cracks = meta.family === "villain" && card.cracks ? "on" : "off";
  cardEl.classList.toggle("is-star", card.starSplash);
  cardEl.classList.toggle("is-dark-text", card.darkText);
  cardEl.classList.toggle("is-dual", card.type === "identity" && card.aspect === "Identidad");
  cardEl.style.setProperty("--left", card.left);
  cardEl.style.setProperty("--left-accent", card.leftAccent);
  cardEl.style.setProperty("--right", card.right);
  cardEl.style.setProperty("--right-accent", card.rightAccent);
  cardEl.style.setProperty("--divider", SPLIT_TYPES.has(card.type) ? card.divider : card.left);
  cardEl.style.setProperty("--outer", card.outer);
  cardEl.style.setProperty("--outer-accent", card.outerAccent);
  cardEl.style.setProperty("--grad-top", card.gradTop);
  cardEl.style.setProperty("--grad-bottom", card.gradBottom);
  cardEl.style.setProperty("--px", card.photoX);
  cardEl.style.setProperty("--py", card.photoY);
  cardEl.style.setProperty("--pz", Math.max(1, Number(card.photoZoom) || 1));
  cardEl.style.setProperty("--hx", card.headX);
  cardEl.style.setProperty("--hy", card.headY);
  cardEl.style.setProperty("--hz", card.headZoom);

  const title = cardEl.querySelector(".card__title");
  title.textContent = card.title || "Título";
  title.classList.toggle("is-empty", !card.title);

  const subtitle = cardEl.querySelector(".card__subtitle");
  subtitle.textContent = card.subtitle;
  show(subtitle, card.type === "ally" && card.subtitle);

  show(cardEl.querySelector(".card__split"), SPLIT_TYPES.has(card.type));
  show(cardEl.querySelector(".card__cracks"), meta.family === "villain" && card.cracks);

  const cost = cardEl.querySelector(".card__cost");
  cost.textContent = statText(card.cost, card.costStar);
  show(cost, COST_TYPES.has(card.type) && (card.cost || card.costStar));

  bindStat(".card__stat--thw", ["ally", "identity", "minion", "villain"].includes(card.type), card.thw, card.thwStar, card.type === "identity" || card.type === "ally" ? "THW" : "SCH");
  bindStat(".card__stat--atk", ["ally", "identity", "minion", "villain"].includes(card.type), card.atk, card.atkStar, "ATK");
  bindStat(".card__stat--def", card.type === "identity", card.def, card.defStar, "DEF");
  bindStat(".card__stat--rec", card.type === "alter-ego", card.rec, card.recStar, "REC");

  cardEl.querySelector(".card__type").textContent = card.typeLabel || meta.typeText;

  cardEl.querySelector(".card__traits").textContent = card.traits;
  const rules = cardEl.querySelector(".card__rules");
  rules.innerHTML = formatRules(card.rules);
  const length = card.rules.length;
  rules.classList.toggle("is-tight", length > 220 && length <= 420);
  rules.classList.toggle("is-dense", length > 420);

  const quote = cardEl.querySelector(".card__quote");
  quote.textContent = card.quote;
  show(quote, Boolean(card.quote));

  const hp = cardEl.querySelector(".card__hp");
  hp.textContent = card.hp;
  show(hp, ["ally", "minion", "villain"].includes(card.type) && card.hp);

  const metaBox = cardEl.querySelector(".card__meta");
  const showMeta = ["identity", "alter-ego"].includes(card.type) && (card.handSize || card.identityHp);
  show(metaBox, showMeta);
  cardEl.querySelector(".card__hand").textContent = card.handSize;
  cardEl.querySelector(".card__hpmeta").textContent = card.identityHp;
  cardEl.querySelector(".card__hand-label").textContent = card.type === "identity" ? "Hand size" : "Mano";
  cardEl.querySelector(".card__hp-label").textContent = card.type === "identity" ? "Hit points" : "PV";

  const resources = cardEl.querySelector(".card__resources");
  resources.replaceChildren();
  if (RESOURCE_TYPES.has(card.type)) {
    card.resources.forEach((kind) => {
      if (!kind || kind === "none") return;
      const pip = document.createElement("i");
      pip.className = `pip pip--${kind}`;
      resources.append(pip);
    });
  }

  const splash = cardEl.querySelector(".card__splash");
  const head = cardEl.querySelector(".card__headshot");
  show(splash, meta.family === "hero" && card.showSplash && !meta.landscape);
  if (card.headshot) head.src = card.headshot;
  else head.removeAttribute("src");

  syncPhoto(cardEl.querySelector(".card__photo"), card.photo);

  const stage = cardEl.querySelector(".card__stage");
  stage.textContent = card.stage;
  show(stage, card.type === "villain" && card.stage);

  const threat = cardEl.querySelector(".card__threat");
  threat.textContent = card.threat;
  show(threat, ["side-scheme", "main-scheme", "player-scheme"].includes(card.type) && card.threat);

  const schemeNo = cardEl.querySelector(".card__scheme-no");
  schemeNo.textContent = card.schemeNo;
  show(schemeNo, card.type === "main-scheme" && card.schemeNo);

  const boosts = cardEl.querySelector(".card__boosts");
  const boostCount = Number(card.boosts) || 0;
  const showBoosts = (BOOST_TYPES.has(card.type) || card.type === "side-scheme") && (boostCount || card.boostStar);
  show(boosts, showBoosts);
  boosts.replaceChildren();
  for (let i = 0; i < boostCount; i += 1) {
    boosts.append(document.createElement("i"));
  }
  if (card.boostStar) {
    const star = document.createElement("b");
    star.textContent = "★";
    boosts.append(star);
  }

  const attach = cardEl.querySelector(".card__attach");
  const attachBits = [card.attAtk && `ATK ${card.attAtk}`, card.attSch && `SCH ${card.attSch}`].filter(Boolean);
  attach.textContent = attachBits.join("  ");
  show(attach, card.type === "attachment" && attachBits.length);

  cardEl.querySelector(".card__set").textContent = card.setLine;
  cardEl.querySelector(".card__copy").textContent = card.copyright;
  fitEl.classList.toggle("is-landscape", Boolean(meta.landscape));
}

function placePhoto(img) {
  const wrap = img.parentElement;
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  const holeWidth = wrap.offsetWidth;
  const holeHeight = wrap.offsetHeight;
  if (!naturalWidth || !naturalHeight || !holeWidth || !holeHeight) return;
  const cover = Math.max(holeWidth / naturalWidth, holeHeight / naturalHeight);
  const width = naturalWidth * cover;
  const height = naturalHeight * cover;
  img.style.width = `${width}px`;
  img.style.height = `${height}px`;
  cardEl.style.setProperty("--ox", (holeWidth - width) / 2);
  cardEl.style.setProperty("--oy", (holeHeight - height) / 2);
  img.classList.add("is-placed");
}

function syncPhoto(img, src) {
  if (!src) {
    img.onload = null;
    img.removeAttribute("src");
    img.classList.remove("is-placed");
    img.style.width = "";
    img.style.height = "";
    return;
  }
  const apply = () => {
    if (img.src !== src) return;
    placePhoto(img);
  };
  if (img.src !== src) {
    img.classList.remove("is-placed");
    img.onload = apply;
    img.src = src;
  }
  if (img.complete && img.naturalWidth) apply();
}

function bindStat(selector, visible, value, star, label) {
  const el = cardEl.querySelector(selector);
  const text = statText(value, star);
  el.replaceChildren();
  if (text) {
    const number = document.createElement("span");
    number.textContent = text;
    const name = document.createElement("small");
    name.textContent = label;
    el.append(number, name);
  }
  show(el, visible && text);
}

function fieldValue(card, key) {
  if (key.startsWith("resource")) return card.resources[Number(key.slice(-1))] || "none";
  if (key === "frame" || key === "primary") return card.left;
  if (key === "frameAccent") return card.leftAccent;
  if (key === "secondary") return card.right;
  return card[key];
}

function applyAspect(card, name) {
  const colors = ASPECTS[name];
  if (!colors) return;
  card.aspect = name;
  if (name === "Identidad") {
    card.left = colors[0];
    card.leftAccent = colors[0];
    card.right = colors[1];
    card.rightAccent = colors[1];
  } else {
    card.left = colors[0];
    card.right = colors[0];
    card.leftAccent = colors[1];
    card.rightAccent = colors[1];
  }
}

function applyField(card, key, value) {
  if (key.startsWith("resource")) {
    card.resources[Number(key.slice(-1))] = value;
    return;
  }
  if (key === "frame") {
    card.left = value;
    card.right = value;
    return;
  }
  if (key === "frameAccent") {
    card.leftAccent = value;
    card.rightAccent = value;
    return;
  }
  if (key === "primary") {
    card.left = value;
    card.leftAccent = value;
    return;
  }
  if (key === "secondary") {
    card.right = value;
    card.rightAccent = value;
    return;
  }
  card[key] = value;
}

function buildForm() {
  const sections = [];
  SPEC.forEach((field) => {
    let section = sections.find((item) => item.name === field.section);
    if (!section) {
      section = { name: field.section, fields: [] };
      sections.push(section);
    }
    section.fields.push(field);
  });

  fieldsEl.replaceChildren();
  sections.forEach((section) => {
    const block = document.createElement("section");
    block.className = "section";
    const title = document.createElement("h2");
    title.textContent = section.name;
    const grid = document.createElement("div");
    grid.className = "grid";
    section.fields.forEach((field) => {
      grid.append(renderControl(field));
    });
    block.append(title, grid);
    fieldsEl.append(block);
  });
}

function renderControl(field) {
  const wrap = document.createElement("label");
  wrap.className = field.wide ? "wide" : "";
  wrap.dataset.key = field.key;
  if (field.control === "check") wrap.classList.add("check");

  if (field.control === "aspects") {
    wrap.append(field.label);
    const row = document.createElement("div");
    row.className = "aspects";
    Object.entries(ASPECTS).forEach(([name, colors]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      button.dataset.aspect = name;
      if (name === "Identidad") {
        button.style.background = `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`;
      } else {
        button.style.setProperty("--swatch", colors[0]);
      }
      button.addEventListener("click", () => {
        applyAspect(current(), name);
        writeForm();
        renderCard();
        queueSave();
      });
      row.append(button);
    });
    wrap.append(row);
    return wrap;
  }

  const caption = document.createElement("span");
  caption.textContent = field.label;
  if (field.control !== "check") wrap.append(caption);

  let input;
  if (field.control === "textarea") {
    input = document.createElement("textarea");
  } else if (field.control === "select" || field.control === "resource") {
    input = document.createElement("select");
    const options = field.control === "resource"
      ? [["none", "Ninguno"], ["energy", "Energía"], ["mental", "Mental"], ["physical", "Físico"], ["wild", "Salvaje"]]
      : field.options.map((value) => [value, value]);
    options.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      input.append(option);
    });
  } else if (field.control === "file") {
    const row = document.createElement("div");
    row.className = "file-row";
    input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "ghost";
    clear.textContent = "Quitar";
    clear.addEventListener("click", () => {
      const key = field.key;
      current()[key] = "";
      input.value = "";
      renderCard();
      queueSave();
    });
    row.append(input, clear);
    wrap.append(row);
  } else if (field.control === "color") {
    input = document.createElement("input");
    input.type = "color";
  } else if (field.control === "range") {
    input = document.createElement("input");
    input.type = "range";
    input.min = field.min;
    input.max = field.max;
    input.step = field.step;
  } else if (field.control === "check") {
    input = document.createElement("input");
    input.type = "checkbox";
    wrap.append(input, caption);
  } else {
    input = document.createElement("input");
    input.type = "text";
    if (field.placeholder) input.placeholder = field.placeholder;
  }

  if (input && field.control !== "check") {
    input.dataset.field = field.key;
    if (field.control !== "file") wrap.append(input);
    else input.dataset.field = field.key;
  }
  if (input && field.control === "check") input.dataset.field = field.key;
  if (field.hint) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = field.hint;
    wrap.append(hint);
  }
  return wrap;
}

function writeForm() {
  writing = true;
  const card = current();
  typeEl.value = card.type;
  fieldsEl.querySelectorAll("[data-field]").forEach((input) => {
    const value = fieldValue(card, input.dataset.field);
    if (input.type === "checkbox") input.checked = Boolean(value);
    else if (input.type === "file") input.value = "";
    else if (value !== undefined) input.value = value;
  });
  SPEC.forEach((field) => {
    const wrap = fieldsEl.querySelector(`[data-key="${field.key}"]`);
    if (wrap) wrap.hidden = !field.show(card);
  });
  fieldsEl.querySelectorAll(".aspects button").forEach((button) => {
    button.hidden = button.dataset.aspect === "Identidad" && card.type !== "identity";
    button.classList.toggle("is-selected", button.dataset.aspect === card.aspect);
  });
  writing = false;
}

function readInput(input) {
  if (input.type === "checkbox") return input.checked;
  if (input.type === "range") return Number(input.value);
  if (input.dataset.field === "boosts") return Number(input.value);
  return input.value;
}

function fillList() {
  listEl.replaceChildren();
  cards.forEach((card, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = card.title || `Carta ${index + 1}`;
    listEl.append(option);
  });
  listEl.value = String(active);
}

function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 250);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ cards, active }));
    setStatus("Guardado en este navegador");
  } catch (error) {
    setStatus("La foto no cabe en el navegador. Usa Guardar JSON.");
  }
}

function normalizeCard(card) {
  const next = { ...blankCard(), ...card, resources: card.resources || ["none", "none", "none"] };
  if (next.aspect === "Héroe") next.aspect = "Identidad";
  return next;
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved?.cards?.length) {
      cards = saved.cards.map(normalizeCard);
      active = Math.min(saved.active || 0, cards.length - 1);
      return;
    }
  } catch (error) {
    setStatus("No se pudo leer el guardado anterior");
  }
  cards = [seed()];
  active = 0;
}

function refresh() {
  fillList();
  writeForm();
  renderCard();
}

async function downloadPng() {
  const css = [...document.styleSheets].map((sheet) => {
    try {
      return [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
    } catch (error) {
      return "";
    }
  }).join("\n");
  const clone = cardEl.cloneNode(true);
  clone.style.transform = "none";
  const style = document.createElement("style");
  style.textContent = css;
  const holder = document.createElement("div");
  holder.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  holder.append(style, clone);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="1500" height="2150">
      <foreignObject width="1500" height="2150">${new XMLSerializer().serializeToString(holder)}</foreignObject>
    </svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1500;
    canvas.height = 2150;
    canvas.getContext("2d").drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    const name = (current().title || "carta").replace(/[^\w\-]+/g, "-");
    link.download = `${name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setStatus("PNG descargado");
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    setStatus("No se pudo generar el PNG en este navegador");
  };
  image.src = url;
}

function saveJson() {
  const blob = new Blob([JSON.stringify({ cards, active }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "cartas.json";
  link.click();
  setStatus("JSON descargado");
}

typeEl.replaceChildren();
Object.entries(TYPES).forEach(([value, meta]) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = meta.label;
  typeEl.append(option);
});

buildForm();
load();
refresh();

fieldsEl.addEventListener("input", (event) => {
  if (writing) return;
  const input = event.target;
  if (!input.dataset.field || input.type === "file") return;
  applyField(current(), input.dataset.field, readInput(input));
  renderCard();
  fillList();
  queueSave();
});

fieldsEl.addEventListener("change", (event) => {
  const input = event.target;
  if (input.type !== "file" || !input.dataset.field || !input.files[0]) return;
  const key = input.dataset.field;
  const reader = new FileReader();
  reader.onload = () => {
    const card = current();
    card[key] = reader.result;
    if (key === "photo") {
      card.photoZoom = 1;
      card.photoX = 0;
      card.photoY = 0;
    }
    writeForm();
    renderCard();
    queueSave();
  };
  reader.readAsDataURL(input.files[0]);
});

typeEl.addEventListener("change", () => {
  const card = current();
  card.type = typeEl.value;
  if (card.type === "identity") applyAspect(card, "Identidad");
  else if (card.aspect === "Identidad") card.aspect = "";
  writeForm();
  renderCard();
  fitPreview();
  queueSave();
});

listEl.addEventListener("change", () => {
  active = Number(listEl.value);
  refresh();
  queueSave();
});

document.querySelector("#add-card").addEventListener("click", () => {
  cards.splice(active + 1, 0, blankCard(current().type));
  active += 1;
  refresh();
  queueSave();
});

document.querySelector("#copy-card").addEventListener("click", () => {
  const copy = structuredClone(current());
  copy.id = crypto.randomUUID();
  copy.title = copy.title ? `${copy.title} copia` : "";
  cards.splice(active + 1, 0, copy);
  active += 1;
  refresh();
  queueSave();
});

document.querySelector("#delete-card").addEventListener("click", () => {
  cards.splice(active, 1);
  if (!cards.length) cards.push(blankCard());
  active = Math.max(0, active - 1);
  refresh();
  queueSave();
});

document.querySelector("#download-png").addEventListener("click", downloadPng);
document.querySelector("#save-json").addEventListener("click", saveJson);
document.querySelector("#load-json").addEventListener("click", () => {
  document.querySelector("#json-file").click();
});
document.querySelector("#json-file").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const incoming = Array.isArray(data) ? data : data.cards;
      if (!incoming?.length) throw new Error("vacío");
      cards = incoming.map(normalizeCard);
      active = 0;
      refresh();
      persist();
      setStatus(`Cargadas ${cards.length} cartas`);
    } catch (error) {
      setStatus("Ese JSON no tiene cartas");
    }
  };
  reader.readAsText(file);
});

function fitPreview() {
  const stage = document.querySelector(".preview__stage");
  const landscape = fitEl.classList.contains("is-landscape");
  const width = landscape ? 2150 : 1500;
  const height = landscape ? 1500 : 2150;
  const zoom = Math.min((stage.clientWidth - 28) / width, (stage.clientHeight - 16) / height);
  const value = Math.max(0.18, Math.min(0.55, zoom || 0.34));
  zoomEl.value = String(value);
  document.documentElement.style.setProperty("--zoom", String(value));
}

zoomEl.addEventListener("input", () => {
  document.documentElement.style.setProperty("--zoom", zoomEl.value);
});

window.addEventListener("resize", fitPreview);
fitPreview();
