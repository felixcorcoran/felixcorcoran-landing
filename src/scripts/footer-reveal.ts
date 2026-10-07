import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COMPACT, WIDE } from './motion';

gsap.registerPlugin(ScrollTrigger);

/**
 * La transición al footer fuera de la landing (/contacto, legales): la misma
 * idea que la escena final (scripts/action.ts), pero en flujo normal, sin
 * escenario fijo ni recorrido extra. Mientras el footer sube:
 *
 *       30 ──────── 90 %  la firma se enfoca y se asienta
 *        35 ─────── 90 %  el contenido de la página se disuelve y se aleja
 *                         (tarde: el final del contenido, como el WhatsApp
 *                         en móvil, tiene que poder leerse y pulsarse)
 *              60 %       la píldora de navegación se retira
 *            65 ── 90 %   la letra pequeña (correo, legales)
 *                75 ── 100 %  Inicio · Trabajo · Contacto, uno a uno: llegan
 *                         cuando la píldora ya no está, nunca las dos a la vez
 *
 * (% del recorrido: del footer asomando por abajo a quedar establecido.)
 * Todo depende de la posición del scroll: al subir se deshace igual.
 */
export function initFooterReveal(footer: HTMLElement, nav: HTMLElement | null) {
	const content = gsap.utils.toArray<HTMLElement>('main > *');
	const brand = footer.querySelector<HTMLElement>('[data-footer-part="brand"]');
	const fine = gsap.utils.toArray<HTMLElement>('[data-footer-part="fine"]', footer);
	const links = gsap.utils.toArray<HTMLElement>('[data-footer-part="nav"] a', footer);
	if (!brand) return;

	gsap.matchMedia().add({ compact: COMPACT, wide: WIDE }, (context) => {
		// Desenfoque solo en el diseño amplio (en móvil, opacidad y movimiento)
		const blur = (px: number): gsap.TweenVars => (context.conditions?.compact ? {} : { filter: `blur(${px}px)` });

		gsap.set(brand, { opacity: 0, ...blur(14), scale: 0.97, y: 24 });
		gsap.set(fine, { opacity: 0, ...blur(4) });
		gsap.set(links, { opacity: 0, ...blur(6), y: 8 });

		const timeline = gsap.timeline({
			defaults: { ease: 'none' },
			scrollTrigger: {
				trigger: footer,
				start: 'top bottom',
				end: 'bottom bottom',
				scrub: 0.35,
				invalidateOnRefresh: true,
				onUpdate: sync,
				onRefresh: sync,
			},
		});

		timeline
			.to({}, { duration: 1 }, 0)
			.to(content, { opacity: 0, ...blur(10), y: -40, ease: 'power1.in', duration: 0.55 }, 0.35)
			.to(brand, { opacity: 1, ...blur(0), scale: 1, y: 0, ease: 'power2.out', duration: 0.6 }, 0.3)
			.to(fine, { opacity: 1, ...blur(0), ease: 'power1.out', duration: 0.25 }, 0.65)
			.to(links, { opacity: 1, ...blur(0), y: 0, ease: 'power2.out', duration: 0.15, stagger: 0.05 }, 0.75);

		// La píldora se retira antes de que lleguen los enlaces del footer
		function sync(trigger?: ScrollTrigger) {
			nav?.classList.toggle('is-away', (trigger?.progress ?? 0) >= 0.6);
		}
		sync(timeline.scrollTrigger);

		// Teclado: si se llega con Tab a un enlace del footer aún invisible, el
		// scroll va al final, donde ya está en escena
		const controller = new AbortController();
		for (const link of footer.querySelectorAll('a')) {
			link.addEventListener(
				'focus',
				() =>
					(timeline.scrollTrigger?.progress ?? 1) < 0.99 &&
					setTimeout(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })),
				{ signal: controller.signal },
			);
		}

		return () => {
			controller.abort();
			nav?.classList.remove('is-away');
		};
	});
}
