import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const BOOKING_CONFIG_DOC = "configs/booking";

export async function loadBookingConfig() {
  const snap = await getDoc(doc(db, "configs", "booking"));
  if (!snap.exists()) {
    throw new Error(`Firestore document ${BOOKING_CONFIG_DOC} does not exist.`);
  }
  return normalizeBookingConfig(snap.data());
}

function normalizeBookingConfig(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error(`Firestore document ${BOOKING_CONFIG_DOC} returned no data.`);
  }

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
    throw new Error(`Firestore document ${BOOKING_CONFIG_DOC} has no active cabs.`);
  }

  const rawPromos = raw.promos && typeof raw.promos === "object" ? raw.promos : {};
  const promos = Object.entries(rawPromos)
    .filter(([, promo]) => promo && promo.active !== false)
    .map(([code, promo]) => ({ code, ...promo }));

  return {
    version: raw.version ?? null,
    updatedAt: raw.updatedAt ?? null,
    cabTypes,
    promos,
  };
}

function firstRoutePrices(bookingType) {
  const routes = Array.isArray(bookingType?.routes) ? bookingType.routes : [];
  const active = routes.find((route) => route && route.active !== false);
  return active?.prices && typeof active.prices === "object" ? active.prices : {};
}
