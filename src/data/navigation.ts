/**
 * Navegación del sitio. Solo responde a dos preguntas: ¿quiero ver tu
 * trabajo? y ¿quiero contactar contigo? El resto (cómo trabajo, por qué) se
 * descubre con el scroll, a través de la propia historia de la landing.
 *
 * Rutas absolutas: funcionan igual desde la landing y desde /contacto.
 */

/** Navbar flotante. El logo ya lleva al inicio. */
export const primary = [
	// Directo al caso: el trabajo que mejor enseña cómo trabajo
	{ href: '/#trabajo', label: 'Trabajo' },
	// Página propia: la landing invita, /contacto es donde se escribe. Con
	// marca propia en la navbar: se puede pedir la auditoría desde el primer
	// segundo, sin recorrer toda la historia.
	{ href: '/contacto', label: 'Contacto', highlight: true },
];

/** Footer: la misma navegación, más la vuelta al principio. */
export const footer = [{ href: '/', label: 'Inicio' }, ...primary];

/** ¿Es este enlace la página actual? (para aria-current) */
export const isCurrent = (href: string, pathname: string) =>
	!href.includes('#') && href.replace(/\/$/, '') === pathname.replace(/\/$/, '');
