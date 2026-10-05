import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, canAccessOwner } from "@/lib/permissions";
import {
  fetchDecklist,
  fetchHeroIdentityCards,
  fetchMarvelCardSafe,
  parseDeckAspect,
} from "@/lib/marvelcdb";
import { marvelCardToCreateData } from "@/lib/import-cards";

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

    const decks = await prisma.importedDeck.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { cards: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(decks);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

type ProgressEvent =
  | { type: "start"; name: string; total: number }
  | { type: "progress"; current: number; total: number; label: string }
  | { type: "done"; deck: unknown }
  | { type: "error"; error: string };

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const marvelcdbId = Number(body.marvelcdbId);
    if (!Number.isFinite(marvelcdbId) || marvelcdbId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const targetOwnerId =
      session.user.role === "admin" && body.ownerId ? String(body.ownerId) : session.user.id;

    if (!canAccessOwner(session, targetOwnerId)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const existing = await prisma.importedDeck.findUnique({
      where: { ownerId_marvelcdbId: { ownerId: targetOwnerId, marvelcdbId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Ese mazo ya está importado", id: existing.id }, { status: 409 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: ProgressEvent) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        try {
          send({
            type: "progress",
            current: 0,
            total: 1,
            label: "Descargando lista del mazo…",
          });

          const deck = await fetchDecklist(marvelcdbId);
          const slots = deck.slots || {};
          const codes = Object.keys(slots);
          // identity/alter-ego + each slot + save step
          const total = Math.max(1, codes.length + 3);

          send({ type: "start", name: deck.name, total });
          send({
            type: "progress",
            current: 1,
            total,
            label: "Cargando identidad y alter-ego…",
          });

          const heroCards = await fetchHeroIdentityCards(deck.hero_code);

          const marvelCards = [];
          for (let i = 0; i < codes.length; i++) {
            const code = codes[i];
            send({
              type: "progress",
              current: 2 + i,
              total,
              label: `Cargando carta ${i + 1}/${codes.length}…`,
            });
            marvelCards.push(await fetchMarvelCardSafe(code));
            await new Promise((r) => setTimeout(r, 80));
          }

          send({
            type: "progress",
            current: total - 1,
            total,
            label: "Guardando mazo…",
          });

          let slotIndex = 1;
          const cardCreates = [
            ...heroCards.map((marvelCard) =>
              marvelCardToCreateData(marvelCard, {
                ownerId: targetOwnerId,
                slotIndex: slotIndex++,
                quantity: 1,
              }),
            ),
            ...marvelCards.map((marvelCard) => {
              const qty =
                slots[marvelCard.code] ??
                slots[marvelCard.code.replace(/[ab]$/, "")] ??
                1;
              return marvelCardToCreateData(marvelCard, {
                ownerId: targetOwnerId,
                slotIndex: slotIndex++,
                quantity: qty,
              });
            }),
          ];

          const created = await prisma.importedDeck.create({
            data: {
              marvelcdbId,
              name: deck.name,
              heroName: deck.hero_name || "",
              aspect: parseDeckAspect(deck.meta),
              rawJson: JSON.stringify(deck),
              ownerId: targetOwnerId,
              cards: { create: cardCreates },
            },
            include: { cards: { orderBy: { slotIndex: "asc" } } },
          });

          send({
            type: "progress",
            current: total,
            total,
            label: "Importación completada",
          });
          send({ type: "done", deck: created });
        } catch (error) {
          const message = error instanceof Error ? error.message : "ERROR";
          send({ type: "error", error: message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ERROR";
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
