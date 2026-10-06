import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Acto 06 — Acción, y el cierre de la landing: CTA → footer.
 *
 * Con movimiento, una única timeline con scrub 1:1 recorre la escena final
 * (unidades ≈ 1svh de scroll; la pausa y la transición salen del CSS):
 *
 *   0 ─────── 100          la CTA sube desde el silencio y la pregunta se enfoca
 *   100 ═══ +hold          pausa: la CTA completa y quieta, para leer y decidir
 *   después, en la transición (% de --finale-leave):
 *     0 ─── 32 %           la frase y los botones pierden foco y suben
 *       8 ─────── 70 %     la pregunta se desenfoca, se aleja y se desvanece
 *        25 ─────── 85 %   en el hueco que deja, la firma se enfoca y se asienta
 *              42 %        la píldora de navegación se retira (con margen:
 *                          los enlaces del footer ocuparán su misma banda)
 *            55 ── 85 %    la letra pequeña: la CTA y el correo
 *              62 ─── 100 %  Inicio · Trabajo · Contacto se revelan uno a uno
 *
 * El footer no entra después: está detrás desde el principio de la
 * transición (ver Footer.astro). Todo depende de la posición del scroll, así
 * que al subir la escena se deshace igual que se hizo.
 *
 * Con movimiento reducido no se llama: la CTA y el footer quedan en flujo
 * normal (el footer retira la píldora por su cuenta).
 */
export function initAction(section: HTMLElement) {
	const footer = document.querySelector<HTMLElement>('[data-footer]');
	const nav = document.querySelector<HTMLElement>('[data-nav]');
	const stage = section.querySelector<HTMLElement>('[data-action-part="stage"]');
	const title = section.querySelector<HTMLElement>('[data-action-part="title"]');
	const follow = gsap.utils.toArray<HTMLElement>('[data-action-part="follow"]', section);
	const brand = footer?.querySelector<HTMLElement>('[data-footer-part="brand"]');
	// La letra pequeña: «Solicitar auditoría gratuita» (se queda en la firma) y el correo
	const mail = footer ? gsap.utils.toArray<HTMLElement>('[data-footer-part="fine"]', footer) : [];
	const links = footer ? gsap.utils.toArray<HTMLElement>('[data-footer-part="nav"] a', footer) : [];
	if (!footer || !stage || !title || !follow.length || !brand) return;

	// Se rehace al cruzar el punto de corte: cambian la pausa y la transición
	gsap.matchMedia().add({ compact: '(max-width: 48rem)', wide: '(min-width: 48.0625rem)' }, () =>
		finale({ section, stage, title, follow, footer, brand, mail, links, nav }),
	);
}

interface FinaleParts {
	section: HTMLElement;
	stage: HTMLElement;
	title: HTMLElement;
	follow: HTMLElement[];
	footer: HTMLElement;
	brand: HTMLElement;
	mail: HTMLElement[];
	links: HTMLElement[];
	nav: HTMLElement | null;
}

function finale({ section, stage, title, follow, footer, brand, mail, links, nav }: FinaleParts) {
	const root = document.documentElement;
	root.classList.add('finale-on');

	// Pausa (Action.astro) y transición (Footer.astro) en svh
	const hold = parseFloat(getComputedStyle(section).getPropertyValue('--action-hold'));
	const leave = parseFloat(getComputedStyle(root).getPropertyValue('--finale-leave'));
	const leaveStart = 100 + hold;
	const total = leaveStart + leave;
	const at = (fraction: number) => leaveStart + leave * fraction;
	const svh = (amount: number) => () => (stage.clientHeight * amount) / 100;

	const timeline = gsap.timeline({
		defaults: { ease: 'none' },
		scrollTrigger: {
			trigger: section,
			// De que la sección asoma a que el footer queda establecido (el final
			// de la página)
			start: 'top bottom',
			end: 'bottom bottom',
			scrub: true,
			invalidateOnRefresh: true,
			// También al refrescar: al recargar a mitad (o al final) de la escena,
			// ScrollTrigger coloca la timeline sin pasar por onUpdate
			onUpdate: sync,
			onRefresh: sync,
		},
	});

	// Estados de partida
	gsap.set(title, { opacity: 0.15, filter: 'blur(14px)', y: 24, scale: 0.98 });
	gsap.set(follow, { opacity: 0, filter: 'blur(6px)', y: 12 });
	gsap.set(brand, { opacity: 0, filter: 'blur(14px)', scale: 0.97, y: svh(3) });
	gsap.set(mail, { opacity: 0, filter: 'blur(4px)' });
	gsap.set(links, { opacity: 0, filter: 'blur(6px)', letterSpacing: '0.12em' });

	timeline
		// Duración total: toda la sección
		.to({}, { duration: total }, 0)

		// ---------- Entrada: la pregunta sube desde el silencio y se enfoca ----------
		.to(title, { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, ease: 'power1.out', duration: 47 }, 25)
		.to(follow, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 22, stagger: 8 }, 62)

		// ---------- Pausa (100 → leaveStart): nada cambia ----------

		// ---------- Transición: la CTA se disuelve de abajo arriba ----------
		.to(follow, { opacity: 0, filter: 'blur(6px)', y: svh(-2), ease: 'power1.in', duration: leave * 0.28, stagger: leave * 0.04 }, at(0))
		.to(title, { opacity: 0, filter: 'blur(10px)', y: svh(-6), scale: 0.96, ease: 'power1.in', duration: leave * 0.62 }, at(0.08))

		// ---------- …y detrás, la firma ----------
		.to(brand, { opacity: 1, filter: 'blur(0px)', y: 0, scale: 1, ease: 'power2.out', duration: leave * 0.6 }, at(0.25))
		.to(mail, { opacity: 1, filter: 'blur(0px)', ease: 'power1.out', duration: leave * 0.3 }, at(0.55))
		// La navegación se revela: desenfoque → foco y el tracking se asienta
		.to(links, { opacity: 1, filter: 'blur(0px)', letterSpacing: '-0.015em', ease: 'power2.out', duration: leave * 0.24, stagger: leave * 0.07 }, at(0.62));

	// Estados discretos, en función de la posición del scroll (reversibles):
	//   la píldora se retira · la CTA deja de recibir clics · el footer los recibe
	function sync(trigger?: ScrollTrigger) {
		const time = (trigger?.progress ?? 0) * total;
		nav?.classList.toggle('is-away', time >= at(0.42));
		section.classList.toggle('is-leaving', time >= at(0.3));
		footer.classList.toggle('is-open', time >= at(0.8));
	}
	sync(timeline.scrollTrigger);
	const now = () => (timeline.scrollTrigger?.progress ?? 0) * total;

	// Teclado: si se llega con Tab a una parte que no está en escena, el
	// scroll va a donde sí lo está (tras el scroll propio del navegador)
	const controller = new AbortController();
	const scrollToTime = (time: number) =>
		setTimeout(() => {
			const trigger = timeline.scrollTrigger;
			if (!trigger) return;
			const top = trigger.start + (time / timeline.duration()) * (trigger.end - trigger.start);
			if (Math.abs(scrollY - top) > 2) window.scrollTo({ top, behavior: 'instant' });
		});

	for (const link of section.querySelectorAll('a')) {
		link.addEventListener('focus', () => now() > leaveStart && scrollToTime(100 + hold / 2), {
			signal: controller.signal,
		});
	}
	for (const link of footer.querySelectorAll('a')) {
		link.addEventListener('focus', () => now() < total - 1 && scrollToTime(total), {
			signal: controller.signal,
		});
	}

	return () => {
		controller.abort();
		root.classList.remove('finale-on');
		nav?.classList.remove('is-away');
		section.classList.remove('is-leaving');
		footer.classList.remove('is-open');
	};
}
