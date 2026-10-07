import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { notifyPose, pose } from './pose';

gsap.registerPlugin(ScrollTrigger);

// En móvil, mostrar/ocultar la barra del navegador no debe recalcular nada:
// las medidas de la escena van en svh, que no cambian con la barra.
ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * Escena 1 — Hero → Problema → Insight.
 *
 * Scroll nativo → ScrollTrigger (scrub con 0.6 s de inercia) → una única timeline que mueve a
 * la vez el titular, los mensajes y la pose de la masa. El escenario se queda
 * fijo con position: sticky (nativo: no salta en iOS al aparecer o
 * desaparecer la barra) mientras el contenedor alto aporta el recorrido.
 *
 * Duración: 22.4 unidades ≈ 16svh de scroll cada una (ver --scene-length).
 * El scroll es siempre el del navegador: las pausas son recorrido en el que
 * la escena se queda quieta, nunca un freno.
 *
 * Ritmo: movimiento → transformación → pausa. Cada mensaje tiene una zona
 * de asentamiento (═══) en la que nada cambia: el texto está en foco y la
 * masa quieta (solo su respiración ambiental). La masa se mueve entre
 * mensajes, nunca mientras se lee uno. El scroll sigue siendo nativo: la
 * pausa es recorrido en el que la escena se queda quieta, no un bloqueo.
 *
 *   0 ──── 1.6                  el titular del Hero se aleja y pierde el foco
 *   0 ─────── 2.2               masa A → B: sube, crece, se va a la izquierda
 *     1.1 ─ 2.2 ═══ 3.2 ─ 4.0   problema 1 (derecha)            pausa ligera
 *   3.2 ─────── 5.4             masa → B': cruza a la derecha, gana peso
 *     4.3 ─ 5.4 ═══ 6.4 ─ 7.2   problema 2 (izquierda)          pausa ligera
 *   6.4 ─────── 8.6             masa → C: se centra y se acerca
 *     7.5 ─ 8.6 ═══ 9.6 ─ 10.4  problema 3 (centro)             pausa ligera
 *   9.6 ────────────── 13.2     masa → clímax: gran cúpula en la mitad inferior
 *     12 ─ 13.2 ═════ 15.2 ─ 15.9   «No necesitas más tecnología.»   pausa fuerte
 *   15.4 ───── 16.9             la masa se condensa: más pequeña, más calmada, más ordenada
 *     15.7 ─ 16.9               «Necesitas la tecnología adecuada.»
 *          16.9 ─ 17.6 ════ 19.2    subrayado coral y pausa: el momento clave
 *   19.2 ─────────────── 22     la masa se retira: se hace pequeña y sale por abajo
 *   22 ─ 22.4                   calma: queda solo la frase, antes del caso
 */
export function initScene(scene: HTMLElement) {
	const stage = scene.querySelector<HTMLElement>('[data-scene-part="stage"]');
	const rest = scene.querySelector<HTMLElement>('[data-scene-rest]');
	const heroCopy = scene.querySelector<HTMLElement>('[data-scene-part="hero-copy"]');
	const followers = gsap.utils.toArray<HTMLElement>('[data-scene-part="follow-mass"]', scene);
	const glow = scene.querySelector<HTMLElement>('.glow');
	const statements = gsap.utils.toArray<HTMLElement>('[data-scene-part="statement"]', scene);
	const insightNo = scene.querySelector<HTMLElement>('[data-scene-part="insight-1"]');
	const insightYes = scene.querySelector<HTMLElement>('[data-scene-part="insight-2"]');
	const accent = scene.querySelector<HTMLElement>('[data-scene-part="insight-accent"]');
	if (!stage || !rest || !heroCopy || statements.length !== 3 || !insightNo || !insightYes || !accent) return;

	scene.classList.add('scene-on');

	// El resplandor y el placeholder acompañan a la masa (compositor: solo transform)
	function applyPose() {
		const x = pose.dx * stage.clientWidth;
		const y = pose.dy * stage.clientHeight;
		for (const el of followers) {
			el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${pose.scale})`;
		}
		notifyPose();
	}

	const vh = (fraction: number) => () => stage.clientHeight * fraction;

	// Preguntas: el crecimiento depende de la proporción de la pantalla. En
	// móvil la masa de reposo ya ocupa casi todo el ancho, así que crece menos.
	const growth = () => gsap.utils.clamp(0.35, 1, (stage.clientWidth / stage.clientHeight - 0.5) / 0.8);
	const grow = (scale: number) => () => 1 + (scale - 1) * growth();

	// Clímax y retirada: se definen en términos de pantalla (diámetro y borde
	// superior) y se traducen a la pose relativa al reposo del Hero.
	function place(diameter: () => number, top: () => number) {
		const restSize = () => rest.offsetWidth;
		const restCenter = () => rest.offsetTop + rest.offsetWidth / 2;
		return {
			scale: () => diameter() / restSize(),
			dy: () => (top() + diameter() / 2 - restCenter()) / stage.clientHeight,
		};
	}

	const w = () => stage.clientWidth;
	const h = () => stage.clientHeight;

	// Máxima presencia: cúpula enorme que llena la mitad inferior. Su borde
	// nunca sube más allá de un margen bajo la frase (pantallas bajas).
	const phraseBottom = () => insightYes.offsetTop + insightYes.offsetHeight;
	const climaxDiameter = () => Math.min(1.5 * w(), 1.25 * h());
	const climaxTop = () => Math.max(h() * 0.53, phraseBottom() + h() * 0.04);
	const climax = place(climaxDiameter, climaxTop);
	// «La tecnología adecuada»: la masa se condensa. Pierde tamaño y
	// deformación (de la complejidad al orden) y se asienta bajo la frase, de
	// modo que el subrayado de «adecuada» destaca sobre crema, sin ella detrás.
	const condensedDiameter = () => Math.min(0.62 * w(), 0.5 * h(), climaxDiameter() * 0.55);
	const settled = place(condensedDiameter, () => Math.max(h() * 0.6, phraseBottom() + h() * 0.08));
	// Retirada: vuelve a su tamaño de reposo y sale por debajo del escenario
	const retreat = place(() => rest.offsetWidth * 0.9, vh(1.08));

	// Lenguaje de cada acto: el Problema pasa (desenfoque + desplazamiento
	// vertical); el Insight emerge de la profundidad (desenfoque + escala).
	gsap.set(statements, { opacity: 0, filter: 'blur(16px)', y: vh(0.04) });
	gsap.set([insightNo, insightYes], { opacity: 0, filter: 'blur(20px)', scale: 1.06 });
	gsap.set(accent, { '--draw': 0 });

	const timeline = gsap.timeline({
		defaults: { ease: 'none' },
		onUpdate: applyPose,
		scrollTrigger: {
			trigger: scene,
			start: 'top top',
			end: 'bottom bottom',
			// Un poco de inercia: los saltos de la rueda del ratón se suavizan
			// en lugar de verse a golpes
			scrub: 0.6,
			invalidateOnRefresh: true,
			onUpdate: skipJumps,
		},
	});

	// Un salto (el ancla #trabajo, la barra de scroll, Inicio/Fin) no es
	// scroll: sin esto, la inercia reproduciría toda la escena de golpe en
	// 0.6 s y la masa bailaría detrás de la navegación. Se coloca al instante.
	let lastScroll = scrollY;
	function skipJumps(trigger: ScrollTrigger) {
		const scroll = trigger.scroll();
		if (Math.abs(scroll - lastScroll) > innerHeight) trigger.getTween()?.progress(1);
		lastScroll = scroll;
	}

	// ---------- Masa ----------
	// La silueta cambia sobre todo por deformación y forma; la rotación es
	// mínima (~40º en toda la escena) para que se lea como escultura que se
	// transforma, no como un objeto 3D girando.
	const physical = 'sine.inOut';
	timeline
		// Siempre al lado contrario del mensaje: izquierda, derecha, centro.
		// Cada movimiento empieza cuando el mensaje anterior se va y termina
		// cuando el siguiente está en foco: durante la lectura, quieta.
		.to(pose, { dx: -0.13, dy: -0.14, scale: grow(1.2), deform: 1.12, rotateY: 0.08, ease: physical, duration: 2.2 }, 0)
		.to(pose, { dx: 0.15, dy: -0.18, scale: grow(1.38), deform: 1.28, rotateY: 0.22, shape: 0.12, ease: physical, duration: 2.2 }, 3.2)
		.to(pose, { dx: 0, dy: -0.2, scale: grow(1.55), deform: 1.42, rotateY: 0.34, shape: 0.25, fov: 34, ease: physical, duration: 2.2 }, 6.4)
		// Clímax: crece hasta su máximo y se asienta abajo, dejando el cielo a la frase
		.to(pose, { dx: 0, ...climax, deform: 1.68, rotateY: 0.52, shape: 0.4, fov: 38, ease: physical, duration: 3.6 }, 9.6)
		// Mientras se lee la primera frase la masa apenas respira: el texto manda
		.to(pose, { deform: 1.72, rotateY: 0.56, ease: physical, duration: 2 }, 13.2)
		// Con la segunda frase se condensa: de la complejidad al orden
		.to(pose, { ...settled, deform: 0.55, rotateY: 0.6, shape: 0.46, fov: 32, ease: physical, duration: 1.5 }, 15.4)
		// Retirada (tras la pausa del subrayado): pierde tamaño, deformación y
		// cercanía, y sale por abajo
		// Curva simétrica y repartida: con power2.in el encogimiento se
		// concentraba al final y, al subir, la masa reaparecía de golpe
		.to(pose, { ...retreat, deform: 0.8, rotateY: 0.7, shape: 0.5, fov: 31, ease: 'sine.inOut', duration: 2.8 }, 19.2);

	// El resplandor se apaga con la retirada: si no, su borde quedaría como
	// un tinte coral al pie del escenario, justo encima del caso
	if (glow) timeline.to(glow, { opacity: 0, ease: 'sine.inOut', duration: 2.8 }, 19.2);

	// ---------- Titular del Hero: se aleja y pierde el foco ----------
	timeline.to(heroCopy, { y: vh(-0.08), opacity: 0, filter: 'blur(10px)', ease: 'power1.in', duration: 1.6 }, 0);

	// ---------- Preguntas: cada mensaje entra en foco, se lee y se desenfoca ----------
	// Entra en 1.1, pausa de 1 unidad en foco, sale en 0.8
	const beats: Array<[enter: number, leave: number]> = [
		[1.1, 3.2],
		[4.3, 6.4],
		[7.5, 9.6],
	];

	statements.forEach((statement, i) => {
		const [enter, leave] = beats[i];
		timeline
			.to(statement, { opacity: 1, filter: 'blur(0px)', y: 0, ease: 'power2.out', duration: 1.1 }, enter)
			.to(statement, { opacity: 0, filter: 'blur(12px)', y: vh(-0.04), ease: 'power1.in', duration: 0.8 }, leave);
	});

	// ---------- Insight: las frases emergen de la profundidad, sin desplazarse ----------
	timeline
		.to(insightNo, { opacity: 1, filter: 'blur(0px)', scale: 1, ease: 'power2.out', duration: 1.2 }, 12)
		.to(insightNo, { opacity: 0, filter: 'blur(14px)', scale: 0.96, ease: 'power1.in', duration: 0.7 }, 15.2)
		.to(insightYes, { opacity: 1, filter: 'blur(0px)', scale: 1, ease: 'power2.out', duration: 1.2 }, 15.7)
		.to(accent, { '--draw': 1, ease: 'power2.inOut', duration: 0.7 }, 16.9)
		// Calma final: la frase se queda sola sobre el crema antes del caso
		.to({}, { duration: 0.4 }, 22);

	applyPose();

	// Solo en desarrollo: inspeccionar la escena desde la consola
	if (import.meta.env.DEV) Object.assign(window, { __scene: { timeline, ScrollTrigger, pose } });
}
