import type { CardData } from "@/lib/card-defaults";

export const TYPES: Record<string, { label: string; family: string; typeText: string; landscape?: boolean }> = {
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
  "main-scheme": { label: "Plan principal", family: "villain", typeText: "Plan principal", landscape: true },
};

export const ASPECTS: Record<string, [string, string]> = {
  Identidad: ["#c41218", "#1a4f9c"],
  Agresión: ["#b12020", "#e14b4b"],
  Justicia: ["#c9b42e", "#f3e58a"],
  Liderazgo: ["#2ea7b8", "#7fd4df"],
  Protección: ["#46991b", "#86c85a"],
  Básico: ["#87868f", "#c8c7cc"],
  Pool: ["#d074ac", "#f0b4d6"],
};

export const SPLIT_TYPES = new Set(["alter-ego"]);
export const COST_TYPES = new Set(["ally", "event", "upgrade", "support", "resource", "player-scheme"]);
export const RESOURCE_TYPES = new Set(["ally", "event", "upgrade", "support", "resource", "player-scheme"]);
export const BOOST_TYPES = new Set(["minion", "attachment", "treachery", "environment", "side-scheme"]);

export function familyOf(card: Pick<CardData, "type">) {
  return TYPES[card.type]?.family || "hero";
}

export function applyAspectColors(card: CardData, name: string): CardData {
  const colors = ASPECTS[name];
  if (!colors) return card;
  if (name === "Identidad") {
    return {
      ...card,
      aspect: name,
      left: colors[0],
      leftAccent: colors[0],
      right: colors[1],
      rightAccent: colors[1],
    };
  }
  return {
    ...card,
    aspect: name,
    left: colors[0],
    right: colors[0],
    leftAccent: colors[1],
    rightAccent: colors[1],
  };
}

export function formatRules(raw: string) {
  const escaped = String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}

export function statText(value: string, star: boolean) {
  if (!value && !star) return "";
  return `${value || ""}${star ? "★" : ""}`;
}
