const crypto = require("crypto");

// PhonePe Standard Checkout v2 hosts.
// OAuth (identity-manager) and PG (checkout) live under different prod hosts;
// sandbox shares one base. See:
//   https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/authorization
//   https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/create-payment
const PHONEPE_HOSTS = {
  production: {
    oauth: "https://api.phonepe.com/apis/identity-manager",
    pg: "https://api.phonepe.com/apis/pg",
  },
  sandbox: {
    oauth: "https://api-preprod.phonepe.com/apis/pg-sandbox",
    pg: "https://api-preprod.phonepe.com/apis/pg-sandbox",
  },
};

function hostsFor(env) {
  return PHONEPE_HOSTS[env] ?? PHONEPE_HOSTS.sandbox;
}

// OAuth access token, cached in module scope so warm function instances reuse it
// rather than minting a new token per request. Keyed by clientId so a credential
// change (e.g. sandbox → prod) never serves a stale token.
let cachedToken = null; // { key, token, expiresAtMs }

async function getAccessToken({ env, clientId, clientSecret, clientVersion }) {
  const now = Date.now();
  const key = `${env}:${clientId}`;
  // Reuse until 60s before expiry to avoid edge-of-expiry 401s.
  if (cachedToken && cachedToken.key === key && cachedToken.expiresAtMs - 60_000 > now) {
    return cachedToken.token;
  }

  const { oauth } = hostsFor(env);
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    client_version: String(clientVersion),
    grant_type: "client_credentials",
  });

  const res = await fetch(`${oauth}/v1/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`PhonePe OAuth failed (${res.status}): ${JSON.stringify(data)}`);
  }

  // PhonePe returns expires_at as epoch SECONDS; fall back to expires_in (seconds).
  const expiresAtMs = data.expires_at
    ? Number(data.expires_at) * 1000
    : now + (Number(data.expires_in) || 0) * 1000;
  cachedToken = { key, token: data.access_token, expiresAtMs };
  return data.access_token;
}

/**
 * Verify a PhonePe v2 webhook. The dashboard-configured username/password produce
 * a static Authorization header: SHA256(`username:password`) as lowercase hex.
 * (PhonePe may or may not prefix it; we tolerate an optional scheme token.)
 */
function verifyWebhookAuth(authHeader, username, password) {
  if (!authHeader || !username || !password) return false;
  const expected = crypto.createHash("sha256").update(`${username}:${password}`).digest("hex");
  const received = (authHeader.includes(" ") ? authHeader.split(" ").pop() : authHeader).trim().toLowerCase();
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { hostsFor, getAccessToken, verifyWebhookAuth };
