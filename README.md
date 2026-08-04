# wingspay-api

The **WingsPay API** host — served at `https://api.wingspay.net/`.

**Stage 1 status: a static Developer Preview, not a real backend.** It
returns real HTTP JSON responses so a developer's first five minutes are
real (get a `wp_test_` key → read the docs → send a request → receive
JSON), but there is no database and no live payment processing behind it.
Every response is `"livemode": false`. See
`wingspay-site/engineering/architecture/API_FUTURE_VISION.md` and
`MIGRATION_LOG.md` **AD-026** for the decision and its reasoning
(Product Perception First: a working demo developer-experience, not a
grey "Planned" placeholder).

## What's here

- `index.html` — the human-facing landing at `api.wingspay.net/`
  (Developer Preview, Base URL, "Run" demo, CTAs into Auth/Sandbox/Docs).
- `functions/v1/[[path]].js` — a Cloudflare Pages Function serving the
  JSON endpoints under `/v1/`:
  - `GET /v1/`             — API info object
  - `GET /v1/merchant`     — the demo merchant (Preview Environment)
  - `GET /v1/balance`      — available / pending / reserve balances
  - `GET /v1/payments`     — recent payments
  - `GET /v1/transactions` — balance-transaction ledger
  - anything else          — `404` with an `invalid_request_error`
- `_headers`, `robots.txt` — platform-standard headers; the JSON
  endpoints are `Disallow`ed from indexing, the landing is indexed.

All demo data agrees with the canonical **Preview Environment** figures in
`FAKE_DATA_SPECIFICATION.md` / `MERCHANT_STORY.md` (no company-persona
name, per the 2026-08-02 platform-wide naming rule). Timestamps are
computed at request time so the data never looks stale.

## Forward-compatibility contract (Stage 2)

The routes and JSON shapes in `functions/v1/[[path]].js` are the **public
interface**. When a real backend ships at Stage 2 it keeps the same paths
and shapes and only replaces the static bodies with live data — no
integrator has to change anything. Do not change a route or response
shape here without treating it as a public-API change.

## Deploy note

`api.wingspay.net` is bound to a Cloudflare Pages project and is live —
this repo's earlier "not live until bound" note (accurate when AD-026
was written) is now stale and has been corrected here 2026-08-05. This
supersedes AD-023's earlier "redirect into Docs" plan for the domain —
see AD-026.

**Open engineering question (not a deploy blocker):** the Cloudflare
Pages project's Build Output Directory is configured as `public`, but
this repository has no `public/` directory — everything is published
from the repo root. The site is nonetheless live and serving correctly.
This discrepancy is under active investigation; see
`wingspay-site/engineering/architecture/API_ROUTING_INVESTIGATION.md`
for the current findings and open questions. Do not assume either the
Cloudflare setting or the repo structure is "the mistake" until that
investigation concludes.
