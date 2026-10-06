import {
	Color,
	IcosahedronGeometry,
	Mesh,
	PerspectiveCamera,
	Scene,
	ShaderMaterial,
	SRGBColorSpace,
	WebGLRenderer,
} from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import vertexShader from './mass.vert?raw';
import fragmentShader from './mass.frag?raw';

/**
 * Estado animable de la masa. Son números planos a propósito: se pueden
 * interpolar directamente (la escena de scroll los escribe a través de la
 * pose, ver scripts/scene/pose.ts).
 */
export interface MassState {
	/** Centro de la masa en px CSS, relativo al canvas. */
	x: number;
	y: number;
	/** Diámetro de la esfera base en px CSS (los lóbulos salen hasta ±20%). */
	size: number;
	/** Orientación en radianes (la deriva ambiental se suma encima). */
	rotationX: number;
	rotationY: number;
	rotationZ: number;
	/** Intensidad de la deformación: 0 = esfera, 1 = reposo. */
	deform: number;
	/** Tamaño de los lóbulos: más alto = más lóbulos y más pequeños. */
	frequency: number;
	/** Semilla de la forma. Interpolarla hace que la masa se transforme. */
	shape: number;
	/** Velocidad del movimiento ambiental: 0 = quieta, 1 = reposo. */
	speed: number;
	opacity: number;
	/** Campo de visión de la cámara en grados: más alto = más perspectiva. */
	fov: number;
}

export interface MassQuality {
	/** Subdivisión del icosaedro (vértices ≈ 10·detail²). */
	detail: number;
	maxPixelRatio: number;
	antialias: boolean;
	/** Tope de fotogramas por segundo del bucle ambiental. */
	maxFps: number;
}

export interface Mass {
	readonly canvas: HTMLCanvasElement;
	readonly state: MassState;
	setSize(width: number, height: number): void;
	/** Dibuja un único frame con el estado actual. */
	render(): void;
	/** Pide un frame en el siguiente rAF (sin esperar al límite de fps). */
	requestRender(): void;
	/** Avanza el tiempo ambiental a mano (pruebas, capturas deterministas). */
	advance(seconds: number): void;
	start(): void;
	stop(): void;
	dispose(): void;
}

const CAMERA_DISTANCE = 10;

// Paleta del material (sRGB; Three la convierte a lineal para iluminar)
const COLORS = {
	shadow: '#bd5e53',
	mid: '#f28c7a',
	light: '#ffd6cc',
	highlight: '#fff3ec',
	scatter: '#ff6a4d',
};

export function createMass(quality: MassQuality): Mass {
	const renderer = new WebGLRenderer({
		antialias: quality.antialias,
		alpha: true,
		premultipliedAlpha: true,
		powerPreference: 'high-performance',
	});
	renderer.outputColorSpace = SRGBColorSpace;
	renderer.setClearColor(0x000000, 0);

	const state: MassState = {
		x: 0,
		y: 0,
		size: 0,
		// Orientación de reposo: presenta arriba el hombro redondeado de la forma
		rotationX: 2.6,
		rotationY: 0,
		rotationZ: 0,
		deform: 1,
		frequency: 0.62,
		shape: 12.6,
		speed: 1,
		opacity: 1,
		fov: 30,
	};

	const scene = new Scene();
	const camera = new PerspectiveCamera(state.fov, 1, 0.1, 100);
	camera.position.z = CAMERA_DISTANCE;

	// Icosaedro indexado: reparto uniforme de vértices, sin polos
	const geometry = mergeVertices(
		new IcosahedronGeometry(1, quality.detail).deleteAttribute('normal').deleteAttribute('uv'),
	);

	const material = new ShaderMaterial({
		vertexShader,
		fragmentShader,
		transparent: true,
		premultipliedAlpha: true,
		uniforms: {
			uTime: { value: 0 },
			uDeform: { value: state.deform },
			uFrequency: { value: state.frequency },
			uShape: { value: state.shape },
			uOpacity: { value: state.opacity },
			uShadow: { value: new Color(COLORS.shadow) },
			uMid: { value: new Color(COLORS.mid) },
			uLight: { value: new Color(COLORS.light) },
			uHighlight: { value: new Color(COLORS.highlight) },
			uScatter: { value: new Color(COLORS.scatter) },
		},
	});

	const mesh = new Mesh(geometry, material);
	// Y se aplica la última: el balanceo gira sobre el eje vertical del mundo,
	// así lo que queda arriba (la silueta que asoma) sigue arriba.
	mesh.rotation.order = 'YXZ';
	scene.add(mesh);

	let width = 1;
	let height = 1;
	let frame = 0;
	let last = 0;
	// Tiempo ambiental acumulado (avanza a `state.speed`)
	let ambient = 0;

	function update() {
		const u = material.uniforms;
		// La forma oscila alrededor de su reposo en vez de avanzar sin fin:
		// parece viva pero nunca deja de ser ella misma (ni cambia la composición).
		u.uTime.value = Math.sin(ambient * 0.11) * 0.1 + Math.sin(ambient * 0.047) * 0.06;
		u.uDeform.value = state.deform;
		u.uFrequency.value = state.frequency;
		u.uShape.value = state.shape;
		u.uOpacity.value = state.opacity;

		if (camera.fov !== state.fov) {
			camera.fov = state.fov;
			camera.updateProjectionMatrix();
		}

		// Conversión px → unidades de mundo en el plano z = 0
		const worldPerPx =
			(2 * CAMERA_DISTANCE * Math.tan((camera.fov * Math.PI) / 360)) / height;
		mesh.position.set((state.x - width / 2) * worldPerPx, -(state.y - height / 2) * worldPerPx, 0);

		// Respiración y balanceo: lentos, de poca amplitud y acotados
		const breath = 1 + Math.sin(ambient * 0.42) * 0.012;
		mesh.scale.setScalar((state.size / 2) * worldPerPx * breath);
		mesh.rotation.set(
			state.rotationX + Math.sin(ambient * 0.031) * 0.06,
			state.rotationY + Math.sin(ambient * 0.043) * 0.2,
			state.rotationZ + Math.sin(ambient * 0.037) * 0.05,
		);

		mesh.visible = state.opacity > 0.001 && state.size > 0;
	}

	function render() {
		update();
		renderer.render(scene, camera);
	}

	const minFrameMs = 1000 / quality.maxFps;
	// Hay un cambio de estado pendiente (p. ej. scroll): se dibuja en el
	// siguiente frame aunque el movimiento ambiental esté limitado de fps
	let dirty = false;
	let oneOff = 0;

	function tick(now: number) {
		frame = requestAnimationFrame(tick);
		if (!dirty && last && now - last < minFrameMs - 1) return;
		dirty = false;
		const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
		last = now;
		ambient += dt * state.speed;
		render();
	}

	return {
		canvas: renderer.domElement,
		state,
		setSize(w, h) {
			width = Math.max(1, w);
			height = Math.max(1, h);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.maxPixelRatio));
			renderer.setSize(width, height, false);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
		},
		render,
		requestRender() {
			if (frame) {
				dirty = true;
			} else if (!oneOff) {
				oneOff = requestAnimationFrame(() => {
					oneOff = 0;
					render();
				});
			}
		},
		advance(seconds) {
			ambient += seconds * state.speed;
		},
		start() {
			if (frame) return;
			last = 0;
			frame = requestAnimationFrame(tick);
		},
		stop() {
			cancelAnimationFrame(frame);
			frame = 0;
			// Un cambio de estado pendiente se dibuja igualmente: el canvas debe
			// quedarse con la última pose, no con la anterior (al saltar de golpe
			// al caso, p. ej. con #trabajo, asomaría la masa de reposo congelada)
			if (dirty) {
				dirty = false;
				render();
			}
		},
		dispose() {
			cancelAnimationFrame(frame);
			cancelAnimationFrame(oneOff);
			frame = 0;
			geometry.dispose();
			material.dispose();
			renderer.dispose();
		},
	};
}
