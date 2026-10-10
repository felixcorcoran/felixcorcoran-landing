import type { APIRoute } from 'astro';

// Las páginas indexables. Pocas y estables: se listan a mano. Las legales
// llevan noindex (LegalLayout): no van aquí.
const pages = ['/', '/contacto', '/en', '/en/contact'];

export const GET: APIRoute = ({ site }) => {
	const urls = pages.map((path) => `  <url><loc>${new URL(path, site)}</loc></url>`).join('\n');
	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
	return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
