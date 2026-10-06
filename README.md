# felixcorcoran.es

Landing de Félix Corcoran. Astro + CSS, tipografía Sora self-hosted.

```text
src/
├── layouts/Layout.astro     documento, meta y fuentes
├── components/Navbar.astro  píldora flotante
├── components/Hero.astro    primera pantalla
├── pages/index.astro        la landing
├── pages/contacto.astro     /contacto: formulario (envío en scripts/contact/send.ts)
├── assets/mass-poster*.png  primer frame de la masa (escritorio / móvil)
├── assets/work/             capturas reales de los proyectos (Proof)
├── scripts/mass/            masa orgánica 3D (Three.js, carga diferida)
│   ├── mass.ts              escena + estado animable (MassState)
│   ├── mass.vert / .frag    deformación procedural y material
│   ├── hero.ts              montaje en el Hero: póster → WebGL
│   └── poster.ts            exportación del póster (solo desarrollo)
└── styles/global.css        paleta, marco y estilos base
```

## Póster de la masa

Mientras carga WebGL (y sin WebGL o con movimiento reducido) se ve una imagen
que es exactamente el primer frame de la masa 3D, con la misma perspectiva. Así
el relevo imagen → 3D no se nota. Si cambian la forma o el material de la masa
(`mass.ts`, `mass.vert`, `mass.frag`), su pose de reposo o `--mass-size`, hay
que regenerar los pósters:

1. `npm run dev` y abrir la página arriba del todo.
2. A 1440×900, en la consola: `__exportPoster()` → descarga `mass-poster.png`.
3. A 390×844 (vista móvil): `__exportPoster()` → descarga `mass-poster-compact.png`.
4. Copiar ambos a `src/assets/`. Astro genera AVIF/WebP en el build.

## Comandos

| Comando           | Acción                                   |
| :---------------- | :--------------------------------------- |
| `npm run dev`     | Servidor local en `localhost:4321`       |
| `npm run build`   | Build de producción en `./dist/`         |
| `npm run preview` | Previsualiza el build                    |
