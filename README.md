# Lightweight IMS

**Offline-first inventory, sales, and Utang/Lista management for small sari-sari stores.**

Lightweight IMS is a free, installable web app built for small convenience/sari-sari store owners who need a simple, no-setup way to track products, sales, credit (utang), and cash — without an internet connection, a subscription, or an account. Everything is stored privately on the device it's opened on; nothing is ever sent to a server.

🔗 **Live app:** [lightweight-ims.jomerbiason.workers.dev](https://lightweight-ims.jomerbiason.workers.dev/)

---

## Why this exists

Most inventory/POS software is built for medium-to-large retail: it needs internet, accounts, subscriptions, and training. Small sari-sari and convenience store owners in the Philippines usually need something much simpler — record a sale, know what's running low, keep track of who owes money, and not worry about monthly fees or spotty internet. Lightweight IMS is designed around that reality: **open the app and it just works**, online or offline, on a phone or a laptop.

## Features

### Inventory & sales
- Product catalog with pricing, stock, categories, barcodes, and expiration dates
- **Multi-item cart checkout** — add several products, then check out as one grouped sale with a single receipt
- Stock in / stock adjustment / physical stock count / compensating undo, all with a full audit trail
- Low-stock and expiring-soon alerts, with quick-sell/reorder actions
- Frequently-sold quick-add shortcuts on the sales screen
- CSV export for products, sales, and inventory movements; CSV import for bulk product entry

### Utang/Lista (customer credit)
- Track customers and their running balance
- Charge a sale to a customer's account instead of cash at checkout
- Record payments against a balance, with a full per-customer ledger history
- Reversing a credit-charged sale automatically refunds the customer's balance

### Money & reporting
- Cash drawer reconciliation — opening float, expected vs. actual cash, and variance on session close (correctly excludes Utang-charged sales from the cash math)
- Daily/weekly sales summaries, 7-day sales trend, and top-sellers report
- Estimated gross profit and inventory valuation on the dashboard
- Shareable digital receipts (Web Share API / copy-to-clipboard) after every sale, re-viewable anytime from History

### Store operations
- Supplier registry, tagged to stock-in entries
- Store sessions (open/close) for cash accountability
- Camera-based barcode scanning when adding or editing a product
- Built-in calculator and a quick notes pad for day-to-day jotting

### Trust & accessibility
- **Offline-first PWA** — installable, works with no internet connection, auto-updates itself in the background when a new version is deployed (no manual refresh needed)
- Optional local PIN lock (SHA-256 hashed, no account or server involved)
- Daily low-stock/expiry browser notifications (opt-in)
- Regular backup reminders and one-tap `.store` file export/import
- Bilingual UI — **English** and **Filipino**, switchable anytime
- Light/dark theme with a customizable accent color
- Tap-friendly tooltips and a built-in About/Help guide written for non-technical, first-time users

## Tech stack

- **TypeScript** + **Vite** — no framework, no runtime dependencies; a single small bundle
- **IndexedDB** for on-device storage, with automatic versioned migrations
- **Service Worker** for offline support and self-updating PWA behavior
- **Vitest** for the automated test suite
- Deployed as static assets on **Cloudflare Workers**, auto-deployed from `main`

No backend, no database server, no accounts — the entire app runs in the browser.

## Getting started

```bash
git clone https://github.com/jomerbiason/lightweight-ims.git
cd lightweight-ims
npm install
npm run dev
```

Open the printed local URL — the app will prompt you to create your first store on first load.

### Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the local dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the automated test suite (Vitest) |
| `npm run typecheck` | Strict TypeScript type checking, no emit |
| `npm run verify` | Runs the full install → typecheck → test → build gate and logs the result |

## Project structure

```
src/
  main.ts        UI rendering, event binding, app state (single entry point)
  domain.ts       Core types and pure domain logic (status, profit calc, etc.)
  services.ts     Inventory/credit transaction logic (sales, stock, undo, ledger)
  storefile.ts    .store file format, validation, and version migration
  db.ts           IndexedDB persistence layer
  i18n.ts         English/Filipino translation dictionaries
  styles.css      All application styling (light/dark theme via CSS variables)
public/
  sw.js           Service worker (offline cache + auto-update)
  manifest.webmanifest
tests/            Vitest test suites (domain, services, storefile, regression)
docs/             Release notes, verification logs, and project history
```

## Data & privacy

- All store data (products, sales, customers, credit ledger, settings) is stored **only** in the browser's IndexedDB on the device where the app is used.
- Nothing is transmitted to any server — the app has no backend.
- Because storage is local, **regular backups matter**: use Backup → *Save .store* to export a portable copy, and keep it somewhere safe (e.g. cloud drive, email to yourself). The app reminds you if it's been a while since your last backup.
- Moving to a new device: export a `.store` file on the old device and import it via Backup → *Open My Store* on the new one.

## Deployment

The app is a static site after `npm run build` — the `dist/` folder is the deployment artifact. The live instance is hosted on **Cloudflare Workers (static assets)**, connected to this repository's `main` branch for automatic deploys on every push. No server-side runtime or database is required.

## Roadmap

Tracked in [`docs/PROJECT-LOG.md`](docs/PROJECT-LOG.md). Notable planned/deferred items:

- One-time-purchase Pro unlock (no subscriptions, no ads — decision already made, not yet implemented)
- Multi-unit pricing (e.g. selling both per-piece and per-case)
- Per-staff PIN attribution

## Contributing

Issues and pull requests are welcome. Before submitting a change, please run:

```bash
npm run typecheck && npm test && npm run build
```

## License

[MIT](LICENSE)
