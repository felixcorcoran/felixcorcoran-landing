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

/**
 * Diseño compacto (el de móvil) y diseño amplio. Las mismas condiciones que
 * usan las @media de los componentes: el compacto es el de los móviles y el
 * de las pantallas en vertical de hasta 1200 px (tablets, monitores girados),
 * donde el diseño amplio, pensado para pantallas apaisadas, se aprieta.
 */
export const COMPACT = '(max-width: 48rem), (orientation: portrait) and (max-width: 75rem)';
export const WIDE = '(min-width: 48.0625rem) and (orientation: landscape), (min-width: 75.0625rem)';
