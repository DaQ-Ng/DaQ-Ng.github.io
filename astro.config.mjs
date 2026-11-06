// @ts-check
import { defineConfig } from 'astro/config';

// SITE_URL / BASE_PATH can be set by your host (see README → Deploy).
// - Netlify, Vercel, Cloudflare Pages, or a <username>.github.io repo: leave BASE_PATH unset.
// - A GitHub Pages *project* repo (e.g. github.com/you/portfolio): BASE_PATH=/portfolio
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://example.com',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
