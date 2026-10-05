import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, canAccessOwner } from "@/lib/permissions";
import { HERO_KIT_TEMPLATE } from "@/lib/hero-template";
import { blankCardData, cardToDbFields, serializeResources } from "@/lib/card-defaults";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");

    const where =
      session.user.role === "admin" && ownerId
        ? { ownerId }
        : session.user.role === "admin"
          ? {}
          : { ownerId: session.user.id };

    const kits = await prisma.heroKit.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { cards: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(kits);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const name = String(body.name || "Nuevo héroe").trim() || "Nuevo héroe";
    const targetOwnerId =
      session.user.role === "admin" && body.ownerId ? String(body.ownerId) : session.user.id;

    if (!canAccessOwner(session, targetOwnerId) && session.user.role !== "admin") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const kit = await prisma.heroKit.create({
      data: {
        name,
        ownerId: targetOwnerId,
        cards: {
          create: HERO_KIT_TEMPLATE.map((slot, index) => {
            const data = blankCardData(slot.type);
            return {
              ownerId: targetOwnerId,
              slotIndex: index + 1,
              quantity: 1,
              ...cardToDbFields(data),
              resources: serializeResources(data.resources),
            };
          }),
        },
      },
      include: { cards: { orderBy: { slotIndex: "asc" } } },
    });

    return NextResponse.json(kit, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
