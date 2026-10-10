/**
 * Idiomas de la web: español en la raíz e inglés en /en/.
 *
 * Cada componente elige sus textos con `langOf(Astro.currentLocale)` (Astro
 * deduce el idioma de la URL). Los textos viven junto a su marcado, en un
 * objeto `{ es, en }` por componente: así cada frase se lee con su contexto.
 *
 * Las páginas legales existen solo en español (obligatorias en España); desde
 * la versión inglesa se enlazan avisando del idioma.
 */
export type Lang = 'es' | 'en';

export const langOf = (locale: string | undefined): Lang => (locale === 'en' ? 'en' : 'es');

/** Las páginas que existen en los dos idiomas, con su ruta en cada uno. */
export const routes = {
	home: { es: '/', en: '/en' },
	contact: { es: '/contacto', en: '/en/contact' },
	/** El caso: el trabajo que mejor enseña cómo trabajo */
	work: { es: '/#trabajo', en: '/en#work' },
} as const;

/** El id de la sección del caso (destino de «Trabajo» / «Work»). */
export const workId = { es: 'trabajo', en: 'work' } as const;

const normalize = (path: string) => path.replace(/(.)\/$/, '$1');

/**
 * Las versiones de una ruta en cada idioma, o null si la página solo existe
 * en uno (legales, 404).
 */
export function alternatesOf(pathname: string): Record<Lang, string> | null {
	const path = normalize(pathname);
	for (const route of Object.values(routes)) {
		if (route.es.includes('#')) continue;
		if (normalize(route.es) === path || normalize(route.en) === path) return { es: route.es, en: route.en };
	}
	return null;
}
