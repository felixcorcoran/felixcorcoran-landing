import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COMPACT, WIDE } from './motion';

gsap.registerPlugin(ScrollTrigger);

/**
 * La transición al footer fuera de la landing (/contacto, legales): la misma
 * que la escena final de la landing (scripts/action.ts), pero corta. Cuando
 * se llega al final del contenido, el footer ya está detrás (Footer.astro,
 * html.footer-reveal) y en el tramo --finale-leave:
 *
 *   0 ─────────── 60 %       el contenido se disuelve mientras sube
 *       20 ─────────── 80 %  en el hueco que deja, la firma se enfoca y se asienta
 *              40 %          la píldora de navegación se retira
 *            50 ── 80 %      la letra pequeña (correo, legales)
 *              60 ─── 100 %  Inicio · Trabajo · Contacto, uno a uno: llegan
 *                            cuando la píldora ya no está, nunca las dos a la vez
 *
 * Todo depende de la posición del scroll: al subir se deshace igual.
 */
export function initFooterReveal(footer: HTMLElement, nav: HTMLElement | null) {
	const root = document.documentElement;
	const content = gsap.utils.toArray<HTMLElement>('main > *');
	const brand = footer.querySelector<HTMLElement>('[data-footer-part="brand"]');
	const fine = gsap.utils.toArray<HTMLElement>('[data-footer-part="fine"]', footer);
	const links = gsap.utils.toArray<HTMLElement>('[data-footer-part="nav"] a', footer);
	if (!brand) return;

	root.classList.add('footer-reveal');

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
				// El tramo: de que el footer cubre la pantalla (el contenido acaba
				// de terminar) a que queda establecido (el final de la página)
				start: 'top top',
				end: 'bottom bottom',
				scrub: 0.35,
				invalidateOnRefresh: true,
				onUpdate: sync,
				onRefresh: sync,
			},
		});

		timeline
			.to({}, { duration: 1 }, 0)
			.to(content, { opacity: 0, ...blur(10), scale: 0.98, ease: 'power1.in', duration: 0.6 }, 0)
			.to(brand, { opacity: 1, ...blur(0), scale: 1, y: 0, ease: 'power2.out', duration: 0.6 }, 0.2)
			.to(fine, { opacity: 1, ...blur(0), ease: 'power1.out', duration: 0.3 }, 0.5)
			.to(links, { opacity: 1, ...blur(0), y: 0, ease: 'power2.out', duration: 0.24, stagger: 0.07 }, 0.6);

		// Estados discretos (reversibles): la píldora se retira antes de que
		// lleguen los enlaces del footer, y el footer recibe los clics al final
		function sync(trigger?: ScrollTrigger) {
			const progress = trigger?.progress ?? 0;
			nav?.classList.toggle('is-away', progress >= 0.4);
			footer.classList.toggle('is-open', progress >= 0.8);
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
			footer.classList.remove('is-open');
		};
	});
}
