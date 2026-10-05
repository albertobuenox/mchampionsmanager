import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, canAccessOwner } from "@/lib/permissions";
import { fetchHeroIdentityCards } from "@/lib/marvelcdb";
import { marvelCardToCreateData } from "@/lib/import-cards";

type Params = { params: Promise<{ id: string }> };

async function ensureIdentityCards(deck: {
  id: string;
  ownerId: string;
  rawJson: string;
  cards: { type: string; slotIndex: number }[];
}) {
  const hasIdentity = deck.cards.some((c) => c.type === "identity" || c.type === "alter-ego");
  if (hasIdentity) return false;

  let heroCode = "";
  try {
    const raw = JSON.parse(deck.rawJson || "{}");
    heroCode = raw.hero_code || "";
  } catch {
    return false;
  }
  if (!heroCode) return false;

  const heroCards = await fetchHeroIdentityCards(heroCode);
  if (!heroCards.length) return false;

  const minSlot = deck.cards.reduce((min, c) => Math.min(min, c.slotIndex), 1);
  const shift = heroCards.length;

  await prisma.$transaction(async (tx) => {
    // Make room at the top of the deck numbering.
    const existing = await tx.card.findMany({
      where: { importedDeckId: deck.id },
      orderBy: { slotIndex: "desc" },
    });
    for (const card of existing) {
      await tx.card.update({
        where: { id: card.id },
        data: { slotIndex: card.slotIndex + shift },
      });
    }
    let slotIndex = Math.min(1, minSlot);
    for (const marvelCard of heroCards) {
      await tx.card.create({
        data: {
          ...marvelCardToCreateData(marvelCard, {
            ownerId: deck.ownerId,
            slotIndex: slotIndex++,
            quantity: 1,
          }),
          importedDeckId: deck.id,
        },
      });
    }
  });

  return true;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    let deck = await prisma.importedDeck.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        cards: { orderBy: { slotIndex: "asc" } },
      },
    });
    if (!deck) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canAccessOwner(session, deck.ownerId)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const repaired = await ensureIdentityCards(deck);
    if (repaired) {
      deck = await prisma.importedDeck.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          cards: { orderBy: { slotIndex: "asc" } },
        },
      });
    }

    return NextResponse.json(deck);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const deck = await prisma.importedDeck.findUnique({ where: { id } });
    if (!deck) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canAccessOwner(session, deck.ownerId)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    await prisma.importedDeck.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
