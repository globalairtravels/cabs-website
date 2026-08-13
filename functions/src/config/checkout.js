const raw = require("./checkout.json");

function asStringArray(value, fallback) {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  return value.filter((item) => typeof item === "string" && item);
}

function getCheckoutConfig() {
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
    sheetEnabled: raw.sheet?.enabled !== false,
    gateways,
    enabledGateways: enabled,
    defaultGateway,
    sheetOnly: enabled.length === 0,
    advanceRupeesPerDay: Number.isFinite(advanceRupeesPerDay) && advanceRupeesPerDay > 0 ? advanceRupeesPerDay : 500,
    paymentOptions: { default: defaultOptions, byBookingType },
  };
}

function paymentOptionsFor(bookingTypeId, config = getCheckoutConfig()) {
  return config.paymentOptions.byBookingType[bookingTypeId] || config.paymentOptions.default;
}

module.exports = { getCheckoutConfig, paymentOptionsFor };
