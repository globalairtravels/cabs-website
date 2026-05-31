const crypto = require("crypto");

const PHONEPE_ENDPOINTS = {
  production: "https://api.phonepe.com/apis/hermes",
  sandbox: "https://api-preprod.phonepe.com/apis/pg-sandbox",
};

const PAY_PATH = "/pg/v1/pay";
const STATUS_PATH = "/pg/v1/status";

/**
 * Compute X-VERIFY checksum for PhonePe API requests.
 * Formula: SHA256(base64Payload + apiPath + saltKey) + "###" + saltIndex
 */
function computeChecksum(base64Payload, apiPath, saltKey, saltIndex) {
  const hash = crypto
    .createHash("sha256")
    .update(base64Payload + apiPath + saltKey)
    .digest("hex");
  return `${hash}###${saltIndex}`;
}

/**
 * Verify a PhonePe webhook callback.
 * PhonePe sends: X-VERIFY: SHA256(responseBase64 + saltKey) + "###" + saltIndex
 */
function verifyWebhookChecksum(responseBase64, xVerifyHeader, saltKey) {
  const [receivedHash] = xVerifyHeader.split("###");
  const expectedHash = crypto
    .createHash("sha256")
    .update(responseBase64 + saltKey)
    .digest("hex");
  return receivedHash === expectedHash;
}

function getBaseUrl(env) {
  return PHONEPE_ENDPOINTS[env] ?? PHONEPE_ENDPOINTS.sandbox;
}

module.exports = { computeChecksum, verifyWebhookChecksum, getBaseUrl, PAY_PATH, STATUS_PATH };
