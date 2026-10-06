import { contact } from '../../data/contact';

/** Lo que envía el formulario de contacto. */
export interface ContactMessage {
	name: string;
	email: string;
	/** Opcional: cadena vacía si no se indica. */
	phone: string;
	/** Opcional: nombre, web o ficha de Google del negocio. */
	business: string;
	message: string;
}

/**
 * Cómo ha salido el envío:
 *   sent  el servicio de formularios lo ha recibido
 *   mail  no hay servicio configurado: se ha abierto el correo de la persona
 *         con la solicitud ya escrita, y solo le falta enviarla
 */
export type Delivery = 'sent' | 'mail';

const subject = (message: ContactMessage) => `Solicitud de auditoría — ${message.business || message.name}`;

/**
 * Envía una solicitud. Lanza un error si no se ha podido; el formulario se
 * encarga de los estados (enviando, éxito, error) y de conservar los datos.
 *
 * La landing es estática: el envío va a contact.formEndpoint (src/data/
 * contact.ts), un servicio de formularios que acepte JSON (Formspree,
 * Web3Forms con contact.formAccessKey, Getform…) o un endpoint propio.
 *
 * Mientras no haya uno configurado, la solicitud no se pierde: se abre el
 * correo de quien escribe, dirigido a contact.email, con todo lo que ha
 * puesto en el formulario. No se finge un envío: el formulario le dice que
 * solo le falta enviarlo.
 */
export async function sendContactMessage(message: ContactMessage): Promise<Delivery> {
	if (!contact.formEndpoint) {
		openMail(message);
		return 'mail';
	}

	// Formspree reconoce sus campos especiales con «_» (_subject, _replyto);
	// otros servicios (Web3Forms…) los esperan sin él
	const formspree = contact.formEndpoint.includes('formspree.io');
	const meta = formspree
		? { _subject: subject(message), _replyto: message.email }
		: {
				// Web3Forms identifica el formulario con una clave pública
				...(contact.formAccessKey && { access_key: contact.formAccessKey }),
				subject: subject(message),
				replyto: message.email,
			};

	const response = await fetch(contact.formEndpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify({ ...message, ...meta }),
	});
	if (!response.ok) throw new Error(`El envío ha fallado (${response.status})`);
	return 'sent';
}

/** El correo de la persona, con la solicitud escrita (mailto:). */
function openMail(message: ContactMessage) {
	const lines = [message.message, '', '—', `Nombre: ${message.name}`, `Email: ${message.email}`];
	if (message.phone) lines.push(`Teléfono: ${message.phone}`);
	if (message.business) lines.push(`Negocio: ${message.business}`);

	const query = new URLSearchParams({ subject: subject(message), body: lines.join('\n') })
		.toString()
		// mailto: los espacios van como %20 (algunos clientes muestran los «+»)
		.replace(/\+/g, '%20');
	window.location.href = `mailto:${contact.email}?${query}`;
}
