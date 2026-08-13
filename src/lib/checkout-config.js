import rawConfig from "../../firestore/config.checkout.json";

const BOOKING_API_BASE = process.env.NEXT_PUBLIC_BOOKINGS_API_URL || "";

function asStringArray(value, fallback) {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  return value.filter((item) => typeof item === "string" && item);
}

function normalizeCheckoutConfig(raw) {
  const gateways = raw.gateways && typeof raw.gateways === "object" ? raw.gateways : {};
  const options = raw.paymentOptions && typeof raw.paymentOptions === "object" ? raw.paymentOptions : {};
  const defaultOptions = asStringArray(options.default, ["advance"]);
  const byBookingType = {};
  const rawByType = options.byBookingType && typeof options.byBookingType === "object" ? options.byBookingType : {};
  for (const [id, list] of Object.entries(rawByType)) {
    byBookingType[id] = asStringArray(list, defaultOptions);
  }

  const enabled = Object.entries(gateways)
    .filter(([, gateway]) => gateway && gateway.enabled === true)
    .map(([id]) => id);

  const defaultGateway =
    raw.defaultGateway && enabled.includes(raw.defaultGateway) ? raw.defaultGateway : enabled[0] || null;

  const advanceRupeesPerDay = Number(raw.advanceRupeesPerDay);
  return {
    version: raw.version ?? null,
    updatedAt: raw.updatedAt ?? null,
    sheetEnabled: raw.sheet?.enabled !== false,
    gateways,
    enabledGateways: enabled,
    defaultGateway,
    sheetOnly: enabled.length === 0,
    advanceRupeesPerDay: Number.isFinite(advanceRupeesPerDay) && advanceRupeesPerDay > 0 ? advanceRupeesPerDay : 500,
    paymentOptions: { default: defaultOptions, byBookingType },
  };
}

export const checkoutConfig = normalizeCheckoutConfig(rawConfig);

export function paymentOptionsFor(bookingTypeId) {
  return checkoutConfig.paymentOptions.byBookingType[bookingTypeId] || checkoutConfig.paymentOptions.default;
}

export function advanceRupeesFor(days = 1) {
  const n = Number(days);
  const safeDays = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  return checkoutConfig.advanceRupeesPerDay * safeDays;
}

function apiBase() {
  return BOOKING_API_BASE.replace(/\/+$/, "");
}

export function getCreateBookingUrl() {
  const base = apiBase();
  return base ? `${base}/new` : "";
}

export function getBookingStatusApiUrl(bookingId) {
  const base = apiBase();
  if (!base || !bookingId) return "";
  return `${base}/${encodeURIComponent(bookingId)}`;
}
