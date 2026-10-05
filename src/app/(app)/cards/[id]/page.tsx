import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessOwner } from "@/lib/permissions";
import { dbCardToData } from "@/lib/card-defaults";
import { CardEditor } from "@/components/card-editor/card-editor";

type Props = { params: Promise<{ id: string }> };

export default async function CardPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;
  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      heroKit: { select: { id: true, name: true } },
      importedDeck: { select: { id: true, name: true } },
    },
  });
  if (!card || !canAccessOwner(session, card.ownerId)) notFound();

  return (
    <CardEditor
      initial={dbCardToData(card)}
      meta={{
        id: card.id,
        heroKit: card.heroKit,
        importedDeck: card.importedDeck,
      }}
    />
  );
}
