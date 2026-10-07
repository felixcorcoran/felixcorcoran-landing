import { contact } from './contact';

/**
 * Datos estructurados (schema.org) para buscadores: quién es, qué hace y
 * dónde. Solo datos que ya son públicos en la web; nada de reseñas,
 * valoraciones ni direcciones que no se muestran.
 */
const site = 'https://felixcorcoran.es';

export const homeJsonLd = {
	'@context': 'https://schema.org',
	'@graph': [
		{
			'@type': 'WebSite',
			'@id': `${site}/#website`,
			url: `${site}/`,
			name: 'Félix Corcoran',
			inLanguage: 'es-ES',
			publisher: { '@id': `${site}/#felix` },
		},
		{
			'@type': 'Person',
			'@id': `${site}/#felix`,
			name: 'Félix Corcoran',
			url: `${site}/`,
			email: contact.email,
			jobTitle: 'Desarrollador web y de automatizaciones',
			knowsAbout: [
				'Diseño y desarrollo web',
				'Sistemas de reservas',
				'Automatización de procesos',
				'Inteligencia artificial aplicada a negocios',
				'Shopify',
				'n8n',
			],
			worksFor: { '@id': `${site}/#servicio` },
		},
		{
			'@type': 'ProfessionalService',
			'@id': `${site}/#servicio`,
			name: 'Félix Corcoran',
			url: `${site}/`,
			image: `${site}/og.png`,
			description:
				'Reviso cómo funciona tu negocio, te digo qué mejoraría y construyo solo lo que merece la pena: webs, sistemas de reservas, automatizaciones e IA.',
			email: contact.email,
			...(contact.whatsappNumber && { telephone: `+${contact.whatsappNumber}` }),
			founder: { '@id': `${site}/#felix` },
			address: { '@type': 'PostalAddress', addressRegion: 'Málaga', addressCountry: 'ES' },
			areaServed: { '@type': 'AdministrativeArea', name: 'Provincia de Málaga' },
			knowsLanguage: ['es'],
			makesOffer: {
				'@type': 'Offer',
				name: 'Auditoría gratuita',
				description: 'Una revisión de tu negocio con hasta 3 oportunidades concretas de mejora.',
				price: '0',
				priceCurrency: 'EUR',
				url: `${site}/contacto`,
			},
		},
	],
};
