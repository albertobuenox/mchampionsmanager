export type CardData = {
  type: string;
  title: string;
  subtitle: string;
  typeLabel: string;
  traits: string;
  rules: string;
  quote: string;
  copyright: string;
  setLine: string;
  cost: string;
  costStar: boolean;
  thw: string;
  thwStar: boolean;
  atk: string;
  atkStar: boolean;
  def: string;
  defStar: boolean;
  rec: string;
  recStar: boolean;
  hp: string;
  handSize: string;
  identityHp: string;
  stage: string;
  threat: string;
  schemeNo: string;
  boosts: number;
  boostStar: boolean;
  attAtk: string;
  attSch: string;
  resources: string[];
  cracks: boolean;
  showSplash: boolean;
  starSplash: boolean;
  darkText: boolean;
  aspect: string;
  left: string;
  leftAccent: string;
  right: string;
  rightAccent: string;
  divider: string;
  outer: string;
  outerAccent: string;
  gradTop: string;
  gradBottom: string;
  photo: string;
  photoZoom: number;
  photoX: number;
  photoY: number;
  headshot: string;
  headZoom: number;
  headX: number;
  headY: number;
  fullCardPhoto: boolean;
};

export function blankCardData(type = "event", headshot = ""): CardData {
  return {
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
    aspect: type === "identity" ? "Identidad" : "",
    left: type === "identity" || type === "alter-ego" ? "#c41218" : "#ba8c2c",
    leftAccent: type === "identity" || type === "alter-ego" ? "#c41218" : "#ffb81d",
    right: type === "identity" || type === "alter-ego" ? "#1a4f9c" : "#263b80",
    rightAccent: type === "identity" || type === "alter-ego" ? "#1a4f9c" : "#6f93c4",
    divider: "#d9d3c7",
    outer: "#87868f",
    outerAccent: "#c5c4c8",
    gradTop: "#6e6d76",
    gradBottom: "#2b2a2f",
    photo: "",
    photoZoom: 1,
    photoX: 0,
    photoY: 0,
    headshot,
    headZoom: 1,
    headX: 0,
    headY: 0,
    fullCardPhoto: false,
  };
}

export function serializeResources(resources: string[]) {
  return JSON.stringify(resources);
}

export function parseResources(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 3) return parsed;
  } catch {
    /* ignore */
  }
  return ["none", "none", "none"];
}

export function cardToDbFields(data: Partial<CardData>) {
  const { resources, ...rest } = data;
  return {
    ...rest,
    ...(resources ? { resources: serializeResources(resources) } : {}),
  };
}

export function dbCardToData(card: {
  type: string;
  title: string;
  subtitle: string;
  typeLabel: string;
  traits: string;
  rules: string;
  quote: string;
  copyright: string;
  setLine: string;
  cost: string;
  costStar: boolean;
  thw: string;
  thwStar: boolean;
  atk: string;
  atkStar: boolean;
  def: string;
  defStar: boolean;
  rec: string;
  recStar: boolean;
  hp: string;
  handSize: string;
  identityHp: string;
  stage: string;
  threat: string;
  schemeNo: string;
  boosts: number;
  boostStar: boolean;
  attAtk: string;
  attSch: string;
  resources: string;
  cracks: boolean;
  showSplash: boolean;
  starSplash: boolean;
  darkText: boolean;
  aspect: string;
  left: string;
  leftAccent: string;
  right: string;
  rightAccent: string;
  divider: string;
  outer: string;
  outerAccent: string;
  gradTop: string;
  gradBottom: string;
  photo: string;
  photoZoom: number;
  photoX: number;
  photoY: number;
  headshot: string;
  headZoom: number;
  headX: number;
  headY: number;
  fullCardPhoto?: boolean;
}): CardData {
  return {
    type: card.type,
    title: card.title,
    subtitle: card.subtitle,
    typeLabel: card.typeLabel,
    traits: card.traits,
    rules: card.rules,
    quote: card.quote,
    copyright: card.copyright,
    setLine: card.setLine,
    cost: card.cost,
    costStar: card.costStar,
    thw: card.thw,
    thwStar: card.thwStar,
    atk: card.atk,
    atkStar: card.atkStar,
    def: card.def,
    defStar: card.defStar,
    rec: card.rec,
    recStar: card.recStar,
    hp: card.hp,
    handSize: card.handSize,
    identityHp: card.identityHp,
    stage: card.stage,
    threat: card.threat,
    schemeNo: card.schemeNo,
    boosts: card.boosts,
    boostStar: card.boostStar,
    attAtk: card.attAtk,
    attSch: card.attSch,
    resources: parseResources(card.resources),
    cracks: card.cracks,
    showSplash: card.showSplash,
    starSplash: card.starSplash,
    darkText: card.darkText,
    aspect: card.aspect,
    left: card.left,
    leftAccent: card.leftAccent,
    right: card.right,
    rightAccent: card.rightAccent,
    divider: card.divider,
    outer: card.outer,
    outerAccent: card.outerAccent,
    gradTop: card.gradTop,
    gradBottom: card.gradBottom,
    photo: card.photo,
    photoZoom: card.photoZoom,
    photoX: card.photoX,
    photoY: card.photoY,
    headshot: card.headshot,
    headZoom: card.headZoom,
    headX: card.headX,
    headY: card.headY,
    fullCardPhoto: Boolean(card.fullCardPhoto),
  };
}
