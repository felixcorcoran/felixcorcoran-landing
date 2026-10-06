/**
 * Datos del titular para el aviso legal y la política de privacidad.
 *
 * Igual que contact.ts y audit.ts: lo que no está confirmado no se inventa.
 * Un campo vacío no se muestra y el build avisa de lo que falta. Todos son
 * obligatorios antes de publicar (LSSI art. 10 y RGPD art. 13).
 */
export const legal = {
	/** Nombre y apellidos completos del titular (persona física). */
	titular: 'Félix Miguel Corcoran Bond',
	/** NIF del titular. */
	nif: '26325245C',
	/** Domicilio (calle, número, código postal y localidad). */
	domicilio: 'Calle Fuentes 27, 29492, Jubrique',
	/**
	 * Empresa que aloja la web (p. ej. «Netlify, Inc.» o «Vercel Inc.»). Es
	 * encargada del tratamiento de los datos técnicos de acceso.
	 */
	hosting: 'Vercel Inc',
	/** Última revisión de los textos legales (AAAA-MM-DD). */
	updated: '2026-10-07',
};

/** Qué falta por rellenar (para los avisos del build). */
export const missingLegal = (Object.keys(legal) as (keyof typeof legal)[]).filter((key) => !legal[key]);
