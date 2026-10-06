/**
 * Pose de la masa dentro de la escena, en valores relativos al reposo del
 * Hero. La escribe la timeline de scroll (scene.ts) y la leen la masa 3D
 * (carga diferida) y los elementos CSS que la acompañan (resplandor y
 * placeholder). Así todo responde al mismo progreso aunque WebGL llegue tarde
 * o no llegue.
 */
export interface Pose {
	/** Desplazamiento desde el reposo, en fracción del ancho / alto del escenario. */
	dx: number;
	dy: number;
	/** Multiplicador del tamaño de reposo. */
	scale: number;
	/** Intensidad de la deformación (1 = reposo). */
	deform: number;
	/** Rotación añadida a la orientación de reposo, en radianes. */
	rotateX: number;
	rotateY: number;
	/** Desplazamiento de la semilla de la forma: cambia la silueta. */
	shape: number;
	/** Campo de visión de la cámara en grados (más alto = más cerca y profunda). */
	fov: number;
}

export const pose: Pose = {
	dx: 0,
	dy: 0,
	scale: 1,
	deform: 1,
	rotateX: 0,
	rotateY: 0,
	shape: 0,
	fov: 30,
};

const listeners = new Set<() => void>();

export function onPoseChange(listener: () => void) {
	listeners.add(listener);
}

export function notifyPose() {
	for (const listener of listeners) listener();
}
