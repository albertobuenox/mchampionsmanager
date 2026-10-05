# MChampions Manager

App Next.js para crear kits de héroe (15 cartas), importar mazos de MarvelCDB y personalizar el arte de cada carta.

## Arranque

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

**Admin por defecto:** `admin@mchampions.local` / `admin123`

## Stack

- Next.js App Router
- Auth.js (credenciales) con roles `admin` / `user`
- Prisma + SQLite local (`prisma/dev.db`) — mismo esquema adaptable a PostgreSQL cambiando el provider
- Editor de cartas portado del prototipo CSS original

## Secciones

- **Héroes** — crear kit de 15 cartas, editar filas, subir retrato compartido, abrir editor visual
- **Mazos importados** — importar por ID público de MarvelCDB
- **Usuarios** (admin) — crear/editar usuarios y ver su contenido
