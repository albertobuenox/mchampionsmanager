import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, canAccessOwner } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const kit = await prisma.heroKit.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        cards: { orderBy: { slotIndex: "asc" } },
      },
    });
    if (!kit) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canAccessOwner(session, kit.ownerId)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    return NextResponse.json(kit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const kit = await prisma.heroKit.findUnique({ where: { id } });
    if (!kit) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canAccessOwner(session, kit.ownerId)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await request.json();
    const data: { name?: string; headshotUrl?: string } = {};
    if (typeof body.name === "string") data.name = body.name.trim() || kit.name;
    if (typeof body.headshotUrl === "string") data.headshotUrl = body.headshotUrl;

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.heroKit.update({ where: { id }, data });
      if (data.headshotUrl !== undefined) {
        await tx.card.updateMany({
          where: { heroKitId: id },
          data: { headshot: data.headshotUrl },
        });
      }
      return next;
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const kit = await prisma.heroKit.findUnique({ where: { id } });
    if (!kit) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (!canAccessOwner(session, kit.ownerId)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    await prisma.heroKit.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
