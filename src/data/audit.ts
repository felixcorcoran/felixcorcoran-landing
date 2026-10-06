/**
 * La auditoría gratuita: lo que se promete en la landing y en /contacto.
 *
 * Igual que en contact.ts, lo que aún no está decidido no se inventa: un
 * dato vacío simplemente no se muestra. Rellenarlo es suficiente para que
 * aparezca en la sección de la auditoría.
 */
export const audit = {
	/** Cuánto tarda desde que se pide hasta que se entrega (p. ej. «una semana»). */
	turnaround: '',
	/** Cómo se entrega (p. ej. «En una llamada de 30 minutos, o en persona si estás en Málaga»). */
	delivery: '',
};

/** Quién mira. Tres líneas, en primera persona. */
export const person = {
	name: 'Félix Corcoran',
	/**
	 * Foto real (documental, no de estudio) en src/assets/. Mientras no la
	 * haya, la sección se sostiene solo con el texto.
	 */
	photo: undefined as ImageMetadata | undefined,
};
