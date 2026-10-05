import https from "https";

const BASE = "https://marvelcdb.com/api/public";

export type MarvelDecklist = {
  id: number;
  name: string;
  hero_name?: string;
  hero_code?: string;
  slots?: Record<string, number>;
  meta?: string;
};

export type MarvelCard = {
  code: string;
  name: string;
  real_name?: string;
  subname?: string;
  type_code?: string;
  type_name?: string;
  faction_code?: string;
  faction_name?: string;
  cost?: number | null;
  text?: string;
  flavor?: string;
  traits?: string;
  attack?: number | null;
  thwart?: number | null;
  defense?: number | null;
  recover?: number | null;
  health?: number | null;
  hand_size?: number | null;
  resource_energy?: number | null;
  resource_physical?: number | null;
  resource_mental?: number | null;
  resource_wild?: number | null;
  imagesrc?: string;
  pack_name?: string;
  is_unique?: boolean;
  linked_to_code?: string;
  linked_card?: MarvelCard | null;
};

const TYPE_MAP: Record<string, string> = {
  hero: "identity",
  alter_ego: "alter-ego",
  ally: "ally",
  event: "event",
  upgrade: "upgrade",
  support: "support",
  resource: "resource",
  obligation: "obligation",
  player_side_scheme: "player-scheme",
  villain: "villain",
  minion: "minion",
  attachment: "attachment",
  treachery: "treachery",
  environment: "environment",
  side_scheme: "side-scheme",
  main_scheme: "main-scheme",
};

const ASPECT_MAP: Record<string, string> = {
  aggression: "Agresión",
  justice: "Justicia",
  leadership: "Liderazgo",
  protection: "Protección",
  basic: "Básico",
  hero: "Identidad",
  pool: "Pool",
};

function getJson<T>(url: string, retries = 3): Promise<T> {
  const attempt = (left: number): Promise<T> =>
    new Promise((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "MChampionsManager/1.0",
          },
          timeout: 15000,
        },
        (res) => {
          if ((res.statusCode || 500) >= 400) {
            const err = new Error(`HTTP ${res.statusCode} en ${url}`);
            res.resume();
            if (left > 0) {
              setTimeout(() => attempt(left - 1).then(resolve, reject), 500);
            } else {
              reject(err);
            }
            return;
          }
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) as T);
            } catch (error) {
              if (left > 0) {
                setTimeout(() => attempt(left - 1).then(resolve, reject), 500);
              } else {
                reject(error);
              }
            }
          });
        },
      );
      req.on("timeout", () => {
        req.destroy();
        if (left > 0) {
          setTimeout(() => attempt(left - 1).then(resolve, reject), 500);
        } else {
          reject(new Error(`Timeout en ${url}`));
        }
      });
      req.on("error", (error) => {
        if (left > 0) {
          setTimeout(() => attempt(left - 1).then(resolve, reject), 500);
        } else {
          reject(error);
        }
      });
    });
  return attempt(retries);
}

export async function fetchDecklist(id: number): Promise<MarvelDecklist> {
  try {
    return await getJson<MarvelDecklist>(`${BASE}/decklist/${id}`);
  } catch (error) {
    throw new Error(
      `No se pudo cargar el mazo ${id} desde MarvelCDB: ${error instanceof Error ? error.message : error}`,
    );
  }
}

export async function fetchMarvelCard(code: string): Promise<MarvelCard> {
  try {
    return await getJson<MarvelCard>(`${BASE}/card/${code}`);
  } catch (error) {
    throw new Error(
      `No se pudo cargar la carta ${code}: ${error instanceof Error ? error.message : error}`,
    );
  }
}

/** One card with fallbacks for double-sided / missing codes. */
export async function fetchMarvelCardSafe(code: string): Promise<MarvelCard> {
  try {
    return await fetchMarvelCard(code);
  } catch {
    try {
      return await fetchMarvelCard(`${code}a`);
    } catch {
      return {
        code,
        name: `Carta ${code}`,
        type_code: "event",
        type_name: "Event",
        text: "No se pudo cargar desde MarvelCDB. Edita manualmente.",
      };
    }
  }
}

export async function fetchMarvelCards(codes: string[]): Promise<MarvelCard[]> {
  const results: MarvelCard[] = [];
  for (const code of codes) {
    results.push(await fetchMarvelCardSafe(code));
    await new Promise((r) => setTimeout(r, 80));
  }
  return results;
}

/** Identity/Alter-ego live outside decklist.slots — only in hero_code. */
export async function fetchHeroIdentityCards(heroCode?: string): Promise<MarvelCard[]> {
  if (!heroCode) return [];
  const primary = await fetchMarvelCard(heroCode);
  const linkedCode =
    primary.linked_to_code ||
    (primary.linked_card && typeof primary.linked_card === "object"
      ? primary.linked_card.code
      : undefined);
  const linked =
    primary.linked_card && primary.linked_card.code
      ? primary.linked_card
      : linkedCode
        ? await fetchMarvelCard(linkedCode)
        : null;

  const sides = [primary, linked].filter(Boolean) as MarvelCard[];
  const alterEgo = sides.find((c) => c.type_code === "alter_ego");
  const identity = sides.find((c) => c.type_code === "hero" || c.type_code === "identity");
  const ordered: MarvelCard[] = [];
  if (alterEgo) ordered.push(alterEgo);
  if (identity) ordered.push(identity);
  for (const side of sides) {
    if (!ordered.includes(side)) ordered.push(side);
  }
  return ordered;
}

function resourcesFromCard(card: MarvelCard): string[] {
  const out: string[] = [];
  const push = (kind: string, n?: number | null) => {
    for (let i = 0; i < (n || 0); i++) out.push(kind);
  };
  push("energy", card.resource_energy);
  push("physical", card.resource_physical);
  push("mental", card.resource_mental);
  push("wild", card.resource_wild);
  while (out.length < 3) out.push("none");
  return out.slice(0, 3);
}

export function mapMarvelCardToFields(card: MarvelCard) {
  const type = TYPE_MAP[card.type_code || ""] || "event";
  const aspect = ASPECT_MAP[card.faction_code || ""] || "";
  return {
    type,
    title: card.name || card.real_name || "",
    subtitle: card.subname || "",
    typeLabel: card.type_name || "",
    traits: (card.traits || "").replace(/\.+$/, "."),
    rules: (card.text || "").replace(/<\/?[^>]+>/g, ""),
    quote: (card.flavor || "").replace(/<\/?[^>]+>/g, ""),
    setLine: card.pack_name || "",
    cost: card.cost != null ? String(card.cost) : "",
    thw: card.thwart != null ? String(card.thwart) : "",
    atk: card.attack != null ? String(card.attack) : "",
    def: card.defense != null ? String(card.defense) : "",
    rec: card.recover != null ? String(card.recover) : "",
    hp: card.health != null ? String(card.health) : "",
    handSize: card.hand_size != null ? String(card.hand_size) : "",
    identityHp:
      card.health != null && (type === "identity" || type === "alter-ego")
        ? String(card.health)
        : "",
    aspect: type === "identity" ? "Identidad" : aspect,
    resources: resourcesFromCard(card),
    photo: card.imagesrc ? `https://marvelcdb.com${card.imagesrc}` : "",
    marvelcdbCode: card.code,
  };
}

export function parseDeckAspect(meta?: string) {
  try {
    const parsed = meta ? JSON.parse(meta) : {};
    const keys = [parsed.aspect, parsed.aspect2].filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0,
    );
    const labels = keys.map((a) => ASPECT_MAP[a] || a);
    return [...new Set(labels)].join(" / ");
  } catch {
    return "";
  }
}
