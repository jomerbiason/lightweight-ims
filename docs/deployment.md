# Deployment

1. `npm ci`
2. `npm test`
3. `npm run typecheck`
4. `npm run build`
5. Deploy `dist/` to Cloudflare Pages or another static host.

No cloud database is required. If client-side routes are introduced later, configure SPA fallback to `index.html`.
