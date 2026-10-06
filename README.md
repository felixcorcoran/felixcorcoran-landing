# felixcorcoran.es

Web profesional de Félix Corcoran: «Encuentro dónde se le escapan clientes y tiempo a tu negocio».
Una landing editorial con una escena de scroll (masa 3D), un caso real y una auditoría gratuita como
oferta, más `/contacto`, `/aviso-legal` y `/privacidad`.

La estrategia, las decisiones y los datos pendientes están en [ESTRATEGIA.md](ESTRATEGIA.md): es lo
primero que hay que leer antes de tocar nada.

## Stack

- [Astro](https://astro.build) 7, salida estática. Sin framework de componentes.
- CSS propio por componente (Tailwind solo aporta el reset).
- [GSAP](https://gsap.com) + ScrollTrigger para las escenas y las entradas.
- [Three.js](https://threejs.org) para la masa 3D, cargado en diferido.
- Sora self-hosted (`@fontsource/sora`, pesos 300, 400, 500 y 600).
- Formulario → [Formspree](https://formspree.io) (fetch con JSON, sin librería).
- Alojamiento en Vercel.

La web no usa cookies, `localStorage` ni servicios de terceros en el navegador (solo Formspree, al
enviar el formulario). Si eso cambia, hay que revisar `/privacidad`.

## Comandos

Node 22.12 o superior.

| Comando           | Acción                                   |
| :---------------- | :--------------------------------------- |
| `npm install`     | Instala las dependencias                 |
| `npm run dev`     | Servidor local en `localhost:4321`       |
| `npm run build`   | Build de producción en `./dist/`         |
| `npm run preview` | Previsualiza el build                    |

Con agentes de código, el servidor se arranca en segundo plano: `npx astro dev --background`
(y `astro dev stop | status | logs`).

## Estructura

```text
src/
├── pages/
│   ├── index.astro            la landing (Escena → Caso → Auditoría → Trabajo → Acción)
│   ├── contacto.astro         /contacto: invitación y formulario
│   ├── aviso-legal.astro      /aviso-legal
│   ├── privacidad.astro       /privacidad
│   └── sitemap.xml.ts         sitemap (lista de páginas a mano)
├── layouts/
│   ├── Layout.astro           documento, meta, Open Graph y fuentes
│   └── LegalLayout.astro      plantilla de las páginas legales
├── components/
│   ├── Navbar.astro           píldora flotante (Contacto con punto coral)
│   ├── Scene.astro            escena fija de scroll: Hero + Problem + Insight
│   ├── Hero.astro             titular y masa 3D (póster → WebGL)
│   ├── Problem.astro          las tres preguntas
│   ├── Insight.astro          «No necesitas más tecnología…»
│   ├── Case.astro             el caso Spain Trading Cards
│   ├── Audit.astro            la auditoría gratuita y su CTA
│   ├── Work.astro             más trabajo (portfolio)
│   ├── Action.astro           CTA final (escena final con el footer)
│   ├── Footer.astro           la firma
│   └── ContactForm.astro      el formulario de /contacto
├── data/                      todo lo que se edita sin tocar componentes
│   ├── contact.ts             email, WhatsApp, endpoint de Formspree
│   ├── audit.ts               plazo, formato de entrega, foto (vacíos = no se muestran)
│   ├── legal.ts               titular, NIF, domicilio, hosting
│   └── navigation.ts          enlaces de la navbar y del footer
├── scripts/
│   ├── motion.ts              ¿escenas sí o no? (movimiento reducido, pantallas bajas)
│   ├── scene/                 timeline de la escena inicial
│   ├── mass/                  masa 3D (Three.js, shaders, póster)
│   ├── action.ts              escena final CTA → footer
│   ├── reveal.ts              entradas de las secciones en flujo normal
│   └── contact/               validación y envío del formulario
├── assets/
│   ├── mass-poster*.png       primer frame de la masa (escritorio / móvil)
│   └── work/                  capturas reales de los proyectos
└── styles/global.css          paleta, marco, grano y piezas compartidas
```

## Datos y regla de contenido

Ningún dato se inventa: métricas, clientes, testimonios, plazos, datos legales… Si falta un dato, su
campo en `src/data/*.ts` se deja vacío, no se muestra y, cuando es obligatorio, el build lo avisa.
La lista de pendientes está en [ESTRATEGIA.md](ESTRATEGIA.md).

## Capturas del portfolio

Portadas reales, sin retocar, en `src/assets/work/`:

- Escritorio: 1440 px a 2× → 2880×1620 (`*-desktop.jpg`).
- Móvil: 390 px a 3× → 1170×2100 (`*-mobile.jpg`).

Chrome sin interfaz no deja ventanas tan estrechas como un móvil: la captura móvil hay que hacerla
emulando el dispositivo (DevTools o el protocolo de depuración), no con `--window-size`.

## Póster de la masa

Mientras carga WebGL (y sin WebGL o con movimiento reducido) se ve una imagen que es exactamente el
primer frame de la masa 3D, con la misma perspectiva. Así el relevo imagen → 3D no se nota. Si
cambian la forma o el material de la masa (`mass.ts`, `mass.vert`, `mass.frag`), su pose de reposo
o `--mass-size`, hay que regenerar los pósters:

1. `npm run dev` y abrir la página arriba del todo.
2. A 1440×900, en la consola: `__exportPoster()` → descarga `mass-poster.png`.
3. A 390×844 (vista móvil): `__exportPoster()` → descarga `mass-poster-compact.png`.
4. Copiar ambos a `src/assets/`. Astro genera AVIF/WebP en el build.

## Despliegue

Vercel, desde la rama `main` (detecta Astro sin configuración). El dominio y su DNS están en
DonDominio: la web va con los registros que indica Vercel; el correo (`contacto@`) con los MX de
ImprovMX. Al tocar el DNS de la web, no hay que tocar los MX ni el SPF.
