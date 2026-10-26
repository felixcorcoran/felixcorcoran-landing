# felixcorcoran-landing

Web profesional de Félix Corcoran (felixcorcoran.es). Astro 7 estático, ES en la raíz y EN en `/en/`.
El `README.md` tiene la estructura completa de `src/`: léelo antes de explorar carpetas a ciegas.

## Reglas

- **Ningún dato se inventa** (métricas, clientes, testimonios, plazos, datos legales). Si falta, su
  campo en `src/data/*.ts` queda vacío y no se muestra.
- Textos y datos editables viven en `src/data/` y `src/i18n/index.ts`; los componentes eligen idioma
  con `Astro.currentLocale`. Las páginas `src/pages/*` son finas y montan `src/views/*`.
- CSS propio por componente; Tailwind solo aporta el reset. Paleta y piezas compartidas en
  `src/styles/global.css`.
- Sin cookies ni scripts de terceros en el navegador (solo Formspree al enviar). Si eso cambia,
  actualizar `/privacidad`.
- Si se toca la masa 3D (`src/scripts/mass/*`, `--mass-size`), regenerar los pósters (ver README).
- Al añadir una página, añadirla a mano a `src/pages/sitemap.xml.ts`.

## Comandos

- Dev en segundo plano: `npx astro dev --background` (`astro dev stop | status | logs`), puerto 4321.
- `npm run build` antes de dar algo por terminado.
- Despliegue: Vercel desde `main`, automático al hacer push.

## Carpetas que no son la web

- `estrategia/` (repo git propio, `ESTRATEGIA.md`): posicionamiento y plan comercial.
- `linkedin/`, `radar-comercial/`, `Portfolio/`: material suelto en HTML/PNG, no se despliega.
- `dist/`, `.astro/`, `node_modules/`: generados, no leer.

## Docs de Astro

https://docs.astro.build (routing, componentes, i18n, estilos).
