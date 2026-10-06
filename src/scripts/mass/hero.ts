import { onPoseChange, pose } from '../scene/pose';
import { createMass, type MassQuality } from './mass';

/** Sin WebGL (o si falla el contexto) devuelve null y se queda el póster. */
function tryCreateMass(quality: MassQuality) {
	try {
		return createMass(quality);
	} catch {
		return null;
	}
}

/**
 * Monta la masa 3D en el Hero, relevando al póster (su primer frame).
 *
 *   póster visible → WebGL listo → primer frame (idéntico) → el canvas
 *   aparece encima → el póster se oculta
 *
 * Si WebGL no está disponible o se pierde el contexto, el póster sigue ahí:
 * la página nunca se queda con un hueco.
 *
 * El primer frame es el de tiempo ambiental 0, el mismo que se exportó como
 * póster. Si cambian la forma, el material, la pose de reposo o --mass-size,
 * hay que volver a exportar los pósters (ver __exportPoster más abajo).
 */
export async function mountHeroMass(hero: HTMLElement) {
	const atmosphere = hero.querySelector<HTMLElement>('.atmosphere');
	const placeholder = hero.querySelector<HTMLElement>('.mass-placeholder');
	if (!atmosphere || !placeholder) return;

	const compact = matchMedia('(max-width: 48rem), (pointer: coarse)').matches;

	// Móvil / táctil: menos subdivisión y resolución; misma silueta
	const quality: MassQuality = {
		detail: compact ? 44 : 80,
		maxPixelRatio: compact ? 1.5 : 2,
		antialias: true,
		// El movimiento ambiental es tan lento que 30 fps es indistinguible
		// de 60 y reduce a la mitad el trabajo de GPU (y la batería).
		maxFps: 30,
	};
	const mass = tryCreateMass(quality);
	if (!mass) return;

	const { canvas, state } = mass;
	canvas.className = 'mass-canvas';
	canvas.setAttribute('aria-hidden', 'true');
	atmosphere.insertBefore(canvas, placeholder.nextSibling);

	// Reposo = la caja del placeholder (sin transformaciones), así la
	// composición se sigue definiendo en CSS y la masa hereda su sitio exacto.
	// Sobre el reposo se aplica la pose de la escena de scroll (si la hay).
	const base = { rotationX: state.rotationX, rotationY: state.rotationY, shape: state.shape };
	const rest = { x: 0, y: 0, size: 0 };

	// Solo en desarrollo, desde la consola:
	//   __mass            ajustar la masa en vivo
	//   __exportPoster()  regenerar el póster con la composición actual
	//                     (escritorio → mass-poster.png, móvil → mass-poster-compact.png)
	if (import.meta.env.DEV) {
		const exportPoster = async () => {
			const { renderPoster, downloadPoster } = await import('./poster');
			const narrow = matchMedia('(max-width: 48rem)').matches;
			// Diámetro máximo de la masa en esa composición (--mass-size) a 2×
			const massPx = narrow ? 832 : 1152;
			const composition = { width: canvas.clientWidth, height: canvas.clientHeight, ...rest };
			downloadPoster(renderPoster(composition, quality, massPx), narrow ? 'mass-poster-compact.png' : 'mass-poster.png');
		};
		Object.assign(window, { __mass: mass, __exportPoster: exportPoster });
	}

	function applyPose() {
		state.x = rest.x + pose.dx * atmosphere.clientWidth;
		state.y = rest.y + pose.dy * atmosphere.clientHeight;
		state.size = rest.size * pose.scale;
		state.deform = pose.deform;
		state.rotationX = base.rotationX + pose.rotateX;
		state.rotationY = base.rotationY + pose.rotateY;
		state.shape = base.shape + pose.shape;
		state.fov = pose.fov;
	}

	function layout() {
		mass.setSize(canvas.clientWidth, canvas.clientHeight);
		rest.size = placeholder.offsetWidth;
		rest.x = placeholder.offsetLeft + placeholder.offsetWidth / 2;
		rest.y = placeholder.offsetTop + placeholder.offsetHeight / 2;
		applyPose();
		// Redimensionar vacía el canvas: se repinta ya para no parpadear
		mass.render();
	}

	layout();
	// El canvas sigue al tamaño de la atmósfera, así que basta con observarlo a él
	new ResizeObserver(layout).observe(canvas);

	// El bucle ambiental solo corre si el canvas está en pantalla y la masa
	// dentro de él (tras la retirada del Insight sale por abajo: nada que
	// dibujar). Empieza tras el relevo, para que el primer frame sea el póster.
	let canvasInView = false;
	let ambient = false;

	function syncLoop() {
		const onStage = state.y - state.size * 0.62 < canvas.clientHeight;
		if (ambient && canvasInView && onStage) mass.start();
		else mass.stop();
	}

	onPoseChange(() => {
		applyPose();
		mass.requestRender();
		syncLoop();
	});

	// Relevo solo cuando el póster ha terminado su entrada (sube y aparece:
	// el canvas no sigue esa transformación)
	await Promise.all(placeholder.getAnimations().map((a) => a.finished.catch(() => {})));
	mass.render();
	hero.classList.add('has-mass');

	ambient = true;
	new IntersectionObserver(([entry]) => {
		canvasInView = entry.isIntersecting;
		syncLoop();
	}).observe(canvas);

	canvas.addEventListener('webglcontextlost', () => {
		mass.stop();
		hero.classList.remove('has-mass');
	});
}
