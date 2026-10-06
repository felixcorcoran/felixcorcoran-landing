/**
 * ¿Se montan las escenas fijas (sticky) de la landing?
 *
 * Solo con movimiento y con altura suficiente. En pantallas bajas (móvil en
 * horizontal, zoom al 200 %, ventanas pequeñas) un escenario de 100svh no
 * cabe: la página se lee en flujo normal, igual que con movimiento reducido.
 * Se decide al cargar.
 */
export const cinematic = () =>
	!matchMedia('(prefers-reduced-motion: reduce)').matches && matchMedia('(min-height: 34rem)').matches;
