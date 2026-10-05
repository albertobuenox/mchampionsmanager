import { parseResources } from "@/lib/card-defaults";
import { TYPE_LABELS } from "@/lib/hero-template";
import { parseTraits } from "@/lib/traits";

export type StatsCard = {
  type: string;
  title?: string;
  quantity?: number;
  cost?: string;
  aspect?: string;
  resources?: string;
  traits?: string;
  atk?: string;
  thw?: string;
  def?: string;
  rec?: string;
  handSize?: string;
  identityHp?: string;
  rules?: string;
};

/** Draw-deck types shown in faction/type charts (MarvelCDB style). */
export const DRAW_DECK_TYPES = new Set([
  "ally",
  "event",
  "upgrade",
  "support",
  "resource",
]);

export const RESOURCE_ORDER = ["physical", "mental", "energy", "wild"] as const;
export type ResourceKind = (typeof RESOURCE_ORDER)[number];

export const RESOURCE_META: Record<
  ResourceKind,
  { label: string; color: string; icon: string }
> = {
  physical: { label: "Physical", color: "#8b3a2f", icon: "✊" },
  mental: { label: "Mental", color: "#2f5f9e", icon: "🧠" },
  energy: { label: "Energy", color: "#d97706", icon: "⚡" },
  wild: { label: "Wild", color: "#3f7a3a", icon: "★" },
};

export const ASPECT_COLORS: Record<string, string> = {
  Agresión: "#b12020",
  Justicia: "#c9b42e",
  Liderazgo: "#2ea7b8",
  Protección: "#46991b",
  Básico: "#87868f",
  Pool: "#d074ac",
  Identidad: "#c41218",
};

export const TYPE_CHART_COLORS: Record<string, string> = {
  event: "#c41218",
  ally: "#3b82c4",
  upgrade: "#3f7a3a",
  support: "#5c5c5c",
  resource: "#8b6914",
};

function qty(card: StatsCard) {
  return Math.max(1, card.quantity || 1);
}

function isDrawDeck(card: StatsCard) {
  return DRAW_DECK_TYPES.has(card.type);
}

/** Parse numeric cost; X / ★ / empty → null (ignored). */
export function parseCostValue(raw: string | undefined): number | null {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t || /^[xX★*]+$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseStat(raw: string | undefined): number {
  if (raw == null || raw === "") return 0;
  const t = String(raw).trim().replace(/★/g, "");
  if (!t || /^[xX*]+$/.test(t)) return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type DeckChecklistItem = {
  id: string;
  section: string;
  question: string;
  level: "green" | "amber" | "red" | "info";
  answer: string;
  metric?: string;
};

export type DeckFlag = {
  id: string;
  level: "green" | "red" | "amber";
  title: string;
  detail: string;
};

export type DeckStats = {
  resources: Array<{
    kind: ResourceKind;
    basic: number;
    aspect: number;
    total: number;
  }>;
  costs: Array<{ cost: number; count: number }>;
  factions: Array<{ aspect: string; count: number; color: string }>;
  types: Array<{ type: string; label: string; count: number; color: string }>;
  /** Extra analysis */
  drawSize: number;
  avgCost: number | null;
  lowCostShare: number;
  highCostShare: number;
  costXCount: number;
  iconsPerCard: number;
  maxResourceShare: number;
  maxResourceKind: ResourceKind | null;
  allyCount: number;
  eventShare: number;
  permanentShare: number;
  resourceCardShare: number;
  allyAtk: number;
  allyThw: number;
  composition: Array<{ key: string; label: string; count: number; color: string }>;
  playability: Array<{ resources: number; count: number; share: number }>;
  topTraits: Array<{ trait: string; count: number }>;
  flags: DeckFlag[];
  checklist: DeckChecklistItem[];
  score: number;
};

function cardIconCount(card: StatsCard): number {
  return parseResources(card.resources || "[]").filter(
    (k) => k === "physical" || k === "mental" || k === "energy" || k === "wild"
  ).length;
}

function traitsLower(card: StatsCard): string[] {
  return parseTraits(card.traits).map((t) => t.toLowerCase());
}

function hasAnyTrait(card: StatsCard, names: string[]): boolean {
  const set = new Set(traitsLower(card));
  return names.some((n) => set.has(n.toLowerCase()));
}

function rulesMatch(card: StatsCard, re: RegExp): boolean {
  return re.test(card.rules || "");
}

function buildViabilityChecklist(input: {
  cards: StatsCard[];
  draw: StatsCard[];
  drawSize: number;
  avgCost: number | null;
  iconsPerCard: number;
  highCostShare: number;
  lowCostShare: number;
  totalIcons: number;
  allyCount: number;
  allyAtk: number;
  allyThw: number;
  permanentCount: number;
  eventCount: number;
}): DeckChecklistItem[] {
  const {
    cards,
    draw,
    drawSize,
    avgCost,
    iconsPerCard,
    highCostShare,
    lowCostShare,
    totalIcons,
    allyCount,
    allyAtk,
    allyThw,
    permanentCount,
    eventCount,
  } = input;

  const items: DeckChecklistItem[] = [];
  const identity = cards.find((c) => c.type === "identity");
  const alterEgo = cards.find((c) => c.type === "alter-ego");

  // —— 1. Economía ——
  const avgLabel = avgCost == null ? "—" : avgCost.toFixed(2);
  const erOk = iconsPerCard >= 1.1;
  const costOk = avgCost != null && avgCost <= 1.8;
  items.push({
    id: "avg-er",
    section: "Economía y curva",
    question: "¿Cuál es el coste medio y el recurso efectivo (ER) del mazo?",
    level: costOk && erOk ? "green" : !costOk || iconsPerCard < 0.85 ? "red" : "amber",
    answer:
      avgCost == null
        ? "Sin costes numéricos suficientes para medir."
        : `Coste medio ${avgLabel}; ER proxy ${iconsPerCard.toFixed(2)} iconos/carta (meta ≈ ≥1.1).`,
    metric: `avg ${avgLabel} · ER ${iconsPerCard.toFixed(2)}`,
  });

  const brickRisk =
    highCostShare >= 0.4 && iconsPerCard < 1.0
      ? "red"
      : highCostShare >= 0.35 || (highCostShare >= 0.25 && iconsPerCard < 1.05)
        ? "amber"
        : "green";
  items.push({
    id: "brick",
    section: "Economía y curva",
    question: "¿Riesgo de brick con varias cartas de coste ≥3?",
    level: brickRisk,
    answer:
      brickRisk === "green"
        ? `Curva manejable: ${(highCostShare * 100).toFixed(0)}% ≥3 y ${(lowCostShare * 100).toFixed(0)}% ≤1.`
        : brickRisk === "red"
          ? `Alto: ${(highCostShare * 100).toFixed(0)}% coste ≥3 con solo ${iconsPerCard.toFixed(2)} iconos/carta.`
          : `Moderado: ${(highCostShare * 100).toFixed(0)}% ≥3 · ${iconsPerCard.toFixed(2)} iconos/carta.`,
    metric: `${(highCostShare * 100).toFixed(0)}% ≥3`,
  });

  let doubleResCards = 0;
  let doubleResCopies = 0;
  for (const card of draw) {
    if (cardIconCount(card) >= 2) {
      doubleResCards += 1;
      doubleResCopies += qty(card);
    }
  }
  items.push({
    id: "double-res",
    section: "Economía y curva",
    question: "¿Motor de recursos dobles (Fuerza / Energía / Genio…)?",
    level: doubleResCopies >= 4 ? "green" : doubleResCopies >= 2 ? "amber" : "red",
    answer:
      doubleResCopies === 0
        ? "Sin cartas con ≥2 iconos de recurso."
        : `${doubleResCopies} copias (${doubleResCards} títulos) con ≥2 iconos.`,
    metric: `${doubleResCopies} copias`,
  });

  items.push({
    id: "permanents",
    section: "Economía y curva",
    question: "¿Apoyos/permanentes para financiar infraestructura?",
    level: permanentCount >= 8 ? "green" : permanentCount >= 4 ? "amber" : "red",
    answer: `${permanentCount} upgrades/supports (proxy de generadores; sin diccionario de Helicarrier aún).`,
    metric: `${permanentCount} permanentes`,
  });

  const boardImpact = allyAtk + allyThw;
  const impactPerIcon = totalIcons > 0 ? boardImpact / totalIcons : 0;
  items.push({
    id: "impact-ratio",
    section: "Economía y curva",
    question: "¿Tasa impacto/recurso (proxy ATK+THW aliados ÷ iconos)?",
    level:
      totalIcons === 0
        ? "info"
        : impactPerIcon >= 2
          ? "green"
          : impactPerIcon >= 1.2
            ? "amber"
            : "red",
    answer:
      totalIcons === 0
        ? "Sin iconos de recurso para el ratio."
        : `${impactPerIcon.toFixed(2)} pts de mesa por icono (meta orientativa ≈ 2). Solo aliados; eventos ATK/THW no están etiquetados.`,
    metric: `${impactPerIcon.toFixed(2)} / icono`,
  });

  // —— 2. Control de mesa ——
  items.push({
    id: "board-pillars",
    section: "Control de mesa",
    question: "¿Capacidad de attack / thwart en mesa (aliados)?",
    level:
      allyAtk >= 8 && allyThw >= 6
        ? "green"
        : allyAtk < 4 || allyThw < 3
          ? "red"
          : "amber",
    answer: `ATK aliados ${allyAtk} · THW aliados ${allyThw} (${allyCount} aliados).`,
    metric: `ATK ${allyAtk} / THW ${allyThw}`,
  });

  let cheapThwart = 0;
  let cheapAttack = 0;
  let aoeProxy = 0;
  for (const card of draw) {
    const q = qty(card);
    const cost = parseCostValue(card.cost);
    const cheap = cost != null && cost <= 1;
    const attackish =
      hasAnyTrait(card, ["attack", "ataque"]) ||
      rulesMatch(card, /\b(attack|ataque|damage|daño)\b/i);
    const thwartish =
      hasAnyTrait(card, ["thwart", "retirada", "scheme"]) ||
      rulesMatch(card, /\b(thwart|retir|threat|amenaza)\b/i);
    if (card.type === "event" && cheap && thwartish) cheapThwart += q;
    if (card.type === "event" && cheap && attackish) cheapAttack += q;
    if (
      rulesMatch(card, /\boverkill\b/i) ||
      rulesMatch(card, /\beach (minion|enemy|enemigo|esbirro)\b/i) ||
      rulesMatch(card, /\ba todos los (minions|esbirros|enemigos)\b/i)
    ) {
      aoeProxy += q;
    }
  }
  items.push({
    id: "instant-thwart",
    section: "Control de mesa",
    question: "¿Respuesta inmediata a amenaza (eventos baratos de thwart)?",
    level:
      cheapThwart + (allyThw >= 6 ? 2 : 0) >= 4
        ? "green"
        : cheapThwart >= 2 || allyThw >= 4
          ? "amber"
          : "red",
    answer: `${cheapThwart} eventos coste ≤1 con thwart/amenaza + THW de mesa ${allyThw}.`,
    metric: `${cheapThwart} eventos ≤1`,
  });

  const rec = parseStat(alterEgo?.rec);
  const handSize = parseStat(alterEgo?.handSize);
  const aeLevel =
    !alterEgo
      ? "info"
      : rec >= 3 && handSize >= 5
        ? "green"
        : rec >= 2 || handSize >= 6
          ? "amber"
          : "red";
  items.push({
    id: "alter-ego",
    section: "Control de mesa",
    question: "¿Tolerancia a flip a Alter-Ego (REC + mano)?",
    level: aeLevel,
    answer: !alterEgo
      ? "Sin carta alter-ego en el mazo importado."
      : `REC ${rec || "—"} · mano ${handSize || "—"} · ${permanentCount} permanentes (siguen en juego al flip).`,
    metric: alterEgo ? `REC ${rec} · HS ${handSize}` : "—",
  });

  items.push({
    id: "swarm",
    section: "Control de mesa",
    question: "¿Gestión de esbirros (AoE / Overkill / ataques baratos)?",
    level: aoeProxy >= 2 || cheapAttack >= 4 ? "green" : aoeProxy >= 1 || cheapAttack >= 2 ? "amber" : "red",
    answer: `${aoeProxy} cartas con Overkill/AoE en texto · ${cheapAttack} eventos Attack coste ≤1.`,
    metric: `AoE ${aoeProxy} · ATK≤1 ${cheapAttack}`,
  });

  items.push({
    id: "chump",
    section: "Control de mesa",
    question: "¿Chump blockers (aliados para absorber golpes)?",
    level: allyCount >= 6 ? "green" : allyCount >= 3 ? "amber" : "red",
    answer: `${allyCount} aliados en el mazo de robo.`,
    metric: `${allyCount} aliados`,
  });

  // —— 3. Consistencia / construcción ——
  const sizeLevel =
    drawSize === 40 ? "green" : drawSize >= 38 && drawSize <= 45 ? "amber" : drawSize === 0 ? "info" : "red";
  items.push({
    id: "deck-size",
    section: "Consistencia",
    question: "¿Tamaño del mazo de robo ~40?",
    level: sizeLevel,
    answer:
      drawSize === 40
        ? "Exactamente 40 cartas de robo."
        : `Mazo de robo: ${drawSize} cartas (estándar competitivo ≈ 40).`,
    metric: `${drawSize} cartas`,
  });

  let oneOfKey = 0;
  let twoOfKey = 0;
  for (const card of draw) {
    const cost = parseCostValue(card.cost);
    const impact =
      (cost != null && cost >= 3) ||
      parseStat(card.atk) + parseStat(card.thw) >= 3 ||
      card.type === "support";
    if (!impact) continue;
    const q = qty(card);
    if (q === 1) oneOfKey += 1;
    else if (q >= 2) twoOfKey += 1;
  }
  items.push({
    id: "one-ofs",
    section: "Consistencia",
    question: "¿Dependencia de one-ofs caros / de alto impacto?",
    level: oneOfKey >= 8 && twoOfKey < 3 ? "red" : oneOfKey >= 5 ? "amber" : "green",
    answer: `${oneOfKey} one-ofs clave vs ${twoOfKey} títulos a 2+ (coste≥3, ATK/THW altos o supports).`,
    metric: `${oneOfKey} one-ofs`,
  });

  const heroAtk = parseStat(identity?.atk);
  const heroThw = parseStat(identity?.thw);
  const heroDef = parseStat(identity?.def);
  const aspectFocus = (() => {
    const map = new Map<string, number>();
    for (const card of draw) {
      const a = (card.aspect || "").trim();
      if (!a || a === "Básico" || a === "Pool" || a === "Identidad") continue;
      map.set(a, (map.get(a) || 0) + qty(card));
    }
    let best = "";
    let bestN = 0;
    for (const [a, n] of map) {
      if (n > bestN) {
        best = a;
        bestN = n;
      }
    }
    return best;
  })();
  const weakness: string[] = [];
  if (identity) {
    if (heroThw <= 1) weakness.push("THW bajo");
    if (heroAtk <= 1) weakness.push("ATK bajo");
    if (heroDef <= 1) weakness.push("DEF bajo");
  }
  const aspectHelps =
    (weakness.includes("THW bajo") && /justicia/i.test(aspectFocus)) ||
    (weakness.includes("ATK bajo") && /agres/i.test(aspectFocus)) ||
    (weakness.includes("DEF bajo") && /protec/i.test(aspectFocus)) ||
    /liderazgo/i.test(aspectFocus);
  items.push({
    id: "aspect-cover",
    section: "Consistencia",
    question: "¿El aspecto tapa las peores stats del héroe?",
    level: !identity
      ? "info"
      : weakness.length === 0
        ? "green"
        : aspectHelps
          ? "green"
          : "amber",
    answer: !identity
      ? "Sin identidad importada."
      : `Kit héroe ATK ${heroAtk} / THW ${heroThw} / DEF ${heroDef}. Aspecto dominante: ${aspectFocus || "—"}${
          weakness.length ? ` · debilidades: ${weakness.join(", ")}` : " · sin stats débiles claras"
        }.`,
    metric: aspectFocus || "—",
  });

  const heroTraits = new Set([
    ...(identity ? traitsLower(identity) : []),
    ...(alterEgo ? traitsLower(alterEgo) : []),
  ]);
  let traitOverlap = 0;
  const overlapNames: string[] = [];
  if (heroTraits.size) {
    const deckTraitCount = new Map<string, number>();
    for (const card of draw) {
      for (const t of traitsLower(card)) {
        deckTraitCount.set(t, (deckTraitCount.get(t) || 0) + qty(card));
      }
    }
    for (const t of heroTraits) {
      const n = deckTraitCount.get(t) || 0;
      if (n > 0) {
        traitOverlap += n;
        overlapNames.push(`${t} (${n})`);
      }
    }
  }
  items.push({
    id: "trait-synergy",
    section: "Consistencia",
    question: "¿El mazo explota traits del héroe?",
    level: !heroTraits.size
      ? "info"
      : traitOverlap >= 8
        ? "green"
        : traitOverlap >= 3
          ? "amber"
          : "red",
    answer: !heroTraits.size
      ? "Sin traits en identidad/alter-ego."
      : traitOverlap === 0
        ? `Traits del héroe (${[...heroTraits].join(", ")}) no aparecen en el mazo de robo.`
        : `Solape: ${overlapNames.slice(0, 6).join(", ")}${overlapNames.length > 6 ? "…" : ""}.`,
    metric: `${traitOverlap} cartas`,
  });

  const deadHand =
    iconsPerCard < 0.9 && highCostShare >= 0.3
      ? "red"
      : iconsPerCard < 1.0 && highCostShare >= 0.25
        ? "amber"
        : "green";
  items.push({
    id: "dead-hand",
    section: "Consistencia",
    question: "¿Riesgo de mano muerta (poca economía + curva alta)?",
    level: deadHand,
    answer: `${iconsPerCard.toFixed(2)} iconos/carta y ${(highCostShare * 100).toFixed(0)}% cartas ≥3.`,
    metric: `ER ${iconsPerCard.toFixed(2)}`,
  });

  const attackEvents = draw.reduce((s, c) => {
    if (c.type !== "event") return s;
    if (
      hasAnyTrait(c, ["attack", "ataque"]) ||
      rulesMatch(c, /\b(attack|ataque|damage|daño)\b/i)
    ) {
      return s + qty(c);
    }
    return s;
  }, 0);
  const finishLevel =
    allyAtk + attackEvents * 2 >= 16 ? "green" : allyAtk + attackEvents * 2 >= 8 ? "amber" : "red";
  items.push({
    id: "finish-speed",
    section: "Consistencia",
    question: "¿Remate lento (poco daño de mesa / eventos Attack)?",
    level: finishLevel,
    answer: `ATK aliados ${allyAtk} · ${attackEvents} eventos Attack · ${eventCount} eventos totales.`,
    metric: `ATK ${allyAtk} · Ev.ATK ${attackEvents}`,
  });

  return items;
}

export function computeDeckStats(cards: StatsCard[]): DeckStats {
  const draw = cards.filter(isDrawDeck);
  const drawSize = draw.reduce((s, c) => s + qty(c), 0) || 0;

  const resBasic: Record<ResourceKind, number> = {
    physical: 0,
    mental: 0,
    energy: 0,
    wild: 0,
  };
  const resAspect: Record<ResourceKind, number> = {
    physical: 0,
    mental: 0,
    energy: 0,
    wild: 0,
  };

  let totalIcons = 0;
  let costSum = 0;
  let costWeight = 0;
  let lowCost = 0;
  let highCost = 0;
  let costXCount = 0;
  let allyCount = 0;
  let eventCount = 0;
  let permanentCount = 0;
  let resourceCardCount = 0;
  let allyAtk = 0;
  let allyThw = 0;
  const playableWith = [0, 0, 0, 0]; // cumulative counts playable with 0..3+ icons worth of "cheapness" proxy = cost brackets
  const traitMap = new Map<string, number>();

  for (const card of draw) {
    const q = qty(card);
    const isBasic = !card.aspect || card.aspect === "Básico" || card.aspect === "Pool";
    const bucket = isBasic ? resBasic : resAspect;
    for (const kind of parseResources(card.resources || "[]")) {
      if (kind === "physical" || kind === "mental" || kind === "energy" || kind === "wild") {
        bucket[kind] += q;
        totalIcons += q;
      }
    }

    const c = parseCostValue(card.cost);
    const rawCost = String(card.cost || "").trim();
    if (c == null) {
      if (rawCost && /^[xX★*]+$/.test(rawCost)) costXCount += q;
    } else {
      costSum += c * q;
      costWeight += q;
      if (c <= 1) lowCost += q;
      if (c >= 3) highCost += q;
      // playability proxy: cards with cost <= n
      for (let n = 0; n <= 3; n++) {
        if (c <= n) playableWith[n] += q;
      }
    }

    if (card.type === "ally") {
      allyCount += q;
      allyAtk += parseStat(card.atk) * q;
      allyThw += parseStat(card.thw) * q;
    }
    if (card.type === "event") eventCount += q;
    if (card.type === "upgrade" || card.type === "support") permanentCount += q;
    if (card.type === "resource") resourceCardCount += q;

    for (const trait of parseTraits(card.traits)) {
      traitMap.set(trait, (traitMap.get(trait) || 0) + q);
    }
  }

  const resources = RESOURCE_ORDER.map((kind) => ({
    kind,
    basic: resBasic[kind],
    aspect: resAspect[kind],
    total: resBasic[kind] + resAspect[kind],
  }));

  const costMap = new Map<number, number>();
  for (const card of draw) {
    const c = parseCostValue(card.cost);
    if (c == null) continue;
    costMap.set(c, (costMap.get(c) || 0) + qty(card));
  }
  const costKeys = [...costMap.keys()].sort((a, b) => a - b);
  const costs =
    costKeys.length > 0
      ? Array.from({ length: Math.max(...costKeys) + 1 }, (_, cost) => ({
          cost,
          count: costMap.get(cost) || 0,
        }))
      : [];

  const factionMap = new Map<string, number>();
  for (const card of draw) {
    const aspect = card.aspect?.trim() || "Sin aspecto";
    factionMap.set(aspect, (factionMap.get(aspect) || 0) + qty(card));
  }
  const factions = [...factionMap.entries()]
    .map(([aspect, count]) => ({
      aspect,
      count,
      color: ASPECT_COLORS[aspect] || "#a8a29a",
    }))
    .sort((a, b) => b.count - a.count);

  const typeMap = new Map<string, number>();
  for (const card of draw) {
    typeMap.set(card.type, (typeMap.get(card.type) || 0) + qty(card));
  }
  const types = [...typeMap.entries()]
    .map(([type, count]) => ({
      type,
      label: TYPE_LABELS[type] || type,
      count,
      color: TYPE_CHART_COLORS[type] || "#87868f",
    }))
    .sort((a, b) => b.count - a.count);

  const avgCost = costWeight > 0 ? costSum / costWeight : null;
  const lowCostShare = drawSize > 0 ? lowCost / drawSize : 0;
  const highCostShare = drawSize > 0 ? highCost / drawSize : 0;
  const iconsPerCard = drawSize > 0 ? totalIcons / drawSize : 0;

  let maxResourceShare = 0;
  let maxResourceKind: ResourceKind | null = null;
  for (const r of resources) {
    const share = totalIcons > 0 ? r.total / totalIcons : 0;
    if (share > maxResourceShare) {
      maxResourceShare = share;
      maxResourceKind = r.kind;
    }
  }

  const eventShare = drawSize > 0 ? eventCount / drawSize : 0;
  const permanentShare = drawSize > 0 ? permanentCount / drawSize : 0;
  const resourceCardShare = drawSize > 0 ? resourceCardCount / drawSize : 0;

  const composition = [
    { key: "ally", label: "Aliados", count: allyCount, color: "#3b82c4" },
    { key: "event", label: "Eventos", count: eventCount, color: "#c41218" },
    { key: "permanent", label: "Permanentes", count: permanentCount, color: "#3f7a3a" },
    { key: "resource", label: "Recursos", count: resourceCardCount, color: "#8b6914" },
  ];

  const playability = [0, 1, 2, 3].map((resourcesNeeded) => {
    const count = playableWith[resourcesNeeded];
    return {
      resources: resourcesNeeded,
      count,
      share: costWeight > 0 ? count / costWeight : 0,
    };
  });

  const topTraits = [...traitMap.entries()]
    .map(([trait, count]) => ({ trait, count }))
    .sort((a, b) => b.count - a.count || a.trait.localeCompare(b.trait))
    .slice(0, 12);

  const hasThwartPillar = allyThw >= 4 || allyCount >= 3;
  const hasAttackPillar = allyAtk >= 4 || allyCount >= 3;

  const flags: DeckFlag[] = [];

  if (avgCost != null && lowCostShare >= 0.35 && avgCost <= 1.8) {
    flags.push({
      id: "curve-good",
      level: "green",
      title: "Curva sana",
      detail: `Coste medio ${avgCost.toFixed(2)} y ${(lowCostShare * 100).toFixed(0)}% a coste ≤1.`,
    });
  }
  if (avgCost != null && (avgCost > 2.2 || highCostShare >= 0.4)) {
    flags.push({
      id: "curve-heavy",
      level: "red",
      title: "Mazo top-heavy",
      detail: `Coste medio ${avgCost.toFixed(2)}; ${(highCostShare * 100).toFixed(0)}% a coste ≥3.`,
    });
  } else if (avgCost != null && avgCost > 1.9) {
    flags.push({
      id: "curve-amber",
      level: "amber",
      title: "Curva exigente",
      detail: `Coste medio ${avgCost.toFixed(2)}. Vigila la economía temprana.`,
    });
  }

  if (iconsPerCard >= 1.1) {
    flags.push({
      id: "economy-good",
      level: "green",
      title: "Buena economía",
      detail: `${iconsPerCard.toFixed(2)} iconos de recurso por carta.`,
    });
  } else if (iconsPerCard < 0.85 && drawSize > 0) {
    flags.push({
      id: "economy-poor",
      level: "red",
      title: "Poca economía",
      detail: `Solo ${iconsPerCard.toFixed(2)} iconos/carta — riesgo de manos sin pago.`,
    });
  }

  if (maxResourceShare < 0.5 && totalIcons > 0) {
    flags.push({
      id: "resource-mix",
      level: "green",
      title: "Recursos equilibrados",
      detail: `Ningún icono supera el 50% (máx. ${maxResourceKind}: ${(maxResourceShare * 100).toFixed(0)}%).`,
    });
  } else if (maxResourceShare >= 0.55 && maxResourceKind) {
    flags.push({
      id: "resource-mono",
      level: "red",
      title: "Mono-recurso",
      detail: `${RESOURCE_META[maxResourceKind].label} es el ${(maxResourceShare * 100).toFixed(0)}% de los iconos.`,
    });
  }

  if (allyCount >= 4 && allyCount <= 10) {
    flags.push({
      id: "allies-good",
      level: "green",
      title: "Bloque de aliados sólido",
      detail: `${allyCount} aliados (ATK ${allyAtk} / THW ${allyThw}).`,
    });
  } else if (allyCount >= 14) {
    flags.push({
      id: "allies-bloat",
      level: "red",
      title: "Demasiados aliados",
      detail: `${allyCount} aliados — cuellos de botella de espacio y pago.`,
    });
  } else if (allyCount > 0 && allyCount < 3) {
    flags.push({
      id: "allies-low",
      level: "amber",
      title: "Pocos aliados",
      detail: `Solo ${allyCount}. Dependes más de eventos.`,
    });
  }

  if (eventShare >= 0.25 && eventShare <= 0.45) {
    flags.push({
      id: "events-good",
      level: "green",
      title: "Mix de eventos equilibrado",
      detail: `${(eventShare * 100).toFixed(0)}% eventos.`,
    });
  } else if (eventShare >= 0.55) {
    flags.push({
      id: "events-flood",
      level: "red",
      title: "Demasiados eventos",
      detail: `${(eventShare * 100).toFixed(0)}% eventos — poca permanencia en mesa.`,
    });
  }

  if (!hasThwartPillar && drawSize > 0) {
    flags.push({
      id: "no-thwart",
      level: "red",
      title: "Pilar THW débil",
      detail: `THW de aliados: ${allyThw}. Riesgo en la carrera de amenaza.`,
    });
  } else if (allyThw >= 6) {
    flags.push({
      id: "thwart-good",
      level: "green",
      title: "Buen thwart en mesa",
      detail: `${allyThw} THW total en aliados.`,
    });
  }

  if (!hasAttackPillar && drawSize > 0) {
    flags.push({
      id: "no-attack",
      level: "red",
      title: "Pilar ATK débil",
      detail: `ATK de aliados: ${allyAtk}. Puede costar rematar.`,
    });
  } else if (allyAtk >= 6) {
    flags.push({
      id: "attack-good",
      level: "green",
      title: "Buen ataque en mesa",
      detail: `${allyAtk} ATK total en aliados.`,
    });
  }

  if (costXCount >= 4) {
    flags.push({
      id: "cost-x",
      level: "amber",
      title: "Muchas cartas a coste X",
      detail: `${costXCount} cartas dependen de estado/setup.`,
    });
  }

  if (permanentShare >= 0.2 && permanentShare <= 0.4) {
    flags.push({
      id: "permanents-good",
      level: "green",
      title: "Buenos permanentes",
      detail: `${(permanentShare * 100).toFixed(0)}% upgrades/supports.`,
    });
  }

  let score = 50;
  if (avgCost != null) score += clamp((1.8 - avgCost) * 15, -20, 20);
  score += clamp((iconsPerCard - 1.0) * 25, -20, 20);
  score += hasThwartPillar ? 8 : -12;
  score += hasAttackPillar ? 8 : -12;
  score += allyCount >= 4 && allyCount <= 10 ? 6 : allyCount >= 14 ? -8 : -4;
  score += maxResourceShare < 0.5 ? 6 : maxResourceShare >= 0.55 ? -10 : 0;
  score += eventShare >= 0.55 ? -8 : eventShare >= 0.25 && eventShare <= 0.45 ? 4 : 0;
  score = Math.round(clamp(score, 0, 100));

  const checklist = buildViabilityChecklist({
    cards,
    draw,
    drawSize,
    avgCost,
    iconsPerCard,
    highCostShare,
    lowCostShare,
    totalIcons,
    allyCount,
    allyAtk,
    allyThw,
    permanentCount,
    eventCount,
  });

  return {
    resources,
    costs,
    factions,
    types,
    drawSize,
    avgCost,
    lowCostShare,
    highCostShare,
    costXCount,
    iconsPerCard,
    maxResourceShare,
    maxResourceKind,
    allyCount,
    eventShare,
    permanentShare,
    resourceCardShare,
    allyAtk,
    allyThw,
    composition,
    playability,
    topTraits,
    flags: flags.sort((a, b) => {
      const order = { red: 0, amber: 1, green: 2 };
      return order[a.level] - order[b.level];
    }),
    checklist,
    score,
  };
}
