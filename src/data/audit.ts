import photo from '../assets/felix.png';

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
	 * Foto real, la misma que en LinkedIn y en el Perfil de Empresa (se le
	 * reconoce de un sitio a otro). Recortada a 4:5 desde el original de
	 * 400×400; sin foto, la sección se sostiene solo con el texto.
	 */
	photo: photo as ImageMetadata | undefined,
};
