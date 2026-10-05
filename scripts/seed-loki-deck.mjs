import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ASPECTS = {
  Identidad: ["#c41218", "#1a4f9c"],
  Básico: ["#87868f", "#c8c7cc"],
};

const TYPES = {
  "alter-ego": { typeText: "Alter-Ego" },
  identity: { typeText: "Hero" },
  ally: { typeText: "Aliado" },
  event: { typeText: "Evento" },
  upgrade: { typeText: "Mejora" },
  support: { typeText: "Apoyo" },
  "player-scheme": { typeText: "Plan" },
};

function traitsFrom(keywords = []) {
  if (!keywords.length) return "";
  return `${keywords.join(". ")}.`;
}

function colorsFor(aspect) {
  const c = ASPECTS[aspect] || ASPECTS.Básico;
  if (aspect === "Identidad") {
    return {
      aspect,
      left: c[0],
      leftAccent: c[0],
      right: c[1],
      rightAccent: c[1],
    };
  }
  return {
    aspect,
    left: c[0],
    right: c[0],
    leftAccent: c[1],
    rightAccent: c[1],
  };
}

function cardRow(partial) {
  const type = partial.type || "event";
  const aspect = partial.aspect ?? (type === "identity" || type === "alter-ego" ? "Identidad" : "Identidad");
  const colors = colorsFor(type === "alter-ego" ? "" : aspect);
  if (type === "alter-ego") {
    colors.aspect = "";
    colors.left = "#c41218";
    colors.leftAccent = "#c41218";
    colors.right = "#1a4f9c";
    colors.rightAccent = "#1a4f9c";
  }
  return {
    ownerId: partial.ownerId,
    slotIndex: partial.slotIndex,
    quantity: partial.quantity ?? 1,
    marvelcdbCode: partial.marvelcdbCode || "",
    type,
    title: partial.title || "",
    subtitle: partial.subtitle || "",
    typeLabel: partial.typeLabel || TYPES[type]?.typeText || "",
    traits: partial.traits || "",
    rules: partial.rules || "",
    quote: "",
    copyright: "",
    setLine: partial.setLine || "Loki · Homebrew",
    cost: partial.cost != null ? String(partial.cost) : "",
    costStar: false,
    thw: partial.thw != null ? String(partial.thw) : "",
    thwStar: false,
    atk: partial.atk != null ? String(partial.atk) : "",
    atkStar: false,
    def: partial.def != null ? String(partial.def) : "",
    defStar: false,
    rec: partial.rec != null ? String(partial.rec) : "",
    recStar: false,
    hp: partial.hp != null ? String(partial.hp) : "",
    handSize: partial.handSize != null ? String(partial.handSize) : "",
    identityHp: partial.identityHp != null ? String(partial.identityHp) : "",
    stage: "",
    threat: partial.threat != null ? String(partial.threat) : "",
    schemeNo: "",
    boosts: 0,
    boostStar: false,
    attAtk: "",
    attSch: "",
    resources: '["none","none","none"]',
    cracks: true,
    showSplash: true,
    starSplash: false,
    darkText: false,
    ...colors,
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
    headY: 0,
    appPreview: "",
    fullCardPhoto: false,
  };
}

const DECK_JSON = {
  heroe: "Loki",
  alter_ego: {
    nombre: "Loki",
    recuperacion: 4,
    tamano_mano_alter_ego: 6,
    limite_vida: 10,
    habilidad_alter_ego:
      "Acción de Alter Ego: Busca en tu mazo o pila de descartes una carta de Plan, añádela a tu mano y baraja tu mazo. (Límite de una vez por ronda).",
  },
  forma_heroe: {
    atq: 1,
    def: 1,
    int: 3,
    tamano_mano_heroe: 5,
    limite_vida: 10,
    habilidad_heroe:
      "Las cartas de ilusión cuentan como 2 recursos de su color. Acción de héroe: Agota a Loki, una carta de ilusión vuelve a tu mano.",
  },
  mazo_heroe_15_cartas: [
    {
      cantidad: 1,
      nombre: "Cetro Chitauri",
      tipo: "Apoyo",
      keyword: [],
      coste: 2,
      efecto:
        "Cuando bajes esta carta, cambia automáticamente a tu forma de Héroe. +1 ATQ. Acción de Héroe: Agota el cetro para hacer 1 de daño a cualquier objetivo. +2 si está confuso.",
    },
    {
      cantidad: 1,
      nombre: "Mobius, M.Mobius",
      tipo: "Apoyo (Alter Ego)",
      keyword: [],
      coste: 2,
      efecto:
        "Solo se puede jugar en tu forma de Alter Ego. Agota este apoyo para elegir: 1) Otorgas el estado Duro a un héroe (Ese héroe solo puede beneficiarse de esto una vez por partida) 2) Retiras 1 de amenaza del plan principal y 1 de amenaza de un plan secundario (si es que lo hay).",
    },
    {
      cantidad: 1,
      nombre: "Animadversión a Padre",
      tipo: "Apoyo",
      keyword: [],
      coste: 1,
      efecto:
        "Si hay un aliado Asgardiano en juego, agota este apoyo, Loki sufre 1 de daño y retira 2 de amenaza de un plan.",
    },
    {
      cantidad: 1,
      nombre: "Loki (Sylvie)",
      tipo: "Aliado",
      keyword: ["Asgardiano", "Variante"],
      coste: 3,
      ATQ: 2,
      INT: 2,
      vida: 3,
      efecto:
        "Cuando Sylvie entre en juego, busca en tu mazo o pila de descartes una mejora de Ilusión y ponla en tu mano. Baraja el mazo.",
      subtitle: "Sylvie",
    },
    {
      cantidad: 1,
      nombre: "Engaño del Doble",
      tipo: "Apoyo",
      keyword: ["Ilusión"],
      coste: 1,
      efecto:
        "Respuesta de Héroe: Después de que cambies de forma, endereza este apoyo. Acción de Héroe: Agota este apoyo para descartar una carta de Ilusión que controles y, en su lugar, busca en tu mazo o pila de descartes otra carta de Ilusión y ponla en tu mano.",
    },
    {
      cantidad: 2,
      nombre: "Espejismo",
      tipo: "Mejora",
      keyword: ["Ilusión"],
      coste: 3,
      efecto:
        "Entra en juego en tu área de jugador con 2 contadores de Ilusión. Rasgo: Ilusión (cuenta como 3 recursos de su color). Respuesta: Cuando el villano vaya a iniciarte un ataque, puedes retirar 1 contador de Ilusión para evitar todo el daño.",
    },
    {
      cantidad: 1,
      nombre: "Necio, ese no soy yo",
      tipo: "Mejora",
      keyword: ["Ilusión"],
      coste: 3,
      efecto:
        "Anula el daño del próximo ataque del villano contra ti. Haz la cantidad de daño que fuera a hacer a otro personaje.",
    },
    {
      cantidad: 2,
      nombre: "Apuñalamiento por la Espalda",
      tipo: "Evento (Ataque)",
      keyword: [],
      coste: 3,
      efecto:
        "Infliges 4 de daño a un enemigo. Intervención: Esta carta puede ser jugada justo después de haber evitado daño con una ilusión en esta misma ronda, si es así duplica su daño (inflige 8 de daño) y este ataque gana Penetración (ignora Dureza).",
    },
    {
      cantidad: 1,
      nombre: "Señor de la mentira",
      tipo: "Evento (Defensa)",
      keyword: [],
      coste: 3,
      efecto:
        "Evitas 3 de daño de un ataque. Si tienes una carta de Ilusión en juego, roba 1 carta.",
    },
    {
      cantidad: 1,
      nombre: "Gloria al Rey de Asgard",
      tipo: "Evento",
      keyword: [],
      coste: 4,
      efecto:
        "Retira 3 de amenaza de un plan. Confunde al villano si hay un aliado Asgardiano/Variante en juego; se pone duro. Cuesta 1 menos por cada mejora 'Ilusión' equipada.",
    },
    {
      cantidad: 1,
      nombre: "¡Arrodillaos!",
      tipo: "Evento (Ataque)",
      keyword: [],
      coste: 3,
      efecto:
        "Inflige 5 de daño a un enemigo. Si el enemigo está confuso, aturde a ese enemigo.",
    },
    {
      cantidad: 1,
      nombre: "Conexión del Vacío",
      tipo: "Evento",
      keyword: [],
      coste: 1,
      efecto:
        "Acción de Héroe: Si hay un aliado con el rasgo Variante en juego, elige a ese aliado, cúrale todo su daño y roba tantas cartas como puntos de vida le hayas curado de esta manera.",
    },
    {
      cantidad: 1,
      nombre: "El Árbol del Tiempo (Yggdrasil)",
      tipo: "Plan Secundario",
      keyword: [],
      coste: 4,
      efecto:
        "Entra en juego con 3 de amenaza por jugador. Al entrar en juego entrega una carta de encuentro a cada jugador. Al resolverse: Retira 5 de amenaza del plan principal. Durante el resto de la ronda, el plan principal no puede recibir contadores de amenaza por ningún efecto del villano o de las cartas de encuentro. Confunde al villano.",
      threat: 3,
    },
    {
      cantidad: 1,
      nombre: "Juego de Hermanos (¿Recuerdas cuando me convertí en serpiente?)",
      tipo: "Plan Secundario",
      keyword: [],
      coste: 1,
      efecto:
        "Entra en juego con 3 de amenaza por jugador. Cuando este plan secundario sea derrotado, inflige 4 de daño al villano y confúndelo. Todos los héroes en juego se ponen duros.",
      threat: 3,
    },
  ],
};

function mapTipo(tipo) {
  if (tipo.startsWith("Apoyo")) return { type: "support", typeLabel: tipo === "Apoyo (Alter Ego)" ? "Apoyo · Alter Ego" : "Apoyo" };
  if (tipo === "Aliado") return { type: "ally", typeLabel: "Aliado" };
  if (tipo === "Mejora") return { type: "upgrade", typeLabel: "Mejora" };
  if (tipo.startsWith("Evento")) {
    if (tipo.includes("Ataque")) return { type: "event", typeLabel: "Evento · Ataque" };
    if (tipo.includes("Defensa")) return { type: "event", typeLabel: "Evento · Defensa" };
    return { type: "event", typeLabel: "Evento" };
  }
  if (tipo === "Plan Secundario") return { type: "player-scheme", typeLabel: "Plan" };
  return { type: "event", typeLabel: tipo };
}

async function main() {
  const owner = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!owner) throw new Error("No hay usuario admin");

  const marvelcdbId = 900001;
  const existing = await prisma.importedDeck.findUnique({
    where: { ownerId_marvelcdbId: { ownerId: owner.id, marvelcdbId } },
  });
  if (existing) {
    await prisma.importedDeck.delete({ where: { id: existing.id } });
    console.log("Mazo Loki previo eliminado:", existing.id);
  }

  const alter = DECK_JSON.alter_ego;
  const hero = DECK_JSON.forma_heroe;
  let slot = 1;
  const cards = [
    cardRow({
      ownerId: owner.id,
      slotIndex: slot++,
      title: alter.nombre,
      type: "alter-ego",
      typeLabel: "Alter-Ego",
      traits: "Asgardiano. Dios.",
      rules: alter.habilidad_alter_ego,
      rec: alter.recuperacion,
      handSize: alter.tamano_mano_alter_ego,
      identityHp: alter.limite_vida,
      hp: alter.limite_vida,
      marvelcdbCode: "loki-ae",
    }),
    cardRow({
      ownerId: owner.id,
      slotIndex: slot++,
      title: DECK_JSON.heroe,
      type: "identity",
      typeLabel: "Hero",
      traits: "Asgardiano. Dios.",
      rules: hero.habilidad_heroe,
      atk: hero.atq,
      def: hero.def,
      thw: hero.int,
      handSize: hero.tamano_mano_heroe,
      identityHp: hero.limite_vida,
      hp: hero.limite_vida,
      aspect: "Identidad",
      marvelcdbCode: "loki-hero",
    }),
  ];

  for (const c of DECK_JSON.mazo_heroe_15_cartas) {
    const mapped = mapTipo(c.tipo);
    const title =
      c.nombre === "Loki (Sylvie)"
        ? "Loki"
        : c.nombre.replace(/\s*\(Yggdrasil\)\s*$/, "").replace(/\s*\(¿Recuerdas cuando me convertí en serpiente\?\)\s*$/, "");
    const subtitle =
      c.nombre === "Loki (Sylvie)"
        ? "Sylvie"
        : c.nombre.includes("Yggdrasil")
          ? "Yggdrasil"
          : c.nombre.includes("serpiente")
            ? "¿Recuerdas cuando me convertí en serpiente?"
            : "";

    cards.push(
      cardRow({
        ownerId: owner.id,
        slotIndex: slot++,
        quantity: c.cantidad,
        title,
        subtitle,
        type: mapped.type,
        typeLabel: mapped.typeLabel,
        traits: traitsFrom(c.keyword),
        rules: c.efecto,
        cost: c.coste,
        atk: c.ATQ,
        thw: c.INT,
        hp: c.vida,
        threat: c.threat,
        aspect: "Identidad",
        marvelcdbCode: `loki-${slot - 1}`,
      }),
    );
  }

  const created = await prisma.importedDeck.create({
    data: {
      marvelcdbId,
      name: "Loki — Ilusiones",
      heroName: "Loki",
      aspect: "Identidad",
      rawJson: JSON.stringify(DECK_JSON, null, 2),
      ownerId: owner.id,
      cards: { create: cards },
    },
    include: { cards: true, _count: { select: { cards: true } } },
  });

  const totalQty = created.cards.reduce((s, c) => s + c.quantity, 0);
  console.log(
    JSON.stringify(
      {
        id: created.id,
        name: created.name,
        slots: created._count.cards,
        totalCopies: totalQty,
        owner: owner.email,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
