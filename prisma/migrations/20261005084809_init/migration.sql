-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HeroKit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "headshotUrl" TEXT NOT NULL DEFAULT '',
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HeroKit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportedDeck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marvelcdbId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "heroName" TEXT NOT NULL DEFAULT '',
    "aspect" TEXT NOT NULL DEFAULT '',
    "rawJson" TEXT NOT NULL DEFAULT '{}',
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImportedDeck_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "heroKitId" TEXT,
    "importedDeckId" TEXT,
    "slotIndex" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "marvelcdbCode" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'event',
    "title" TEXT NOT NULL DEFAULT '',
    "subtitle" TEXT NOT NULL DEFAULT '',
    "typeLabel" TEXT NOT NULL DEFAULT '',
    "traits" TEXT NOT NULL DEFAULT '',
    "rules" TEXT NOT NULL DEFAULT '',
    "quote" TEXT NOT NULL DEFAULT '',
    "copyright" TEXT NOT NULL DEFAULT '',
    "setLine" TEXT NOT NULL DEFAULT '',
    "cost" TEXT NOT NULL DEFAULT '',
    "costStar" BOOLEAN NOT NULL DEFAULT false,
    "thw" TEXT NOT NULL DEFAULT '',
    "thwStar" BOOLEAN NOT NULL DEFAULT false,
    "atk" TEXT NOT NULL DEFAULT '',
    "atkStar" BOOLEAN NOT NULL DEFAULT false,
    "def" TEXT NOT NULL DEFAULT '',
    "defStar" BOOLEAN NOT NULL DEFAULT false,
    "rec" TEXT NOT NULL DEFAULT '',
    "recStar" BOOLEAN NOT NULL DEFAULT false,
    "hp" TEXT NOT NULL DEFAULT '',
    "handSize" TEXT NOT NULL DEFAULT '',
    "identityHp" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL DEFAULT '',
    "threat" TEXT NOT NULL DEFAULT '',
    "schemeNo" TEXT NOT NULL DEFAULT '',
    "boosts" INTEGER NOT NULL DEFAULT 0,
    "boostStar" BOOLEAN NOT NULL DEFAULT false,
    "attAtk" TEXT NOT NULL DEFAULT '',
    "attSch" TEXT NOT NULL DEFAULT '',
    "resources" TEXT NOT NULL DEFAULT '["none","none","none"]',
    "cracks" BOOLEAN NOT NULL DEFAULT true,
    "showSplash" BOOLEAN NOT NULL DEFAULT true,
    "starSplash" BOOLEAN NOT NULL DEFAULT false,
    "darkText" BOOLEAN NOT NULL DEFAULT false,
    "aspect" TEXT NOT NULL DEFAULT '',
    "left" TEXT NOT NULL DEFAULT '#ba8c2c',
    "leftAccent" TEXT NOT NULL DEFAULT '#ffb81d',
    "right" TEXT NOT NULL DEFAULT '#263b80',
    "rightAccent" TEXT NOT NULL DEFAULT '#6f93c4',
    "divider" TEXT NOT NULL DEFAULT '#d9d3c7',
    "outer" TEXT NOT NULL DEFAULT '#87868f',
    "outerAccent" TEXT NOT NULL DEFAULT '#c5c4c8',
    "gradTop" TEXT NOT NULL DEFAULT '#6e6d76',
    "gradBottom" TEXT NOT NULL DEFAULT '#2b2a2f',
    "photo" TEXT NOT NULL DEFAULT '',
    "photoZoom" REAL NOT NULL DEFAULT 1,
    "photoX" REAL NOT NULL DEFAULT 0,
    "photoY" REAL NOT NULL DEFAULT 0,
    "headshot" TEXT NOT NULL DEFAULT '',
    "headZoom" REAL NOT NULL DEFAULT 1,
    "headX" REAL NOT NULL DEFAULT 0,
    "headY" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Card_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Card_heroKitId_fkey" FOREIGN KEY ("heroKitId") REFERENCES "HeroKit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Card_importedDeckId_fkey" FOREIGN KEY ("importedDeckId") REFERENCES "ImportedDeck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ImportedDeck_ownerId_marvelcdbId_key" ON "ImportedDeck"("ownerId", "marvelcdbId");

-- CreateIndex
CREATE INDEX "Card_heroKitId_slotIndex_idx" ON "Card"("heroKitId", "slotIndex");

-- CreateIndex
CREATE INDEX "Card_importedDeckId_slotIndex_idx" ON "Card"("importedDeckId", "slotIndex");
