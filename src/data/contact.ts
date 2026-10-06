/**
 * Destinos de contacto de la landing. Los que aún no tienen dato real no se
 * inventan: mientras un valor esté vacío, su enlace no se muestra (o el
 * formulario lo indica) y el build lo avisa.
 */
export const contact = {
	/** Correo de contacto (footer y alternativa si el formulario falla). */
	email: 'contacto@felixcorcoran.es',
	/**
	 * Número de WhatsApp en formato internacional, solo dígitos y sin «+»
	 * (p. ej. 34 seguido del número). Se convierte en un enlace wa.me.
	 */
	whatsappNumber: '34673350029',
	/**
	 * Dirección a la que el formulario envía las solicitudes (POST con JSON).
	 * Sirve cualquier servicio de formularios que acepte JSON y responda 2xx
	 * (Formspree, Web3Forms, Getform…) o un endpoint propio. Vacío: al
	 * enviar se abre el correo de quien escribe con la solicitud ya escrita,
	 * dirigida a `email` (no se pierde, pero depende de su programa de correo).
	 * Con Formspree basta con pegar aquí la URL del formulario.
	 */
	formEndpoint: 'https://formspree.io/f/xwlvvogo',
	/**
	 * Solo para Web3Forms: la clave pública del formulario (access_key). Con
	 * Formspree o un endpoint propio, vacía.
	 */
	formAccessKey: '',
};

export const whatsappHref = contact.whatsappNumber
	? `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent('Hola Félix, me gustaría que mirases mi negocio.')}`
	: undefined;
