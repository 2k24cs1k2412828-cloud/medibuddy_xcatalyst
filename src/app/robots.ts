import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: [
        '/api/',
        '/admin/',
        '/caretaker/',
        '/family/',
        '/patient/',
      ],
    },
    sitemap: 'https://medibuddyxcatalyst.vercel.app/sitemap.xml',
  };
}
