import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COMPACT } from './motion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Entradas de las secciones en flujo normal (caso, auditoría, más trabajo).
 *
 * El desenfoque significa algo: lo que entra pasa de difuso a enfocado, como
 * una observación que se confirma. Por eso nunca va ligado al scroll (un
 * texto a medio enfocar no se puede leer): cuando el grupo entra en
 * pantalla, la animación se reproduce una vez y siempre termina.
 *
 *   [data-reveal]                un grupo: sus piezas entran escalonadas
 *   [data-reveal="sequence"]     las piezas y las líneas, una detrás de otra
 *                                en el orden del documento (un flujo)
 *   [data-reveal-item]           una pieza; su valor elige cómo entra:
 *       (vacío)  se enfoca y sube un poco
 *       scale    una frase clave: llega desde la profundidad, más grande
 *       clip     una imagen: se abre desde el centro
 *   [data-reveal-line]           una línea que se traza (usa --line, 0 → 1)
 *
 * En móvil, el scroll rápido (con el dedo y el impulso) deja atrás una
 * animación de tiempo fijo: se llegaba a secciones aún a medio aparecer, casi
 * vacías. Allí empiezan antes (en cuanto asoman), van más deprisa, y si se
 * llega a toda velocidad el contenido ya está (ver pace()).
 *
 * Sin JS o con movimiento reducido no se llama: todo está ya en su sitio.
 */
const FROM: Record<string, gsap.TweenVars> = {
	focus: { opacity: 0, filter: 'blur(8px)', y: 14 },
	scale: { opacity: 0, filter: 'blur(16px)', scale: 1.06 },
	clip: { opacity: 0, clipPath: 'inset(10% 6% 10% 6% round 1rem)', scale: 1.03 },
};

const TO: Record<string, gsap.TweenVars> = {
	focus: { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.9, clearProps: 'filter' },
	scale: { opacity: 1, filter: 'blur(0px)', scale: 1, duration: 1.3, ease: 'power3.out', clearProps: 'filter' },
	clip: {
		opacity: 1,
		clipPath: 'inset(0% 0% 0% 0% round 1rem)',
		scale: 1,
		duration: 1.4,
		ease: 'power3.out',
		clearProps: 'clipPath',
	},
};

/** Velocidad de scroll (px/s) a partir de la cual, en móvil, se acelera… */
const FAST = 900;
/** …y a partir de la cual el contenido aparece ya colocado */
const FLING = 2500;

export function initReveal(root: ParentNode = document) {
	// Se decide al cargar, como el resto de entradas
	const compact = matchMedia(COMPACT).matches;
	const step = compact ? 0.15 : 0.3;

	for (const group of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
		const sequence = group.dataset.reveal === 'sequence';
		const parts = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal-item], [data-reveal-line]'));
		const items = parts.filter((el) => el.hasAttribute('data-reveal-item'));
		const lines = parts.filter((el) => el.hasAttribute('data-reveal-line'));
		if (!items.length) items.push(group);

		const kind = (el: HTMLElement) => (el.dataset.revealItem && FROM[el.dataset.revealItem] ? el.dataset.revealItem : 'focus');
		const timeline = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });

		for (const el of items) gsap.set(el, FROM[kind(el)]);
		gsap.set(lines, { '--line': 0 });

		if (sequence) {
			// Un flujo: cada paso llega cuando el anterior ya está
			(parts.length ? parts : items).forEach((el, i) => {
				const at = i * step;
				if (el.hasAttribute('data-reveal-line')) timeline.to(el, { '--line': 1, ease: 'power2.inOut', duration: 0.5 }, at);
				else timeline.to(el, TO[kind(el)], at);
			});
		} else {
			timeline.to(lines, { '--line': 1, ease: 'power3.inOut', duration: 0.9, stagger: 0.12 }, 0);
			items.forEach((el, i) => timeline.to(el, TO[kind(el)], 0.1 + i * 0.12));
		}

		if (compact) timeline.timeScale(1.6);

		ScrollTrigger.create({
			trigger: group,
			start: compact ? 'top bottom' : 'top 82%',
			once: true,
			onEnter: (trigger) => {
				if (compact) pace(timeline, Math.abs(trigger.getVelocity()));
				timeline.play();
			},
		});
	}
}

/** En móvil, al ritmo del dedo: deprisa, más deprisa; a toda velocidad, ya está */
function pace(timeline: gsap.core.Timeline, speed: number) {
	if (speed > FLING) timeline.progress(1);
	else if (speed > FAST) timeline.timeScale(3);
}
