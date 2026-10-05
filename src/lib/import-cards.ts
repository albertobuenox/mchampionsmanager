import { blankCardData, serializeResources } from "@/lib/card-defaults";
import { mapMarvelCardToFields, type MarvelCard } from "@/lib/marvelcdb";
import { applyAspectColors } from "@/components/card-editor/constants";

export function marvelCardToCreateData(
  marvelCard: MarvelCard,
  opts: { ownerId: string; slotIndex: number; quantity?: number },
) {
  const mapped = mapMarvelCardToFields(marvelCard);
  const base = applyAspectColors(
    { ...blankCardData(mapped.type), aspect: mapped.aspect || "" },
    mapped.aspect || "",
  );
  const resources = mapped.resources || base.resources;
  return {
    ownerId: opts.ownerId,
    slotIndex: opts.slotIndex,
    quantity: opts.quantity ?? 1,
    marvelcdbCode: marvelCard.code,
    type: mapped.type,
    title: mapped.title,
    subtitle: mapped.subtitle,
    typeLabel: mapped.typeLabel,
    traits: mapped.traits,
    rules: mapped.rules,
    quote: mapped.quote,
    setLine: mapped.setLine,
    cost: mapped.cost,
    thw: mapped.thw,
    atk: mapped.atk,
    def: mapped.def,
    rec: mapped.rec,
    hp: mapped.hp,
    handSize: mapped.handSize,
    identityHp: mapped.identityHp,
    aspect: mapped.aspect,
    photo: mapped.photo,
    fullCardPhoto: Boolean(mapped.photo),
    left: base.left,
    leftAccent: base.leftAccent,
    right: base.right,
    rightAccent: base.rightAccent,
    resources: serializeResources(resources),
  };
}
