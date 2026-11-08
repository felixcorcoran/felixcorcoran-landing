import { routes, type Lang } from '../i18n';

/**
 * Navegación del sitio. Solo responde a dos preguntas: ¿quiero ver tu
 * trabajo? y ¿quiero contactar contigo? El resto (cómo trabajo, por qué) se
 * descubre con el scroll, a través de la propia historia de la landing.
 *
 * Rutas absolutas: funcionan igual desde la landing y desde /contacto.
 */

const labels = {
	es: { home: 'Inicio', work: 'Trabajo', process: 'Cómo trabajo', contact: 'Contacto' },
	en: { home: 'Home', work: 'Work', process: 'How I work', contact: 'Contact' },
};

/** Navbar flotante. El logo ya lleva al inicio. */
export const primary = (lang: Lang) => [
	// Directo al caso: el trabajo que mejor enseña cómo trabajo
	{ href: routes.work[lang], label: labels[lang].work },
	// Página propia: la landing invita, /contacto es donde se escribe. Con
	// marca propia en la navbar: se puede pedir la auditoría desde el primer
	// segundo, sin recorrer toda la historia.
	{ href: routes.contact[lang], label: labels[lang].contact, highlight: true },
];

/**
 * Footer: la misma navegación, más la vuelta al principio y el método (en
 * la píldora no cabe en móvil; aquí sí).
 */
export const footer = (lang: Lang) => {
	const [work, contact] = primary(lang);
	return [
		{ href: routes.home[lang], label: labels[lang].home },
		work,
		{ href: routes.process[lang], label: labels[lang].process },
		contact,
	];
};

/** ¿Es este enlace la página actual? (para aria-current) */
export const isCurrent = (href: string, pathname: string) =>
	!href.includes('#') && href.replace(/(.)\/$/, '$1') === pathname.replace(/(.)\/$/, '$1');
