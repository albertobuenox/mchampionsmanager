# Tipografías de Marvel Champions Card Maker

Fuente: CSS público de [champions-card-maker.pages.dev](https://champions-card-maker.pages.dev/) (`css/newcard.css`, versión 2026.8.11.8).

La web declara cada familia en `@font-face` y la asigna a una clase de la carta. Casi todos los archivos son fuentes comerciales o cortes modificados por el autor. No se pueden copiar los `.ttf`, `.otf` o `.woff` que sirve el sitio. Para usarlas hay que licenciarlas en la fundición, salvo Exo 2.

## Mapa de la carta

| Parte de la carta | Familia en el CSS | Fuente real |
|---|---|---|
| Título | `Exo2Mod` | Exo 2 Bold, modificada |
| Subtítulo | `AvenirNextCondMed` | Avenir Next Condensed Medium |
| Texto de reglas | `AvenirNext` | Avenir Next LT Pro (regular, demi, bold, italic) |
| Traits (`<em>`) | `KomikaTitle` | Komika Title |
| Cita / flavor | `KomikaText` | Komika Text Italic |
| Coste, THW, ATK, amenaza, aceleración | `ElektraMed` | Elektra Medium Pro, bold italic, modificada |
| Tipo de carta y línea de set | `FuturaMedCond` | Futura Medium Condensed (Bitstream) |
| Etiquetas de stats (ATK, THW…) | `FuturaExtraBold` | Futura Extra Bold |
| Copyright / autor | `AvenirNextCondMed` | Avenir Next Condensed |
| Stage del villano (I, II, A…) | `ancbi` | Avenir Next Condensed Bold Italic |
| Iconos (`a` energía, `s` estrella, etc.) | `ChampionsIcons` | Fuente de iconos propia de la herramienta |
| HP / HAND en promos | `HorribleJefe` + `TextbookNewExtraBold` | Horrible Jefe y Textbook New Extra Bold |
| Traits de identity promo | `FigginsExtraBold` | Figgins Extra Bold |
| Lista del starter deck | `AvenirNextCondMed` + `KomikaTitle` | Avenir condensada y Komika Title |

Para cirílico, el CSS sustituye algunas familias por Arial, Arial Narrow e Inform. Solo afecta a ese rango Unicode.

## Licencias

| Fuente | Situación |
|---|---|
| Exo 2 | Libre (SIL Open Font License, Google Fonts). El título de la web usa un corte modificado (`Exo2Mod-Bold.ttf`), así que la versión oficial se acerca pero no es idéntica. |
| Avenir Next y Avenir Next Condensed | Comercial. Linotype / Monotype. |
| Futura (Medium Condensed y Extra Bold) | Comercial. Bitstream / Monotype. En el CSS aparece como `Futura MdCn BT`. |
| Elektra Medium Pro | Comercial. Monotype. El archivo es `ElektraMedProMod-BoldItalic-mod.ttf` y el CSS altera las métricas (`ascent-override`, `descent-override`). |
| Komika Title y Komika Text | Comercial. Apostrophic Labs. |
| Textbook New y Figgins | Comercial. Monotype. |
| ChampionsIcons | No se vende. Fuente de iconos hecha para esa web. Los símbolos son arte del juego. |
