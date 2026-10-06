import { sendContactMessage, type ContactMessage, type Delivery } from './send';

type Validated = 'name' | 'email' | 'message';
type Field = HTMLInputElement | HTMLTextAreaElement;
type State = 'idle' | 'sending' | 'success' | 'mail' | 'error';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Cada regla devuelve el mensaje de error, o null si el valor es válido. */
const RULES: Record<Validated, (value: string, field: Field) => string | null> = {
	name: (value) => (value.length >= 2 ? null : 'Escribe tu nombre.'),
	email: (value, field) => {
		if (!value) return 'Escribe tu email para que pueda responderte.';
		const invalid = (field as HTMLInputElement).validity.typeMismatch || !EMAIL.test(value);
		return invalid ? 'Este email no parece correcto. Revísalo, por favor.' : null;
	},
	message: (value) => {
		if (!value) return 'Cuéntame qué te gustaría mejorar.';
		return value.length >= 10 ? null : 'Cuéntame un poco más (al menos 10 caracteres).';
	},
};

const VALIDATED = Object.keys(RULES) as Validated[];

/**
 * Formulario de contacto: validación, estados y envío.
 *
 * - Los errores aparecen al salir de un campo que ya se ha tocado y al
 *   intentar enviar; se corrigen en cuanto el valor pasa a ser válido.
 * - Cada error es texto asociado a su campo (aria-describedby) y el campo
 *   se marca con aria-invalid: no depende del color.
 * - Enviando: el botón cambia de texto y no se puede reenviar.
 * - Éxito: mensaje breve y formulario vacío. Error: mensaje con el email como
 *   alternativa, y los datos se conservan.
 * - Sin servicio de envío configurado: se abre el correo con la solicitud
 *   escrita (ver send.ts); el formulario lo dice y conserva los datos.
 *
 * `send` es el punto de envío (ver send.ts).
 */
export function initContactForm(form: HTMLFormElement, send = sendContactMessage) {
	const status = form.querySelector<HTMLElement>('[data-form-status]');
	const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
	const label = button?.querySelector<HTMLElement>('[data-button-label]');
	if (!status || !button || !label) return;

	// La validación la hace este script (mensajes propios, en español y
	// asociados a cada campo); sin JS queda la validación nativa del navegador
	form.noValidate = true;

	const idleLabel = label.textContent ?? '';
	const email = form.dataset.email ?? '';
	const touched = new Set<Validated>();
	let state: State = 'idle';

	const field = (name: string) => form.elements.namedItem(name) as Field;
	const isValidated = (name: string): name is Validated => name in RULES;

	function validate(name: Validated) {
		const input = field(name);
		const error = RULES[name](input.value.trim(), input);
		const slot = form.querySelector<HTMLElement>(`#${input.id}-error`);
		if (slot) slot.textContent = error ?? '';
		if (error) input.setAttribute('aria-invalid', 'true');
		else input.removeAttribute('aria-invalid');
		return !error;
	}

	form.addEventListener('focusout', (event) => {
		const input = event.target as Field;
		if (!isValidated(input.name)) return;
		// Un campo vacío que solo se ha atravesado con el tabulador no es un error
		if (input.value.trim()) touched.add(input.name);
		if (touched.has(input.name)) validate(input.name);
	});

	form.addEventListener('input', (event) => {
		const input = event.target as Field;
		// Mientras hay un error visible, desaparece en cuanto se corrige
		if (isValidated(input.name) && input.hasAttribute('aria-invalid')) validate(input.name);
		// Tras un éxito o un error, volver a escribir devuelve el formulario a su estado normal
		if (state === 'success' || state === 'mail' || state === 'error') setState('idle');
	});

	form.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (state === 'sending') return;

		VALIDATED.forEach((name) => touched.add(name));
		const firstInvalid = VALIDATED.map((name) => (validate(name) ? null : name)).find(Boolean);
		if (firstInvalid) {
			setState('idle');
			field(firstInvalid).focus();
			return;
		}

		const message: ContactMessage = {
			name: field('name').value.trim(),
			email: field('email').value.trim(),
			phone: field('phone').value.trim(),
			business: field('business').value.trim(),
			message: field('message').value.trim(),
		};

		// Solo en desarrollo: window.__contactSend sustituye el envío para
		// probar los estados (p. ej. un envío que tarda y termina bien)
		const deliver =
			(import.meta.env.DEV && (window as { __contactSend?: typeof send }).__contactSend) || send;

		setState('sending');
		try {
			// Sin valor (p. ej. el envío de pruebas de desarrollo): enviado
			const delivery: Delivery = (await deliver(message)) || 'sent';
			if (delivery === 'mail') {
				setState('mail');
				return;
			}
			form.reset();
			touched.clear();
			setState('success');
		} catch (error) {
			console.error('[contacto]', error);
			setState('error');
		}
	});

	function setState(next: State) {
		state = next;
		form.dataset.state = next;
		form.setAttribute('aria-busy', String(next === 'sending'));
		button!.setAttribute('aria-disabled', String(next === 'sending'));
		label!.textContent = next === 'sending' ? 'Enviando…' : idleLabel;

		status!.replaceChildren();
		if (next === 'sending') {
			// Para lectores de pantalla (visualmente ya lo dice el botón)
			status!.textContent = 'Enviando tu mensaje…';
		} else if (next === 'success') {
			status!.textContent = 'Gracias. Lo he recibido: empiezo por leerlo y mirar tu negocio, y te escribo.';
		} else if (next === 'mail') {
			const link = Object.assign(document.createElement('a'), { href: `mailto:${email}`, textContent: email });
			status!.append(
				'Se ha abierto tu correo con la solicitud ya escrita: solo te falta enviarla. Si no se ha abierto, escríbeme a ',
				link,
				'.',
			);
		} else if (next === 'error') {
			const link = Object.assign(document.createElement('a'), { href: `mailto:${email}`, textContent: 'email' });
			status!.append(
				'No se ha podido enviar el mensaje. Inténtalo de nuevo o escríbeme directamente por ',
				link,
				'.',
			);
		}
	}
}
