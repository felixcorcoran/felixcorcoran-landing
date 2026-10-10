import { contact } from './contact';
import { routes, type Lang } from '../i18n';

/**
 * Datos estructurados (schema.org) para buscadores: quién es, qué hace y
 * dónde. Solo datos que ya son públicos en la web; nada de reseñas,
 * valoraciones ni direcciones que no se muestran. Uno por idioma: los textos
 * y la página de la auditoría cambian; la persona y el servicio son los mismos
 * (mismos @id).
 */
const site = 'https://felixcorcoran.es';

const text = {
	es: {
		jobTitle: 'Desarrollador web y de automatizaciones',
		knowsAbout: [
			'Diseño y desarrollo web',
			'Sistemas de reservas',
			'Automatización de procesos',
			'Inteligencia artificial aplicada a negocios',
			'Shopify',
			'n8n',
		],
		description:
			'Reviso cómo funciona tu negocio, te digo qué mejoraría y construyo solo lo que merece la pena: webs, sistemas de reservas, automatizaciones e IA.',
		area: 'Provincia de Málaga',
		offer: 'Auditoría gratuita',
		offerDescription: 'Una revisión de tu negocio con hasta 3 oportunidades concretas de mejora.',
	},
	en: {
		jobTitle: 'Web and automation developer',
		knowsAbout: [
			'Web design and development',
			'Booking systems',
			'Process automation',
			'AI for businesses',
			'Shopify',
			'n8n',
		],
		description:
			"I look at how your business works, tell you what I'd improve and build only what's worth it: websites, booking systems, automations and AI.",
		area: 'Province of Málaga',
		offer: 'Free audit',
		offerDescription: 'A review of your business with up to 3 concrete opportunities for improvement.',
	},
};

export const homeJsonLd = (lang: Lang) => {
	const t = text[lang];
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${site}/#website`,
				url: `${site}/`,
				name: 'Félix Corcoran',
				inLanguage: ['es-ES', 'en-GB'],
				publisher: { '@id': `${site}/#felix` },
			},
			{
				'@type': 'Person',
				'@id': `${site}/#felix`,
				name: 'Félix Corcoran',
				url: `${site}/`,
				email: contact.email,
				jobTitle: t.jobTitle,
				image: `${site}/felix-corcoran.jpg`,
				// Sus perfiles: le dice a Google qué perfiles son de esta misma persona
				// (si cambia la URL de LinkedIn, actualizarla aquí)
				sameAs: ['https://www.linkedin.com/in/felixcorcoran'],
				knowsAbout: t.knowsAbout,
				knowsLanguage: ['es', 'en'],
				worksFor: { '@id': `${site}/#servicio` },
			},
			{
				'@type': 'ProfessionalService',
				'@id': `${site}/#servicio`,
				name: 'Félix Corcoran',
				url: `${site}${routes.home[lang]}`,
				image: `${site}/og.png`,
				description: t.description,
				email: contact.email,
				...(contact.whatsappNumber && { telephone: `+${contact.whatsappNumber}` }),
				founder: { '@id': `${site}/#felix` },
				address: { '@type': 'PostalAddress', addressRegion: 'Málaga', addressCountry: 'ES' },
				areaServed: { '@type': 'AdministrativeArea', name: t.area },
				knowsLanguage: ['es', 'en'],
				makesOffer: {
					'@type': 'Offer',
					name: t.offer,
					description: t.offerDescription,
					price: '0',
					priceCurrency: 'EUR',
					url: `${site}${routes.contact[lang]}`,
				},
			},
		],
	};
};
