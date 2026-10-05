import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, canAccessOwner } from "@/lib/permissions";
import { cardToDbFields, dbCardToData } from "@/lib/card-defaults";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const card = await prisma.card.findUnique({
      where: { id },
      include: {
        heroKit: { select: { id: true, name: true } },
        importedDeck: { select: { id: true, name: true } },
      },
    });
    if (!card) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canAccessOwner(session, card.ownerId)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json({
      ...card,
      data: dbCardToData(card),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const card = await prisma.card.findUnique({ where: { id } });
    if (!card) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canAccessOwner(session, card.ownerId)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const fields = cardToDbFields(body);
    const allowed = [
      "type",
      "title",
      "subtitle",
      "typeLabel",
      "traits",
      "rules",
      "quote",
      "copyright",
      "setLine",
      "cost",
      "costStar",
      "thw",
      "thwStar",
      "atk",
      "atkStar",
      "def",
      "defStar",
      "rec",
      "recStar",
      "hp",
      "handSize",
      "identityHp",
      "stage",
      "threat",
      "schemeNo",
      "boosts",
      "boostStar",
      "attAtk",
      "attSch",
      "resources",
      "cracks",
      "showSplash",
      "starSplash",
      "darkText",
      "aspect",
      "left",
      "leftAccent",
      "right",
      "rightAccent",
      "divider",
      "outer",
      "outerAccent",
      "gradTop",
      "gradBottom",
      "photo",
      "photoZoom",
      "photoX",
      "photoY",
      "headshot",
      "headZoom",
      "headX",
      "headY",
      "appPreview",
      "fullCardPhoto",
      "quantity",
      "slotIndex",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in fields && fields[key as keyof typeof fields] !== undefined) {
        data[key] = fields[key as keyof typeof fields];
      }
      if (key in body && !(key in fields)) {
        data[key] = body[key];
      }
    }
    if (typeof body.quantity === "number") data.quantity = body.quantity;
    if (typeof body.slotIndex === "number") data.slotIndex = body.slotIndex;

    const updated = await prisma.card.update({ where: { id }, data });
    return NextResponse.json({ ...updated, data: dbCardToData(updated) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
