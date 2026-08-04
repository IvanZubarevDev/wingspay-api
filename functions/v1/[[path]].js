// Cloudflare Pages Function — WingsPay API (Developer Preview)
// Catch-all for /v1/*  →  https://api.wingspay.net/v1/...
//
// This is a STATIC developer-preview API. It returns real HTTP JSON
// responses so a developer's first five minutes are real (get a key →
// read docs → send a request → receive JSON), but there is no backend,
// no database, and no real payment processing behind it (Stage 1, see
// wingspay-site/engineering/PROJECT_ARCHITECTURE_BRIEF.md and AD-026).
//
// FORWARD-COMPATIBILITY CONTRACT: the routes and response shapes below
// are the public interface. When a real backend ships at Stage 2, it
// must keep the same paths and JSON shapes and only replace the static
// bodies with live data — no consumer should have to change. Everything
// here is `"livemode": false` on purpose.
//
// Timestamps are computed at request time so the data never looks stale
// (a stale fixed date is itself a defect — Product Realism First).

const DOCS = "https://docs.wingspay.net/api-reference.html";
const SANDBOX = "https://sandbox.wingspay.net";
const QUICKSTART = "https://docs.wingspay.net/quickstart.html";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

// Cloudflare Pages Functions bypass the repo's `_headers` file entirely,
// so every response from this Function must set its own security headers
// to match the standard 5-header set every static page on the platform
// gets via `_headers`. Added 2026-08-03 (ENGINEERING_BACKLOG.md 1.11) —
// this endpoint previously shipped with none of them.
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
};

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Wingspay-Mode": "test",
      ...CORS,
      ...SECURITY_HEADERS,
      ...extra,
    },
  });
}

// ---- runtime-relative timestamps (never go stale) ----
const now = () => Math.floor(Date.now() / 1000);
const minsAgo = (m) => now() - m * 60;
const hoursAgo = (h) => now() - h * 3600;
const daysAgo = (d) => now() - d * 86400;

// ---- canonical Example Merchant Ltd. (agrees with FAKE_DATA_SPECIFICATION.md
//      / MERCHANT_STORY.md — same numbers Dashboard & Auth show) ----
function apiInfo() {
  return {
    object: "api",
    name: "WingsPay API",
    version: "v1",
    status: "operational",
    description:
      "WingsPay REST API — accept card, SEPA and crypto payments through one interface. Authenticate with a wp_test_ key and start integrating.",
    base_url: "https://api.wingspay.net/v1/",
    resources: ["/v1/merchant", "/v1/balance", "/v1/payments", "/v1/transactions"],
    documentation: DOCS,
    quickstart: QUICKSTART,
    sandbox: SANDBOX,
    livemode: false,
  };
}

function merchant() {
  return {
    object: "merchant",
    id: "mrc_8f3e2a1c9b4d7e6f",
    name: "Example Merchant Ltd.",
    status: "active",
    email: "explore@wingspay.net",
    country: "NL",
    region: "Europe",
    industry: "igaming",
    default_currency: "eur",
    capabilities: {
      card_payments: "active",
      sepa: "active",
      crypto: "active",
      pix: "active",
      payouts: "active",
    },
    settlement: { schedule: "weekly", next: daysAgo(-3) }, // ~3 days from now
    onboarding: { state: "completed", activated_at: daysAgo(45) },
    created: daysAgo(50),
    livemode: false,
  };
}

function balance() {
  return {
    object: "balance",
    // amounts are in the currency's minor unit (cents), Stripe-style
    available: [
      { amount: 2186040, currency: "eur" },
      { amount: 412060, currency: "usd" },
    ],
    pending: [
      { amount: 954015, currency: "eur" },
      { amount: 61230, currency: "usd" },
    ],
    reserved: [{ amount: 1248000, currency: "eur" }],
    livemode: false,
  };
}

// A small, realistic, non-round set. IDs are stable; timestamps are live.
function payments() {
  const data = [
    { id: "pay_4f8a2b91c3d7e6f5", amount: 129900, currency: "eur", status: "succeeded", method: "card",         description: "Order #A-10482", created: minsAgo(42) },
    { id: "pay_9c1d4e7f2a8b3c6d", amount: 45000,  currency: "eur", status: "succeeded", method: "sepa_credit",  description: "Order #A-10479", created: hoursAgo(3) },
    { id: "pay_2b6e9a4d8c1f5e3a", amount: 320000, currency: "eur", status: "pending",   method: "bank_transfer",description: "Order #A-10471", created: hoursAgo(9) },
    { id: "pay_7d3c1f9b5e2a8c40", amount: 8745,   currency: "eur", status: "failed",    method: "card",         description: "Order #A-10466", created: hoursAgo(20), failure_code: "card_declined" },
    { id: "pay_1a5e8c2d7b9f4306", amount: 67500,  currency: "usd", status: "succeeded", method: "crypto",       description: "Order #A-10455", created: daysAgo(1) },
    { id: "pay_6c1a4f83e7d29b15", amount: 21400,  currency: "eur", status: "refunded",  method: "card",         description: "Order #A-10442 (refund)", created: daysAgo(2) },
  ].map((p) => ({ object: "payment", livemode: false, ...p }));
  return { object: "list", url: "/v1/payments", has_more: true, total_count: 1482, data };
}

// Balance-transaction ledger (payments net of fees, plus a payout/reserve line).
function transactions() {
  const data = [
    { id: "txn_4f8a2b91c3d7e6f5", type: "payment", amount: 129900, fee: 3897, net: 126003, currency: "eur", source: "pay_4f8a2b91c3d7e6f5", created: minsAgo(42) },
    { id: "txn_9c1d4e7f2a8b3c6d", type: "payment", amount: 45000,  fee: 900,  net: 44100,  currency: "eur", source: "pay_9c1d4e7f2a8b3c6d", created: hoursAgo(3) },
    { id: "txn_6c1a4f83e7d29b15", type: "refund",  amount: -21400, fee: 0,    net: -21400, currency: "eur", source: "pay_6c1a4f83e7d29b15", created: daysAgo(2) },
    { id: "txn_a2f7c4e18d3b9506", type: "payout",  amount: -1840055, fee: 0,  net: -1840055, currency: "eur", source: "po_1840055weekly", created: daysAgo(4), status: "paid" },
  ].map((t) => ({ object: "balance_transaction", livemode: false, ...t }));
  return { object: "list", url: "/v1/transactions", has_more: true, total_count: 1482, data };
}

function notFound(path) {
  return json(
    {
      error: {
        type: "invalid_request_error",
        code: "resource_missing",
        message: `Unknown endpoint: /v1/${path}. See the API reference for available resources.`,
        available: ["/v1/merchant", "/v1/balance", "/v1/payments", "/v1/transactions"],
        doc_url: DOCS,
      },
      livemode: false,
    },
    404
  );
}

export async function onRequest(context) {
  const { request, params } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...CORS, ...SECURITY_HEADERS } });
  }
  if (request.method !== "GET") {
    return json(
      { error: { type: "invalid_request_error", code: "method_not_allowed", message: `${request.method} is not supported on this endpoint. Use GET.`, doc_url: DOCS }, livemode: false },
      405,
      { Allow: "GET, OPTIONS" }
    );
  }

  // params.path is the array of segments after /v1/  (e.g. ["merchant"])
  const segs = Array.isArray(params.path) ? params.path.filter(Boolean) : [];
  const resource = (segs[0] || "").toLowerCase();

  switch (resource) {
    case "":            return json(apiInfo());
    case "merchant":    return json(merchant());
    case "balance":     return json(balance());
    case "payments":    return json(payments());
    case "transactions":return json(transactions());
    default:            return notFound(segs.join("/"));
  }
}
