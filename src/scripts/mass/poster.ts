import { createMass, type MassQuality } from './mass';

/** Composición de la masa en reposo, tal como la ve la página. */
export interface PosterComposition {
	/** Tamaño del canvas en px CSS. */
	width: number;
	height: number;
	/** Centro y diámetro de la masa en reposo, en px CSS. */
	x: number;
	y: number;
	size: number;
}

/** Lado del póster respecto al diámetro: los lóbulos salen de la esfera base. */
export const POSTER_SCALE = 1.4;

/**
 * Solo desarrollo. Dibuja el primer frame de la masa (tiempo ambiental 0) en
 * su pose de reposo, con la MISMA perspectiva que tiene en la página, y lo
 * recorta en un cuadrado de POSTER_SCALE × el diámetro, con transparencia.
 *
 * La perspectiva depende de dónde queda la masa en el canvas (abajo, fuera
 * del eje de la cámara). Para no cambiarla, se amplía el canvas de forma
 * simétrica alrededor del eje y se abre el campo de visión en la misma
 * proporción: cada punto proyecta igual, solo que ahora cabe la masa entera.
 *
 * `massPx`: diámetro de la masa en el póster, en px de imagen.
 */
export function renderPoster(rest: PosterComposition, quality: MassQuality, massPx: number) {
	const mass = createMass({ ...quality, maxPixelRatio: 1 });
	const { state } = mass;
	const scale = massPx / rest.size;
	const half = (POSTER_SCALE * rest.size) / 2;

	// Semiancho y semialto del canvas ampliado, medidos desde el eje (px CSS)
	const dx = Math.max(Math.abs(rest.x - half - rest.width / 2), Math.abs(rest.x + half - rest.width / 2));
	const dy = Math.max(Math.abs(rest.y - half - rest.height / 2), Math.abs(rest.y + half - rest.height / 2));
	const fov = (2 * Math.atan((Math.tan((state.fov * Math.PI) / 360) * 2 * dy) / rest.height) * 180) / Math.PI;

	mass.setSize(2 * dx * scale, 2 * dy * scale);
	Object.assign(state, {
		x: (rest.x - rest.width / 2 + dx) * scale,
		y: (rest.y - rest.height / 2 + dy) * scale,
		size: massPx,
		fov,
	});
	mass.render();

	const side = Math.round(POSTER_SCALE * massPx);
	const poster = document.createElement('canvas');
	poster.width = poster.height = side;
	poster
		.getContext('2d')!
		.drawImage(mass.canvas, state.x - side / 2, state.y - side / 2, side, side, 0, 0, side, side);
	mass.dispose();
	return poster;
}

/** Descarga el póster en PNG (para copiarlo a src/assets/). */
export function downloadPoster(poster: HTMLCanvasElement, name: string) {
	poster.toBlob((blob) => {
		if (!blob) return;
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = name;
		link.click();
		URL.revokeObjectURL(link.href);
	}, 'image/png');
}
