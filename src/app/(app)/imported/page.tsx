import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImportedClient } from "@/components/imported-client";

export default async function ImportedPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const decks = await prisma.importedDeck.findMany({
    where: isAdmin ? undefined : { ownerId: session!.user.id },
    include: {
      owner: { select: { name: true } },
      _count: { select: { cards: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <ImportedClient
      isAdmin={!!isAdmin}
      initial={decks.map((d) => ({
        id: d.id,
        name: d.name,
        marvelcdbId: d.marvelcdbId,
        heroName: d.heroName,
        aspect: d.aspect,
        _count: d._count,
        owner: d.owner,
      }))}
    />
  );
}
