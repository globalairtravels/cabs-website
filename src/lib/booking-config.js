import rawConfig from "../../firestore/config.booking.json";

function normalizeBookingConfig(raw) {
  const rawCabs = raw.cabs && typeof raw.cabs === "object" ? raw.cabs : {};
  const bookingTypes = raw.bookingTypes && typeof raw.bookingTypes === "object" ? raw.bookingTypes : {};

  const airportPrices = firstRoutePrices(bookingTypes.airport);
  const cityPrices = firstRoutePrices(bookingTypes.city);

  const cabTypes = Object.entries(rawCabs)
    .filter(([, cab]) => cab && cab.active !== false)
    .map(([id, cab]) => ({
      id,
      name: cab.name,
      icon: cab.icon,
      example: cab.example,
      seats: cab.seats,
      luggage: cab.luggage,
      ac: cab.ac !== false,
      ratePerKm: cab.ratePerKm,
      minKmPerDay: cab.minKmPerDay,
      driverAllowance: cab.driverAllowance,
      airportPrice: airportPrices[id] ?? null,
      cityPrice: cityPrices[id] ?? null,
    }));

  if (cabTypes.length === 0) {
    throw new Error("firestore/config.booking.json has no active cabs.");
  }

  const rawPromos = raw.promos && typeof raw.promos === "object" ? raw.promos : {};
  const promos = Object.entries(rawPromos)
    .filter(([, promo]) => promo && promo.active !== false)
    .map(([code, promo]) => ({ code, ...promo }));

  const rawCities = raw.cities && typeof raw.cities === "object" ? raw.cities : {};
  const cities = Object.entries(rawCities)
    .filter(([, city]) => city && city.active !== false)
    .map(([id, city]) => ({
      id,
      name: city.name,
      validFor: Array.isArray(city.validFor) ? city.validFor : [],
    }));

  const bookingTypeMeta = {};
  for (const [id, bt] of Object.entries(bookingTypes)) {
    if (!bt || bt.active === false) continue;
    bookingTypeMeta[id] = {
      id,
      label: bt.label,
      applicableCabs: Array.isArray(bt.applicableCabs) ? bt.applicableCabs : [],
      pricingModel: bt.pricing?.model ?? null,
    };
  }

  return {
    version: raw.version ?? null,
    updatedAt: raw.updatedAt ?? null,
    cabTypes,
    promos,
    cities,
    bookingTypes: bookingTypeMeta,
  };
}

function firstRoutePrices(bookingType) {
  const routes = Array.isArray(bookingType?.routes) ? bookingType.routes : [];
  const active = routes.find((route) => route && route.active !== false);
  return active?.prices && typeof active.prices === "object" ? active.prices : {};
}

export const bookingConfig = normalizeBookingConfig(rawConfig);
