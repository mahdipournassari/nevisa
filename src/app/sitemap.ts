import type { MetadataRoute } from 'next';

const publicPaths = [
  '', '/about', '/pricing', '/contact',
  '/ai-pdf-summary', '/chat-with-pdf', '/pdf-to-text', '/word-summary', '/excel-analysis', '/ai-content-generator', '/ai-instagram-caption', '/ai-ad-copy', '/ai-blog-content', '/ai-text-rewriter'
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: `https://nevissaa.ir${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
    priority: path === '' ? 1 : 0.7,
  }));
}
