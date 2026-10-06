// Masa orgánica — deformación procedural.
// La esfera base (radio 1) se desplaza a lo largo de su normal con ruido
// simplex 3D "domain-warped": el propio ruido deforma el espacio del ruido,
// lo que produce lóbulos que fluyen en vez de bultos aleatorios.

uniform float uTime;       // tiempo ambiental (ya escalado: muy lento)
uniform float uDeform;     // intensidad de la deformación (1 = reposo)
uniform float uFrequency;  // tamaño de los lóbulos (más alto = más lóbulos)
uniform float uShape;      // semilla: desplazarla transforma la forma

varying vec3 vNormal;
varying vec3 vBaseNormal;
varying vec3 vViewPosition;
varying vec3 vObjectPosition;
varying float vDisplacement;

// Simplex 3D noise — Ian McEwan, Stefan Gustavson (Ashima Arts). MIT License.
// https://github.com/ashima/webgl-noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
	const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
	const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

	vec3 i = floor(v + dot(v, C.yyy));
	vec3 x0 = v - i + dot(i, C.xxx);

	vec3 g = step(x0.yzx, x0.xyz);
	vec3 l = 1.0 - g;
	vec3 i1 = min(g.xyz, l.zxy);
	vec3 i2 = max(g.xyz, l.zxy);

	vec3 x1 = x0 - i1 + C.xxx;
	vec3 x2 = x0 - i2 + C.yyy;
	vec3 x3 = x0 - D.yyy;

	i = mod289(i);
	vec4 p = permute(permute(permute(
		i.z + vec4(0.0, i1.z, i2.z, 1.0))
		+ i.y + vec4(0.0, i1.y, i2.y, 1.0))
		+ i.x + vec4(0.0, i1.x, i2.x, 1.0));

	float n_ = 0.142857142857;
	vec3 ns = n_ * D.wyz - D.xzx;

	vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

	vec4 x_ = floor(j * ns.z);
	vec4 y_ = floor(j - 7.0 * x_);

	vec4 x = x_ * ns.x + ns.yyyy;
	vec4 y = y_ * ns.x + ns.yyyy;
	vec4 h = 1.0 - abs(x) - abs(y);

	vec4 b0 = vec4(x.xy, y.xy);
	vec4 b1 = vec4(x.zw, y.zw);

	vec4 s0 = floor(b0) * 2.0 + 1.0;
	vec4 s1 = floor(b1) * 2.0 + 1.0;
	vec4 sh = -step(h, vec4(0.0));

	vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
	vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

	vec3 p0 = vec3(a0.xy, h.x);
	vec3 p1 = vec3(a0.zw, h.y);
	vec3 p2 = vec3(a1.xy, h.z);
	vec3 p3 = vec3(a1.zw, h.w);

	vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
	p0 *= norm.x;
	p1 *= norm.y;
	p2 *= norm.z;
	p3 *= norm.w;

	vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
	m = m * m;
	return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

float displacementAt(vec3 n) {
	vec3 q = n * uFrequency + vec3(uShape, uShape * 0.63, -uShape * 0.41);
	float t = uTime;

	// Campo de deformación del espacio: suave y lento
	vec3 warp = vec3(
		snoise(q * 0.6 + vec3(0.0, t, 0.0)),
		snoise(q * 0.6 + vec3(5.2, -t, 1.3)),
		snoise(q * 0.6 + vec3(-3.1, 2.8, t))
	);

	// Lóbulos principales + una capa media que da tensión a la superficie
	float lobes = snoise(q + warp * 0.55 + vec3(0.0, 0.0, t * 0.6));
	float detail = snoise(q * 1.8 + warp * 0.3 - vec3(t * 0.4));

	return (lobes * 0.21 + detail * 0.022) * uDeform;
}

vec3 displaced(vec3 n) {
	return n * (1.0 + displacementAt(n));
}

void main() {
	vec3 n = normalize(position);

	// Normal real de la superficie deformada: se muestrean dos vecinos en el
	// plano tangente y se reconstruye con el producto vectorial.
	vec3 axis = abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
	vec3 tangent = normalize(cross(n, axis));
	vec3 bitangent = cross(n, tangent);

	const float eps = 0.008;
	vec3 p0 = displaced(n);
	vec3 p1 = displaced(normalize(n + tangent * eps));
	vec3 p2 = displaced(normalize(n + bitangent * eps));
	vec3 surfaceNormal = normalize(cross(p1 - p0, p2 - p0));
	if (dot(surfaceNormal, n) < 0.0) surfaceNormal = -surfaceNormal;

	vDisplacement = length(p0) - 1.0;
	vObjectPosition = p0;

	vec4 mvPosition = modelViewMatrix * vec4(p0, 1.0);
	vViewPosition = -mvPosition.xyz;
	vNormal = normalize(normalMatrix * surfaceNormal);
	vBaseNormal = normalize(normalMatrix * n);

	gl_Position = projectionMatrix * mvPosition;
}
