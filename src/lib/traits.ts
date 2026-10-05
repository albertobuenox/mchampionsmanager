const KEYWORDS = [
  "Hero Response",
  "Hero Action",
  "Hero Interrupt",
  "Alter-Ego Action",
  "Alter-Ego Response",
  "Alter-Ego Interrupt",
  "Forced Response",
  "Forced Interrupt",
  "Battle Mage",
  "Avatar of Life",
  "Interrupt",
  "Response",
  "Action",
  "Forced",
  "Toughness",
  "Retaliate",
  "Victory",
  "Setup",
  "Acción",
  "Respuesta",
  "Interrupción",
];

const ASPECT_WORDS = [
  "Aggression",
  "Justice",
  "Leadership",
  "Protection",
  "Basic",
  "Agresión",
  "Justicia",
  "Liderazgo",
  "Protección",
  "Básico",
  "Pool",
];

export function parseTraits(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[.,;·|/]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.replace(/^[\[\(]+|[\]\).]+$/g, "").trim())
    .filter(Boolean);
}

export function cardHasAnyTrait(traitsRaw: string | undefined, selected: string[]): boolean {
  if (!selected.length) return true;
  const traits = parseTraits(traitsRaw).map((t) => t.toLowerCase());
  return selected.some((s) => traits.includes(s.toLowerCase()));
}

export function countDeckTraits(
  cards: Array<{ traits?: string; quantity?: number; type?: string }>,
): Array<{ trait: string; count: number }> {
  const map = new Map<string, number>();
  for (const card of cards) {
    const qty = card.quantity || 1;
    for (const trait of parseTraits(card.traits)) {
      const key = trait;
      map.set(key, (map.get(key) || 0) + qty);
    }
  }
  return [...map.entries()]
    .map(([trait, count]) => ({ trait, count }))
    .sort((a, b) => b.count - a.count || a.trait.localeCompare(b.trait));
}

export type AbilityPart =
  | { kind: "text"; value: string }
  | { kind: "chip"; value: string; tone: "keyword" | "trait" | "aspect" };

export function tokenizeAbility(rules: string, traits: string[] = []): AbilityPart[] {
  const clean = String(rules || "")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return [];

  const chipTerms = [
    ...KEYWORDS,
    ...ASPECT_WORDS,
    ...traits,
  ].sort((a, b) => b.length - a.length);

  const escaped = chipTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return [{ kind: "text", value: clean }];

  const re = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts: AbilityPart[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(clean))) {
    if (match.index > last) {
      parts.push({ kind: "text", value: clean.slice(last, match.index) });
    }
    const value = match[1];
    const lower = value.toLowerCase();
    let tone: "keyword" | "trait" | "aspect" = "keyword";
    if (ASPECT_WORDS.some((a) => a.toLowerCase() === lower)) tone = "aspect";
    else if (traits.some((t) => t.toLowerCase() === lower)) tone = "trait";
    parts.push({ kind: "chip", value, tone });
    last = match.index + value.length;
  }
  if (last < clean.length) parts.push({ kind: "text", value: clean.slice(last) });
  return parts;
}
