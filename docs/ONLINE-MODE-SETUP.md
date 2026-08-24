# Online Mode setup (multi-device barcode sync + licensing)

This document is for the app owner/deployer. It covers the manual steps needed once
to enable Online Mode in production. None of this is required for the app to keep
working offline as before -- Online Mode is fully optional and gated by license.

## What changed

The app is no longer a pure static-assets Worker. It now ships a small Worker script
(`worker/index.ts`) that serves the built app **and** a tiny barcode-scan relay API
(`/api/sync/:code/scan`, `/api/sync/:code/ping`) backed by Cloudflare KV. No store data
(products, sales, customers, money) ever goes through this API -- only a scanned
barcode string, held for at most 60 seconds and deleted once read.

## One-time Cloudflare setup

1. **Create a KV namespace.**
   In the Cloudflare dashboard: Workers & Pages → KV → Create namespace. Name it
   something like `lightweight-ims-sync`. Copy the namespace ID it gives you.
   (You can also run `npx wrangler kv:namespace create SYNC_KV` locally if you're
   logged in with `npx wrangler login` -- it prints the same ID.)

2. **Fill in `wrangler.toml`.**
   Replace both placeholder values with the ID from step 1:
   ```toml
   [[kv_namespaces]]
   binding = "SYNC_KV"
   id = "REPLACE_WITH_YOUR_KV_NAMESPACE_ID"
   preview_id = "REPLACE_WITH_YOUR_KV_PREVIEW_NAMESPACE_ID"
   ```
   (`preview_id` can be the same namespace, or a second one if you want dev/prod
   traffic kept apart -- either is fine for this app's low-stakes usage.)

3. **Switch deployment from the dashboard Git build to Wrangler.**
   The existing Cloudflare dashboard Git integration only knows how to publish static
   assets -- it does not know how to attach a KV binding to a Worker script. Once
   `wrangler.toml` has real IDs, deploy with:
   ```bash
   npx wrangler login      # once, opens a browser to authorize
   npm run deploy          # builds dist/ then runs `wrangler deploy`
   ```
   This publishes both the static app and the `/api/sync/*` routes together, under
   the same Worker name (`lightweight-ims`) already used today. You can keep doing
   this from your machine, or wire `npm run deploy` into a GitHub Action later if you
   want push-to-deploy back.

## Issuing license keys (Online Mode unlock)

License keys are signed offline with an ECDSA keypair -- the private half never
leaves your machine, so keys can't be forged even by someone who reads the app's
public source code.

```bash
node scripts/generate-license.mjs <trial|1m|6m|12m> "optional note, e.g. customer name"
```

This prints a key like `eyJpZC...xyz.AbCdEf...`. Send that string to the customer
after they pay you (e.g. via GCash) -- they paste it into the app under
Miscellaneous → Online → License Key. Nothing about payment happens inside the app;
that part is entirely between you and the customer.

**`license-private.local.json` (the private key) is gitignored on purpose.** Keep a
backup of it somewhere safe outside this repo (e.g. a password manager) -- if you
lose it, you can no longer issue valid keys with the same public key already shipped
to existing customers, and you'd have to generate a new keypair and update
`src/license.ts`'s embedded public key (invalidating old keys).

## Testing locally before deploying

```bash
npm run worker:dev
```

Runs the Worker (with a local, on-disk KV emulation -- no live Cloudflare account
needed) at `http://localhost:8788`. Two browser tabs pointed at that URL can pair
with each other exactly like two physical devices would in production.

## How Online Mode works for the store owner

1. Both devices need an active license key (Miscellaneous → Online → paste key).
2. On one device, tap "Create Sync Session" -- it generates a random 6-digit code.
3. On the other device, enter that same code under "Join with a code."
4. Each device then picks a role: **Scanner** (uses the camera to read barcodes and
   sends them) or **Display** (listens for incoming scans and adds matching products
   straight to the Sales cart).
5. Sync codes are scoped to themselves -- two different stores using different codes
   never see each other's scans, and codes/scan data auto-expire (scans after 60s,
   the whole room after 6 hours of inactivity) so nothing lingers in KV indefinitely.
