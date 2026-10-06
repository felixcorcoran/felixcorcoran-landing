// Masa orgánica — material.
// Iluminación a medida (en espacio lineal) pensada para parecer materia
// blanda y ligeramente translúcida: difuso envolvente, banda de dispersión
// cálida en el terminador, sombras coral (nunca negras), especular amplio y
// translucidez en los bordes.

uniform vec3 uShadow;     // coral profundo: la zona en sombra
uniform vec3 uMid;        // coral de marca: medio tono
uniform vec3 uLight;      // melocotón: zona iluminada
uniform vec3 uHighlight;  // crema cálido: brillo
uniform vec3 uScatter;    // tono de la dispersión subsuperficial
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vBaseNormal;
varying vec3 vViewPosition;
varying vec3 vObjectPosition;
varying float vDisplacement;

// Luz en espacio de vista: la iluminación queda fija respecto a la cámara
// aunque la masa rote, como una escultura bajo luz de estudio.
const vec3 KEY = vec3(-0.72, 0.62, 0.5);
const vec3 FILL = vec3(0.85, -0.2, 0.5);

float wrapped(vec3 n, vec3 l, float w) {
	return clamp((dot(n, l) + w) / (1.0 + w), 0.0, 1.0);
}

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
	vec3 n = normalize(vNormal);
	vec3 v = normalize(vViewPosition);
	vec3 keyDir = normalize(KEY);
	vec3 fillDir = normalize(FILL);

	// Luz de escultor: la forma grande se ilumina con la normal de la esfera
	// base (lectura clara de volumen) y los lóbulos solo la modulan (relieve).
	vec3 form = normalize(mix(normalize(vBaseNormal), n, 0.55));

	float key = wrapped(form, keyDir, 0.3);
	float fill = wrapped(form, fillDir, 0.5);
	// Cielo claro arriba, rebote cálido abajo: da peso a la masa
	float sky = form.y * 0.5 + 0.5;
	// Luz ambiental del entorno crema: la materia es luminosa, no mate
	float light = key * 0.74 + fill * 0.12 + sky * 0.14 + 0.08;

	// Rampa de color: sombra → medio tono → luz
	vec3 col = mix(uShadow, uMid, smoothstep(0.1, 0.55, light));
	col = mix(col, uLight, smoothstep(0.5, 1.0, light));

	// Dispersión subsuperficial aproximada: el terminador se vuelve más cálido
	float band = (key - 0.32) / 0.2;
	col += uScatter * exp(-band * band) * 0.16;

	// Oclusión suave en los valles de la deformación
	float cavity = smoothstep(-0.18, 0.14, vDisplacement);
	col *= mix(0.84, 1.02, cavity);

	// Especular suave (materia blanda, no plástico)
	vec3 h = normalize(keyDir + v);
	float spec = pow(max(dot(n, h), 0.0), 34.0);
	col = mix(col, uHighlight, spec * 0.4);

	// Translucidez en la silueta: en el lado en sombra la luz atraviesa el
	// borde y lo tiñe de coral saturado; en el lado iluminado apenas se nota.
	float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);
	col = mix(col, mix(uScatter, uLight, key), fresnel * 0.28);

	gl_FragColor = vec4(col, uOpacity);

	#include <colorspace_fragment>

	// Dither para evitar banding en los degradados suaves
	gl_FragColor.rgb += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

	// El canvas se compone con alfa premultiplicado
	gl_FragColor.rgb *= gl_FragColor.a;
}
