"use client";

import { useState } from "react";
import { siteConfig } from "@/config/site";
import { bookingConfig } from "@/lib/booking-config";

const createBookingId = () => `GAT-${Math.floor(100000 + Math.random() * 900000)}`;

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

const isTempoCab = (cab) => cab.id.startsWith("tempo");
const TEMPO_CAB = bookingConfig.cabTypes.find(isTempoCab);

// UI tab id → bookingTypes id in firestore/config.booking.json
const TRIP_TYPE_TO_BOOKING_TYPE = {
  airport: "airport",
  city: "city",
  daily: "intercity",
  tempo: "tempo",
};

const PROMO_PALETTE = ["#22A06B", "#FF4F00", "#3366CC", "#7A3FFF"];
const PROMO_ICONS = ["🎁", "🎟️", "📅", "🏷️"];

const normalizePositiveInteger = (value, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.floor(number)));
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const getAssetPath = (path) => `${BASE_PATH}${path}`;
const WHATSAPP_NUMBER = siteConfig.whatsapp.replace(/\D/g, "");
const WHATSAPP_ICON_PATH = getAssetPath("/icons/messaging/whatsapp-chat.svg");

const getWhatsAppUrl = (message) => {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

const plural = (n) => (n > 1 ? "s" : "");

export default function Home() {
  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState("airport");
  const [airportType, setAirportType] = useState("drop");
  const [cityType, setCityType] = useState("drop");
  const [outstationDirection, setOutstationDirection] = useState("oneway");
  const [numDays, setNumDays] = useState(1);
  const [cityDays, setCityDays] = useState(1);
  const [tempoDays, setTempoDays] = useState(1);
  const [tempoEstKm, setTempoEstKm] = useState(300);

  const [pickup, setPickup] = useState("Mysore");
  const [drop, setDrop] = useState("Bangalore Airport (KIA)");
  const [date, setDate] = useState(getTomorrowDate);
  const [time, setTime] = useState("10:00");
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [minSeats, setMinSeats] = useState(0);

  const [swapRotation, setSwapRotation] = useState(0);

  const handlePickupLocationChange = (val) => {
    setPickup(val);
    const normalize = (loc) => (loc || "").trim().toLowerCase();
    if (tripType === "airport" && val && normalize(val) === normalize(drop)) {
      setDrop("");
    }
  };

  const handleDropLocationChange = (val) => {
    setDrop(val);
    const normalize = (loc) => (loc || "").trim().toLowerCase();
    if (tripType === "airport" && val && normalize(val) === normalize(pickup)) {
      setPickup("");
    }
  };

  const [selectedCab, setSelectedCab] = useState(bookingConfig.cabTypes[0]);
  const [bookingId, setBookingId] = useState(createBookingId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("arrival");

  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [trackBookingId, setTrackBookingId] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackedBooking, setTrackedBooking] = useState(null);
  const [trackAttempted, setTrackAttempted] = useState(false);

  const isOutstationTrip = tripType === "daily" || tripType === "tempo";
  const showTripModeSelector = tripType !== "airport" && tripType !== "city";
  const cityDayCount = normalizePositiveInteger(cityDays, { max: 30 });
  const tempoDayCount = normalizePositiveInteger(tempoDays, { max: 30 });
  const tempoKmCount = normalizePositiveInteger(tempoEstKm);

  const tripSummaryLabel =
    tripType === "airport" ? "Airport Transfers" :
    tripType === "city" ? `City Taxi (${cityDayCount} Day${plural(cityDayCount)})` :
    tripType === "tempo" ? `Tempo Traveller (${tempoDayCount} Day${plural(tempoDayCount)} / ~${tempoKmCount}km)` :
    `Intercity Travel (${numDays} Day${plural(numDays)})`;

  const getTempoEffectiveKm = (cab) =>
    Math.max(tempoKmCount, tempoDayCount * cab.minKmPerDay);

  const openLogin = () => {
    showComingSoonToast();
  };

  const handleAirportDirectionChange = (direction) => {
    setAirportType(direction);
    if (direction === "drop") {
      setPickup("Mysore");
      setDrop("Bangalore Airport (KIA)");
    } else {
      setPickup("Bangalore Airport (KIA)");
      setDrop("Mysore");
    }
  };

  const handleCityDirectionChange = (direction) => {
    setCityType(direction);
    if (direction === "drop") {
      setPickup("Mysore");
      setDrop("Bangalore City");
    } else {
      setPickup("Bangalore City");
      setDrop("Mysore");
    }
  };

  const handleTabChange = (tab) => {
    setTripType(tab);
    setMinSeats(0);

    const nextBookingTypeId = TRIP_TYPE_TO_BOOKING_TYPE[tab];
    const nextApplicable = bookingConfig.bookingTypes[nextBookingTypeId]?.applicableCabs ?? [];
    if (nextApplicable.length > 0 && !nextApplicable.includes(selectedCab.id)) {
      const fallback = bookingConfig.cabTypes.find((cab) => nextApplicable.includes(cab.id));
      if (fallback) setSelectedCab(fallback);
    }

    if (tab === "airport") {
      handleAirportDirectionChange("drop");
    } else if (tab === "city") {
      handleCityDirectionChange("drop");
    } else if (tab === "daily") {
      setPickup("Mysore");
      setDrop("Outstation Tour / Local");
    } else if (tab === "tempo") {
      setPickup("Mysore");
      setDrop("Group Tour / Outstation");
      if (TEMPO_CAB) setSelectedCab(TEMPO_CAB);
    }
  };

  const handleSwapLocations = () => {
    if (isOutstationTrip) return;
    setPickup(drop);
    setDrop(pickup);
    setSwapRotation((prev) => prev + 180);
    if (tripType === "airport") {
      setAirportType(airportType === "drop" ? "pickup" : "drop");
    } else if (tripType === "city") {
      setCityType(cityType === "drop" ? "pickup" : "drop");
    }
  };

  const handleQuickRouteSelect = (item) => {
    const routeId = typeof item === "string" ? item : item.id;

    if (routeId === "mysore-blr-airport") {
      setTripType("airport");
      handleAirportDirectionChange("drop");
    } else if (routeId === "blr-airport-mysore") {
      setTripType("airport");
      handleAirportDirectionChange("pickup");
    } else if (routeId === "mysore-blr-city") {
      setTripType("city");
      handleCityDirectionChange("drop");
    } else if (routeId === "blr-city-mysore") {
      setTripType("city");
      handleCityDirectionChange("pickup");
    } else if (routeId === "mysore-mangalore-airport") {
      setTripType("airport");
      setPickup("Mysore");
      setDrop("Mangalore Airport");
      setAirportType("drop");
    } else if (routeId === "mysore-mangalore-city") {
      setTripType("city");
      setPickup("Mysore");
      setDrop("Mangalore City");
      setCityType("drop");
    } else if (routeId.startsWith("tour-")) {
      setTripType("daily");
      setPickup("Mysore");
      if (item.destination) setDrop(item.destination);
      if (item.days) setNumDays(item.days);
    } else if (routeId.startsWith("tempo-")) {
      setTripType("tempo");
      setPickup("Mysore");
      if (item.destination) setDrop(item.destination);
      if (item.days) setTempoDays(item.days);
      if (TEMPO_CAB) setSelectedCab(TEMPO_CAB);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const bookingTypeId = TRIP_TYPE_TO_BOOKING_TYPE[tripType];
  const activeBookingType = bookingConfig.bookingTypes[bookingTypeId] ?? null;
  const applicableCabIds = activeBookingType?.applicableCabs ?? [];

  const firestoreCityNames = bookingConfig.cities
    .filter((c) => c.validFor.includes(bookingTypeId))
    .map((c) => c.name);
  const outstationDestinations = ["Ooty", "Coorg (Madikeri)", "Kabini", "Bandipur", "Wayanad"];
  const suggestionList = isOutstationTrip
    ? Array.from(new Set([...firestoreCityNames, ...outstationDestinations]))
    : firestoreCityNames;
  const suggestions = { pickup: suggestionList, drop: suggestionList };

  const calculatePrice = (cab) => {
    if (tripType === "airport") return cab.airportPrice;
    if (tripType === "city") return (cab.ratePerKm * cab.minKmPerDay + cab.driverAllowance) * cityDayCount;
    if (tripType === "tempo") {
      return getTempoEffectiveKm(cab) * cab.ratePerKm + tempoDayCount * cab.driverAllowance;
    }
    const dayTotal = cab.ratePerKm * cab.minKmPerDay + cab.driverAllowance;
    return outstationDirection === "roundtrip" ? Math.round(dayTotal * numDays * 1.8) : dayTotal * numDays;
  };

  const formatFareFormula = (cab) => {
    if (tripType === "city") {
      const perDay = `₹${cab.ratePerKm}/km × ${cab.minKmPerDay} km/day + ₹${cab.driverAllowance}/day driver`;
      return cityDayCount > 1 ? `(${perDay}) × ${cityDayCount} days` : perDay;
    }
    if (tripType === "tempo") {
      return `₹${cab.ratePerKm}/km × ${getTempoEffectiveKm(cab)} km + ₹${cab.driverAllowance}/day × ${tempoDayCount} day${plural(tempoDayCount)} driver`;
    }
    return null;
  };

  const totalPrice = calculatePrice(selectedCab);

  const advanceDays =
    tripType === "city" ? cityDayCount :
    tripType === "tempo" ? tempoDayCount :
    tripType === "daily" ? numDays : 1;
  const requiredAdvance = 500 * advanceDays;

  const onlinePaymentAmount = paymentMethod === "full" ? totalPrice : paymentMethod === "advance" ? requiredAdvance : 0;
  const payToDriverAmount = totalPrice - onlinePaymentAmount;

  const filteredCabs = bookingConfig.cabTypes.filter((cab) => {
    if (applicableCabIds.length > 0 && !applicableCabIds.includes(cab.id)) return false;
    if (cab.seats < minSeats) return false;
    return true;
  });

  const applicablePromos = bookingConfig.promos.filter(
    (promo) => !promo.appliesTo || promo.appliesTo.length === 0 || promo.appliesTo.includes(bookingTypeId)
  );

  const handleCabSelect = (cab) => {
    setSelectedCab(cab);
    setStep(3);
  };

  const handlePassengerSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone || !pickupAddress) {
      alert("Please fill in traveler Name, Phone, and Pickup Address.");
      return;
    }
    setStep(4);
  };

  const generateUpiLink = () => {
    const note = `Booking ${bookingId}`;
    return `upi://pay?pa=${siteConfig.upiId}&pn=${encodeURIComponent(siteConfig.merchantName)}&am=${onlinePaymentAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  const getWhatsAppMessage = () => {
    let tripDetails;
    if (tripType === "airport") {
      tripDetails = `Airport Transfers (${airportType === "drop" ? "Mysore to Airport" : "Airport to Mysore"})`;
    } else if (tripType === "city") {
      tripDetails = `City Taxi Service (${cityDayCount} Day${plural(cityDayCount)} · 250 km/day included)`;
    } else if (tripType === "tempo") {
      const effectiveKm = getTempoEffectiveKm(selectedCab);
      tripDetails = `Tempo Traveller (${tempoDayCount} Day${plural(tempoDayCount)} / ~${tempoKmCount} km estimated · ${effectiveKm} km billed @ ₹${selectedCab.ratePerKm}/km)`;
    } else {
      tripDetails = `Intercity Travel (${numDays} Day${plural(numDays)})`;
    }

    const payStatus =
      paymentMethod === "full" ? "Paid 100% Full UPI" :
      paymentMethod === "advance" ? `Paid ₹${requiredAdvance} Advance UPI (Balance to Driver)` :
      "Pay to Driver (Cash/UPI at end)";

    return `Hello Global Air Travels,

I would like to book a cab. Here are my booking details:
*Booking ID:* ${bookingId}
*Trip Category:* ${tripDetails}
*Route:* ${pickup} ➔ ${drop}
*Date & Time:* ${date} at ${time}
*Car Category:* ${selectedCab.name} (${selectedCab.seats} Seater)

*Passenger Details:*
*Name:* ${name}
*Phone:* ${phone}
*Pickup Address:* ${pickupAddress}
${flightNumber ? `*Flight Details:* ${flightNumber}\n` : ""}
*Payment Option:* ${payStatus}
*Assured Fare:* ₹${totalPrice}/-

Please confirm my booking. Thank you!`;
  };

  const handleWhatsAppRedirect = () => {
    window.open(getWhatsAppUrl(getWhatsAppMessage()), "_blank");
    setStep(5);
  };

  const handleOffersClick = () => {
    if (step !== 1) setStep(1);
    setTimeout(() => {
      document.getElementById("promos")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const showComingSoonToast = () => {
    setToastMessage("Coming soon...");
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2200);
  };

  const handleTrackBooking = (e) => {
    e.preventDefault();
    setTrackAttempted(true);
    if (
      trackBookingId.toUpperCase() === bookingId ||
      trackBookingId.toUpperCase() === "GAT-123456" ||
      trackBookingId.toUpperCase() === "GAT-987654"
    ) {
      setTrackedBooking({
        id: trackBookingId.toUpperCase(),
        route: "Mysore ➔ Bangalore Airport KIA",
        car: selectedCab.name,
        date: date || "Tomorrow",
        time: time || "10:00 AM",
        price: totalPrice,
        status: "Confirmed (Driver details assigning 15 mins before reporting)",
      });
    } else {
      setTrackedBooking(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="header">
        <div className="header-container">
          <a href="#" className="logo-link" onClick={() => setStep(1)}>
            <img src={getAssetPath("/icons/nav/cab.svg")} alt="Taxi Logo" className="logo-icon" />
            <span className="logo-text">
              GLOBAL<span className="logo-highlight">AIR</span>TRAVELS
            </span>
          </a>

          <div className="mobile-only header-mobile-actions">
            <a href={`tel:${siteConfig.phone}`} className="mobile-call-icon-btn" aria-label="Call Us">
              <img src={getAssetPath("/icons/call/phone-ring.svg")} alt="" className="nav-icon" width="20" height="20" />
            </a>
            <button type="button" className="mobile-menu-toggle" onClick={() => setShowMobileMenu(true)} aria-label="Open navigation menu">
              <img src={getAssetPath("/icons/nav/menu.svg")} alt="" className="nav-icon" width="24" height="24" />
            </button>
          </div>

          <nav className="desktop-only" aria-label="Main Navigation">
            <ul className="desktop-nav">
              <li>
                <button type="button" className="nav-item-link" onClick={handleOffersClick}>
                  <img src={getAssetPath("/icons/nav/offers-nav.svg")} alt="" className="nav-icon" width="20" height="20" />
                  <span>Offers</span>
                </button>
              </li>
              <li>
                <button type="button" className="nav-item-link" onClick={() => setShowSupport(true)}>
                  <img src={getAssetPath("/icons/nav/support-nav.svg")} alt="" className="nav-icon" width="20" height="20" />
                  <span>Support</span>
                </button>
              </li>
              <li>
                <button type="button" className="btn-login" onClick={openLogin}>
                  Log in
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {showMobileMenu && (
        <div className="mobile-drawer-backdrop" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="logo-text">
                GLOBAL<span className="logo-highlight">AIR</span>TRAVELS
              </span>
              <button type="button" className="drawer-close-btn" onClick={() => setShowMobileMenu(false)}>✕</button>
            </div>
            <div className="mobile-drawer-body">
              <ul className="mobile-drawer-nav">
                <li>
                  <button type="button" className="drawer-nav-link" onClick={() => { setShowMobileMenu(false); handleOffersClick(); }}>
                    <img src={getAssetPath("/icons/nav/offers-nav.svg")} alt="" className="nav-icon" width="18" height="18" />
                    <span>Offers & Promos</span>
                  </button>
                </li>
                <li>
                  <button type="button" className="drawer-nav-link" onClick={() => { setShowMobileMenu(false); setShowSupport(true); }}>
                    <img src={getAssetPath("/icons/nav/support-nav.svg")} alt="" className="nav-icon" width="18" height="18" />
                    <span>Help & Support</span>
                  </button>
                </li>
                <li className="divider"></li>
                <li>
                  <button type="button" className="btn-login" style={{ width: "100%", justifyContent: "center" }} onClick={() => { setShowMobileMenu(false); openLogin(); }}>
                    Log in
                  </button>
                </li>
              </ul>

              <div className="mobile-drawer-footer">
                <a href={`tel:${siteConfig.phone}`} className="drawer-call-btn">
                  📞 Call Support: {siteConfig.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="toast-notification" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}

      <div className="main-wrapper">

        {step === 1 && (
          <nav className="product-switcher-bar" aria-label="Service Type">
            <button
              type="button"
              className={`product-pill ${tripType === "airport" ? "active" : ""}`}
              onClick={() => handleTabChange("airport")}
            >
              <div className="product-icon-wrapper">
                <img src={getAssetPath("/images/airport-transfers.svg")} alt="" className="product-icon" />
              </div>
              <span>Airport Transfers</span>
            </button>
            <button
              type="button"
              className={`product-pill ${tripType === "city" ? "active" : ""}`}
              onClick={() => handleTabChange("city")}
            >
              <div className="product-icon-wrapper">
                <img src={getAssetPath("/images/city-taxi-service.svg")} alt="" className="product-icon" />
              </div>
              <span>City Taxi Service</span>
            </button>
            <button
              type="button"
              className={`product-pill ${tripType === "daily" ? "active" : ""}`}
              onClick={() => handleTabChange("daily")}
            >
              <div className="product-icon-wrapper">
                <img src={getAssetPath("/images/intercity-travel.svg")} alt="" className="product-icon" />
              </div>
              <span>Intercity Travel</span>
            </button>
            <button
              type="button"
              className={`product-pill ${tripType === "tempo" ? "active" : ""}`}
              onClick={() => handleTabChange("tempo")}
            >
              <div className="product-icon-wrapper">
                <img src={getAssetPath("/images/tempo-traveller.svg")} alt="" className="product-icon" />
              </div>
              <span>Tempo Traveller</span>
            </button>
          </nav>
        )}

        {step === 1 ? (
          <div className="cleartrip-grid step-container">
            <div>
              <div className="cleartrip-heading-area">
                <h1 className="cleartrip-title">{siteConfig.sidebarByTripType[tripType].heading.title}</h1>
                <p className="cleartrip-subtitle">{siteConfig.sidebarByTripType[tripType].heading.subtitle}</p>
              </div>

              <div className="cleartrip-card">
                {showTripModeSelector && (
                  <div className="inline-selectors-row">
                    {isOutstationTrip && tripType !== "tempo" ? (
                      <label className="inline-radio-label">
                        <input
                          type="checkbox"
                          checked={outstationDirection === "roundtrip"}
                          onChange={(e) => setOutstationDirection(e.target.checked ? "roundtrip" : "oneway")}
                          className="inline-radio-input"
                        />
                        <span>Round Trip Outstation (1.8x Km base)</span>
                      </label>
                    ) : tripType === "tempo" ? (
                      <span className="inline-radio-label" style={{ fontSize: "0.78rem", color: "var(--text-gray)" }}>
                        Priced at ₹{TEMPO_CAB?.ratePerKm ?? 22}/km · min {TEMPO_CAB?.minKmPerDay ?? 300} km/day · ₹{TEMPO_CAB?.driverAllowance ?? 600}/day driver
                      </span>
                    ) : (
                      <>
                        <label className="inline-radio-label">
                          <input type="radio" name="direction-mode" checked={true} readOnly className="inline-radio-input" />
                          <span>One way</span>
                        </label>
                        <label className="inline-radio-label" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                          <input type="radio" name="direction-mode" checked={false} disabled className="inline-radio-input" />
                          <span>Round trip</span>
                        </label>
                      </>
                    )}
                  </div>
                )}

                <div>
                  {tripType !== "city" && (
                    <div className="cleartrip-input-row">
                      <div className="input-col" style={{ position: "relative" }}>
                        <label htmlFor="pickup-input" className="input-mini-label">From</label>
                        <input
                          id="pickup-input"
                          type="text"
                          className="input-field"
                          value={pickup}
                          onChange={(e) => handlePickupLocationChange(e.target.value)}
                          onFocus={() => setShowPickupSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                          placeholder="Enter pickup city"
                          required
                        />
                        {showPickupSuggestions && (
                          <div className="suggestions-dropdown">
                            {suggestions.pickup.map((s) => (
                              <button key={s} type="button" className="suggestion-item" onMouseDown={() => handlePickupLocationChange(s)}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {!isOutstationTrip && (
                        <button
                          type="button"
                          className="swap-circle-btn"
                          onClick={handleSwapLocations}
                          style={{ "--swap-rotation": `${swapRotation}deg` }}
                          aria-label="Swap pickup and drop locations"
                        >
                          <img src={getAssetPath("/icons/hero/swap.svg")} alt="" className="swap-circle-icon" />
                        </button>
                      )}

                      <div className="input-col" style={{ position: "relative" }}>
                        <label htmlFor="drop-input" className="input-mini-label">To</label>
                        <input
                          id="drop-input"
                          type="text"
                          className="input-field"
                          value={drop}
                          onChange={(e) => handleDropLocationChange(e.target.value)}
                          onFocus={() => setShowDropSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowDropSuggestions(false), 200)}
                          placeholder="Enter destination city"
                          required
                          disabled={isOutstationTrip}
                        />
                        {showDropSuggestions && (
                          <div className="suggestions-dropdown">
                            {suggestions.drop.map((s) => (
                              <button key={s} type="button" className="suggestion-item" onMouseDown={() => handleDropLocationChange(s)}>
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(tripType === "city" || isOutstationTrip) && (
                    <div className="cleartrip-input-row">
                      {tripType === "city" ? (
                        <div className="input-col">
                          <label htmlFor="city-days-input" className="input-mini-label">Number of Days</label>
                          <input
                            id="city-days-input"
                            type="number"
                            className="input-field"
                            value={cityDays}
                            onChange={(e) => {
                              const { value } = e.target;
                              setCityDays(value === "" ? "" : normalizePositiveInteger(value, { max: 30 }));
                            }}
                            onBlur={() => setCityDays(cityDayCount)}
                            min="1"
                            max="30"
                            style={{ border: "none" }}
                          />
                        </div>
                      ) : tripType === "tempo" ? (
                        <>
                          <div className="input-col">
                            <label htmlFor="tempo-days-input" className="input-mini-label">Number of Days</label>
                            <input
                              id="tempo-days-input"
                              type="number"
                              className="input-field"
                              value={tempoDays}
                              onChange={(e) => {
                                const { value } = e.target;
                                setTempoDays(value === "" ? "" : normalizePositiveInteger(value, { max: 30 }));
                              }}
                              onBlur={() => setTempoDays(tempoDayCount)}
                              min="1"
                              max="30"
                              style={{ border: "none" }}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="input-col">
                          <label htmlFor="days-select" className="input-mini-label">Duration</label>
                          <select
                            id="days-select"
                            className="input-field"
                            value={numDays}
                            onChange={(e) => setNumDays(Number(e.target.value))}
                            style={{ border: "none", appearance: "none" }}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                              <option key={d} value={d}>{d} Day{plural(d)} Tour</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="filter-tags-row" aria-label="Included services">
                    <span className="filter-tag included-tag">Tolls Included</span>
                    <span className="filter-tag included-tag">AC Cabs</span>
                    <span className="filter-tag included-tag">Driver Allowance Incl.</span>
                  </div>

                  <div className="cleartrip-bottom-row">
                    <div className="seat-filter" aria-label="Minimum seats">
                      {[3, 5, 7].map((seatCount) => (
                        <button
                          key={seatCount}
                          type="button"
                          className={`seat-filter-btn ${minSeats === seatCount ? "active" : ""}`}
                          onClick={() => setMinSeats(minSeats === seatCount ? 0 : seatCount)}
                          aria-pressed={minSeats === seatCount}
                        >
                          {seatCount}+
                        </button>
                      ))}
                    </div>

                  </div>

                  <div className="inline-cab-preview" style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--primary-navy)", margin: 0 }}>
                          Available Cabs ({filteredCabs.length})
                        </h3>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-gray)" }}>{tripSummaryLabel}</span>
                      </div>

                      <div className="inline-cab-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {filteredCabs.map((cab) => {
                          const cabPrice = calculatePrice(cab);
                          const cabFormula = formatFareFormula(cab);
                          return (
                            <div
                              key={cab.id}
                              className="inline-cab-row"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.6rem 0.75rem",
                                border: "1px solid var(--border-color)",
                                borderRadius: "8px",
                                backgroundColor: "#fff",
                              }}
                            >
                              <img
                                src={getAssetPath(`/icons/${cab.icon}`)}
                                alt=""
                                style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary-navy)" }}>{cab.name}</div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-gray)" }}>
                                  {cab.seats} Seats • {cab.luggage} {cab.ac ? "• AC" : ""}
                                </div>
                                <div style={{ fontSize: "0.68rem", color: "var(--text-gray)", marginTop: "0.15rem" }}>e.g. {cab.example}</div>
                                {cabFormula && (
                                  <div style={{ fontSize: "0.68rem", color: "var(--primary-navy)", marginTop: "0.2rem", fontWeight: 600, lineHeight: 1.35 }}>
                                    {cabFormula}
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--primary-orange)" }}>₹{cabPrice}</div>
                                <div style={{ fontSize: "0.65rem", color: "var(--text-gray)" }}>Assured</div>
                              </div>
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ minHeight: "32px", padding: "0.35rem 0.75rem", fontSize: "0.75rem", flexShrink: 0 }}
                                onClick={() => handleCabSelect(cab)}
                              >
                                Book
                              </button>
                            </div>
                          );
                        })}
                        {filteredCabs.length === 0 && (
                          <div style={{ textAlign: "center", padding: "1rem", fontSize: "0.8rem", color: "var(--text-gray)" }}>
                            No vehicles match your current filters.
                          </div>
                        )}
                      </div>

                      <p style={{ fontSize: "0.7rem", color: "var(--text-gray)", marginTop: "0.5rem", textAlign: "center" }}>
                        Prices include tolls, driver allowance & GST. No hidden charges.
                      </p>
                    </div>
                </div>
              </div>
            </div>

            <aside className="cleartrip-sidebar">
              {(() => {
                const sidebar = siteConfig.sidebarByTripType[tripType];
                const bannerStyle = sidebar.banner.image
                  ? {
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.45)), url(${getAssetPath(sidebar.banner.image)}), ${sidebar.banner.gradient || "linear-gradient(135deg, #0B3D91 0%, #F26B1F 100%)"}`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "#ffffff",
                    }
                  : {
                      backgroundImage: sidebar.banner.gradient || "linear-gradient(135deg, #0B3D91 0%, #F26B1F 100%)",
                      color: "#ffffff",
                    };

                return (
                  <>
                    <div className="cleartrip-ad-card" style={bannerStyle}>
                      <span className="ad-badge" style={{ backgroundColor: "var(--primary-orange)", color: "#ffffff" }}>{sidebar.banner.badge}</span>
                      <p className="ad-text" style={{ color: "#ffffff", textShadow: "0 1px 3px rgba(0, 0, 0, 0.6)" }}>{sidebar.banner.text}</p>
                      <span className="ad-footer" style={{ color: "#e2e8f0" }}>{sidebar.banner.footer}</span>
                    </div>

                    <div className="cleartrip-sidebar-card">
                      <div className="sidebar-title-row">
                        <h2 className="sidebar-title">{sidebar.quickSelect.title}</h2>
                        <span className="sidebar-link">Quick Select</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {sidebar.quickSelect.items.map((item) => (
                          <button key={item.id} type="button" className="quick-route-btn" onClick={() => handleQuickRouteSelect(item)}>
                            <span className="quick-route-name">{item.name}</span>
                            <span className="quick-route-price">{item.subtitle}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="cleartrip-sidebar-card">
                      <div className="sidebar-title-row">
                        <h2 className="sidebar-title">{sidebar.info.title}</h2>
                      </div>
                      <ul style={{ paddingLeft: "1rem", fontSize: "0.75rem", color: "var(--text-gray)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {sidebar.info.items.map((line, idx) => (
                          <li key={idx} dangerouslySetInnerHTML={{ __html: line.replace(/(₹[\d,]+)/g, "<strong>$1</strong>") }} />
                        ))}
                      </ul>
                    </div>

                    {applicablePromos.length > 0 && (
                      <section className="cleartrip-promo-row sidebar-promo-row" id="promos" aria-label="Offers and Promotions">
                        {applicablePromos.map((promo, idx) => {
                          const tag = (promo.appliesTo || []).join(" • ").toUpperCase() || "OFFER";
                          const title =
                            promo.type === "percent"
                              ? `${promo.value}% Off${promo.maxDiscount ? ` (max ₹${promo.maxDiscount})` : ""}`
                              : `Flat ₹${promo.value} Off`;
                          return (
                            <div key={promo.code} className="promo-card">
                              <div className="promo-img-box" style={{ color: PROMO_PALETTE[idx % PROMO_PALETTE.length] }}>
                                {PROMO_ICONS[idx % PROMO_ICONS.length]}
                              </div>
                              <div className="promo-info">
                                <span className="promo-tag">{tag}</span>
                                <h3 className="promo-title">{title}</h3>
                                <p className="promo-desc">
                                  {promo.label}
                                  {promo.minFare ? ` Min fare ₹${promo.minFare}.` : ""} Code: <strong>{promo.code}</strong>
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </section>
                    )}
                  </>
                );
              })()}
            </aside>
          </div>
        ) : (
          <div className="stepper-result step-container">
            {/* Step 2: Cab Selection */}
            {step === 2 && (
              <div>
                <div className="route-summary-bar">
                  <div className="route-summary-info">
                    <span className="route-summary-cities">{pickup} ➔ {drop}</span>
                    <span className="route-summary-details">Date: {date} at {time} • {tripSummaryLabel}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ minHeight: "32px", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                    onClick={() => setStep(1)}
                  >
                    Modify
                  </button>
                </div>

                <h2 className="quick-routes-title" style={{ marginBottom: "1rem" }}>Available Vehicles ({filteredCabs.length})</h2>
                <div className="cab-list">
                  {filteredCabs.map((cab) => {
                    const cabPrice = calculatePrice(cab);
                    const isSelected = selectedCab.id === cab.id;
                    return (
                      <div key={cab.id} className={`cab-card ${isSelected ? "selected" : ""}`}>
                        <div className="cab-card-header">
                          <div className="cab-icon-box">
                            <img src={getAssetPath(`/icons/${cab.icon}`)} alt="" className="cab-icon-img" />
                          </div>
                          <div className="cab-meta">
                            <div className="cab-name-row">
                              <h3 className="cab-name">{cab.name}</h3>
                              <div className="cab-price-col">
                                <span className="cab-price">₹{cabPrice}</span>
                                <span className="cab-price-subtext"> (Assured)</span>
                              </div>
                            </div>
                            <p className="cab-example">e.g. {cab.example}</p>
                            <div className="cab-specs">
                              <span className="cab-spec-badge">👤 {cab.seats} Seats</span>
                              <span className="cab-spec-badge">💼 {cab.luggage}</span>
                              <span className="cab-spec-badge">{cab.ac ? "❄️ AC" : "Non-AC"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="cab-inclusions-card">
                          {tripType === "tempo" ? (
                            <>
                              <div className="cab-inclusions-title">Tempo Per-Km Rate Breakdown</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-gray)" }}>
                                {`₹${cab.ratePerKm}/km × ${getTempoEffectiveKm(cab)} km + ₹${cab.driverAllowance}/day × ${tempoDayCount} day${plural(tempoDayCount)} driver = ₹${cabPrice}`}
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                                Min {cab.minKmPerDay} km/day applies · {tempoDayCount} day{plural(tempoDayCount)} · Extra km billed @ ₹{cab.ratePerKm}/km
                              </div>
                            </>
                          ) : tripType === "city" ? (
                            <>
                              <div className="cab-inclusions-title">City Taxi Per-Day Rate Breakdown</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-gray)" }}>
                                {cityDayCount > 1
                                  ? `(₹${cab.ratePerKm}/km × ${cab.minKmPerDay} km/day + ₹${cab.driverAllowance}/day driver) × ${cityDayCount} days = ₹${cabPrice}`
                                  : `₹${cab.ratePerKm}/km × ${cab.minKmPerDay} km/day + ₹${cab.driverAllowance}/day driver = ₹${cabPrice}`}
                              </div>
                              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                                Includes {cab.minKmPerDay} km/day · {cityDayCount} day{plural(cityDayCount)} · Extra km billed @ ₹{cab.ratePerKm}/km
                              </div>
                            </>
                          ) : isOutstationTrip ? (
                            <>
                              <div className="cab-inclusions-title">Outstation Per-Day Rates</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-gray)" }}>
                                Running: ₹{cab.ratePerKm}/km (min {cab.minKmPerDay} km/day) + ₹{cab.driverAllowance}/day Driver allowance.
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="cab-inclusions-title">Inclusions (No Extra Costs)</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-gray)" }}>
                                Toll charges, state tax permit, driver allowance, and GST are included.
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn-primary"
                          style={{
                            marginTop: "0.5rem",
                            backgroundColor: isSelected ? "var(--primary-navy)" : "var(--primary-orange)",
                          }}
                          onClick={() => handleCabSelect(cab)}
                        >
                          {isSelected ? "Confirm & Proceed" : "Select This Car"}
                        </button>
                      </div>
                    );
                  })}
                  {filteredCabs.length === 0 && (
                    <div className="booking-card" style={{ textAlign: "center", padding: "2rem" }}>
                      <p style={{ fontWeight: 600 }}>No vehicles match your active filters.</p>
                      <button type="button" className="btn-secondary" style={{ marginTop: "1rem", display: "inline-flex" }} onClick={() => setMinSeats(0)}>
                        Clear Seating Filter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Passenger Info */}
            {step === 3 && (
              <div className="booking-card">
                <h2 className="quick-routes-title" style={{ marginBottom: "1rem" }}>Passenger Information</h2>
                <form onSubmit={handlePassengerSubmit} className="passenger-form">
                  <div className="form-group">
                    <label htmlFor="cust-name" className="form-label">Passenger Name</label>
                    <div className="input-wrapper">
                      <img src={getAssetPath("/icons/nav/login.svg")} alt="" className="input-icon" />
                      <input
                        id="cust-name"
                        type="text"
                        className="form-input"
                        placeholder="Enter full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cust-phone" className="form-label">WhatsApp Mobile Number</label>
                    <div className="input-wrapper">
                      <img src={getAssetPath("/icons/footer/phone.svg")} alt="" className="input-icon" />
                      <input
                        id="cust-phone"
                        type="tel"
                        className="form-input"
                        placeholder="10-digit phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        pattern="[6-9][0-9]{9}"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cust-email" className="form-label">Email Address (Optional)</label>
                    <div className="input-wrapper">
                      <img src={getAssetPath("/icons/footer/email.svg")} alt="" className="input-icon" />
                      <input
                        id="cust-email"
                        type="email"
                        className="form-input"
                        placeholder="For booking receipts"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cust-address" className="form-label">Full Pickup Address</label>
                    <div className="input-wrapper">
                      <img src={getAssetPath("/icons/hero/pickup.svg")} alt="" className="input-icon" style={{ alignSelf: "flex-start", marginTop: "0.8rem" }} />
                      <textarea
                        id="cust-address"
                        className="form-input"
                        style={{ minHeight: "80px", padding: "0.5rem 0.75rem 0.5rem 2.25rem", resize: "vertical" }}
                        placeholder="Enter reporting address, landmark, or specific flight details"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        required
                        autoComplete="street-address"
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Back</button>
                    <button type="submit" className="btn-primary">Confirm Address Details ➔</button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 4: Booking Checkout */}
            {step === 4 && (
              <div className="booking-card">
                <h2 className="quick-routes-title" style={{ marginBottom: "1rem" }}>Confirm Booking Invoice</h2>
                <div className="payment-section">
                  <div className="trip-bill-summary">
                    <div className="bill-title">Summary of Charges</div>
                    <div className="bill-row">
                      <span>Vehicle Selected:</span>
                      <span style={{ fontWeight: 600 }}>{selectedCab.name}</span>
                    </div>
                    <div className="bill-row">
                      <span>Trip:</span>
                      <span>{pickup} to {drop}</span>
                    </div>
                    <div className="bill-row">
                      <span>Reporting Time:</span>
                      <span>{date} at {time}</span>
                    </div>
                    {tripType === "city" && (() => {
                      const totalKm = selectedCab.minKmPerDay * cityDayCount;
                      const runningCharges = selectedCab.ratePerKm * totalKm;
                      const driverCharges = selectedCab.driverAllowance * cityDayCount;
                      return (
                        <>
                          <div className="bill-row">
                            <span>Duration:</span>
                            <span>{cityDayCount} Day{plural(cityDayCount)} · {selectedCab.minKmPerDay} km/day included</span>
                          </div>
                          <div className="bill-row">
                            <span>Running ({totalKm} km × ₹{selectedCab.ratePerKm}/km):</span>
                            <span>₹{runningCharges}</span>
                          </div>
                          <div className="bill-row">
                            <span>Driver allowance ({cityDayCount} day{plural(cityDayCount)} × ₹{selectedCab.driverAllowance}):</span>
                            <span>₹{driverCharges}</span>
                          </div>
                        </>
                      );
                    })()}
                    {tripType === "tempo" && (() => {
                      const effectiveKm = getTempoEffectiveKm(selectedCab);
                      const runningCharges = selectedCab.ratePerKm * effectiveKm;
                      const driverCharges = selectedCab.driverAllowance * tempoDayCount;
                      return (
                        <>
                          <div className="bill-row">
                            <span>Duration / Est. Km:</span>
                            <span>{tempoDayCount} Day{plural(tempoDayCount)} · ~{tempoKmCount} km (billed {effectiveKm} km)</span>
                          </div>
                          <div className="bill-row">
                            <span>Running ({effectiveKm} km × ₹{selectedCab.ratePerKm}/km):</span>
                            <span>₹{runningCharges}</span>
                          </div>
                          <div className="bill-row">
                            <span>Driver allowance ({tempoDayCount} day{plural(tempoDayCount)} × ₹{selectedCab.driverAllowance}):</span>
                            <span>₹{driverCharges}</span>
                          </div>
                        </>
                      );
                    })()}
                    {tripType === "daily" && (
                      <div className="bill-row">
                        <span>Duration:</span>
                        <span>{numDays} Day{plural(numDays)} Tour</span>
                      </div>
                    )}
                    <div className="bill-row total">
                      <span>Total Assured Fare:</span>
                      <span>₹{totalPrice}</span>
                    </div>
                  </div>

                  <h3 className="form-label">Payment Preference</h3>
                  <div className="payment-methods" role="radiogroup" aria-label="Payment Mode">
                    <div className={`payment-method-card ${paymentMethod === "arrival" ? "selected" : ""}`} onClick={() => setPaymentMethod("arrival")}>
                      <input type="radio" id="radio-arrival" name="payment-preference" checked={paymentMethod === "arrival"} onChange={() => {}} className="payment-radio" />
                      <div className="payment-method-info">
                        <label htmlFor="radio-arrival" className="payment-method-name">Pay to Driver (Cash/UPI)</label>
                        <span className="payment-method-desc">Pay ₹{totalPrice} directly to driver at the end of the trip.</span>
                      </div>
                    </div>

                    <div className={`payment-method-card ${paymentMethod === "advance" ? "selected" : ""}`} onClick={() => setPaymentMethod("advance")}>
                      <input type="radio" id="radio-advance" name="payment-preference" checked={paymentMethod === "advance"} onChange={() => {}} className="payment-radio" />
                      <div className="payment-method-info">
                        <label htmlFor="radio-advance" className="payment-method-name">
                          Pay Booking Advance (₹{requiredAdvance})
                          <span className="payment-badge">Leaflet Policy</span>
                        </label>
                        <span className="payment-method-desc">Pay ₹{requiredAdvance} now via GPay/PhonePe to secure booking. Pay balance ₹{payToDriverAmount} to driver.</span>
                      </div>
                    </div>

                    <div className={`payment-method-card ${paymentMethod === "full" ? "selected" : ""}`} onClick={() => setPaymentMethod("full")}>
                      <input type="radio" id="radio-full" name="payment-preference" checked={paymentMethod === "full"} onChange={() => {}} className="payment-radio" />
                      <div className="payment-method-info">
                        <label htmlFor="radio-full" className="payment-method-name">
                          Pay Full Online (₹{totalPrice})
                          <span className="payment-badge">Zero Fees</span>
                        </label>
                        <span className="payment-method-desc">Pay full ₹{totalPrice} online now using GPay/PhonePe/UPI.</span>
                      </div>
                    </div>
                  </div>

                  {paymentMethod !== "arrival" && (() => {
                    const upiLink = generateUpiLink();
                    return (
                      <div className="upi-gateway-container">
                        <div className="upi-brands">
                          <img src={getAssetPath("/icons/upi.svg")} alt="UPI Logo" className="upi-brand-icon" style={{ height: 16 }} />
                          <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#5f259f" }}>GPay/PhonePe Gateway</span>
                        </div>
                        <div className="qr-instructions">
                          <span style={{ display: "block", fontWeight: 700, fontSize: "1.05rem", color: "var(--primary-navy)" }}>
                            Amount to Pay: ₹{onlinePaymentAmount}
                          </span>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-gray)" }}>
                            Account Holder: <strong>{siteConfig.merchantName}</strong>
                          </span>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-gray)" }}>
                            GPay/PhonePe Number: <strong>{siteConfig.phoneDisplay}</strong>
                          </span>
                        </div>
                        <div className="qr-code-box">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiLink)}`}
                            alt="Scan QR"
                            className="qr-mock-img"
                          />
                        </div>
                        <div className="pay-btn-group">
                          <a href={upiLink} className="btn-phonepe-pay">📱 Pay via UPI Apps</a>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pay-btn-group" style={{ marginTop: "1rem" }}>
                    <button type="button" className="btn-whatsapp-confirm" onClick={handleWhatsAppRedirect}>
                      <img src={WHATSAPP_ICON_PATH} alt="" className="whatsapp-icon-white" />
                      Send Booking Request on WhatsApp
                    </button>
                    <button type="button" className="btn-primary" onClick={() => setStep(5)}>
                      Confirm Booking (Pay on Arrival)
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setStep(3)}>Back</button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Booking Success */}
            {step === 5 && (
              <div className="booking-card success-card">
                <div className="success-badge">
                  <img src={getAssetPath("/icons/verified.svg")} alt="" className="success-icon-svg" />
                </div>
                <h2 className="success-title">Trip Registered!</h2>
                <p className="success-desc">
                  Thank you, {name}! Your trip has been registered. We are preparing your allotment details.
                </p>

                <div className="booking-summary-box">
                  <div className="booking-summary-title">Booking ID: {bookingId}</div>
                  <div className="bill-row">
                    <span>Passenger:</span>
                    <span style={{ fontWeight: 600 }}>{name}</span>
                  </div>
                  <div className="bill-row">
                    <span>Route:</span>
                    <span>{pickup} to {drop}</span>
                  </div>
                  <div className="bill-row">
                    <span>Date & Time:</span>
                    <span>{date} at {time}</span>
                  </div>
                  <div className="bill-row">
                    <span>Vehicle Type:</span>
                    <span>{selectedCab.name} (AC)</span>
                  </div>
                  <div className="bill-row" style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                    <span>Payment Mode:</span>
                    <span style={{ fontWeight: 600, color: "var(--primary-orange)" }}>
                      {paymentMethod === "full"
                        ? "Paid Full Online"
                        : paymentMethod === "advance"
                        ? `Paid ₹${requiredAdvance} (₹${payToDriverAmount} to Driver)`
                        : `Pay Driver ₹${totalPrice} at Trip End`}
                    </span>
                  </div>
                </div>

                <div className="pay-btn-group">
                  <a
                    href={getWhatsAppUrl(getWhatsAppMessage())}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-whatsapp-confirm"
                  >
                    <img src={WHATSAPP_ICON_PATH} alt="" className="whatsapp-icon-white" />
                    Send Details on WhatsApp
                  </a>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setStep(1);
                      setPaymentMethod("arrival");
                      setName("");
                      setPhone("");
                      setEmail("");
                      setPickupAddress("");
                      setFlightNumber("");
                      setBookingId(createBookingId());
                    }}
                  >
                    Book Another Cab
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <a href={getWhatsAppUrl()} className="whatsapp-float" target="_blank" rel="noreferrer" aria-label="WhatsApp support">
        <img src={WHATSAPP_ICON_PATH} alt="WhatsApp" className="whatsapp-float-icon" />
      </a>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <span className="footer-logo">{siteConfig.name.toUpperCase()}</span>
              <p className="footer-description">{siteConfig.footer.description}</p>
              <div className="footer-contact">
                <a href={`tel:${siteConfig.phone}`} className="footer-link">Call: {siteConfig.phoneDisplay}</a>
                <a href={getWhatsAppUrl()} className="footer-link">WhatsApp: {siteConfig.whatsappDisplay}</a>
                <a href={`mailto:${siteConfig.email}`} className="footer-link">Email: {siteConfig.email}</a>
              </div>
            </div>

            <div className="footer-section">
              <h2 className="footer-heading">Offices</h2>
              <div className="footer-office-list">
                {siteConfig.footer.offices.map((office) => (
                  <details key={office.title} className="footer-office">
                    <summary className="footer-office-summary">{office.title}</summary>
                    <address className="footer-address">
                      <span>{office.name}</span>
                      <span>{office.address}</span>
                      <a href={`tel:${office.phone}`} className="footer-link">{office.phoneDisplay}</a>
                      {office.email && (
                        <a href={`mailto:${office.email}`} className="footer-link">{office.email}</a>
                      )}
                    </address>
                  </details>
                ))}
              </div>
            </div>

            <div className="footer-section">
              <h2 className="footer-heading">{siteConfig.footer.bankDetails.title}</h2>
              <dl className="footer-bank-list">
                <div><dt>Bank</dt><dd>{siteConfig.footer.bankDetails.bank}</dd></div>
                <div><dt>Current A/c Number</dt><dd>{siteConfig.footer.bankDetails.accountNumber}</dd></div>
                <div><dt>Name</dt><dd>{siteConfig.footer.bankDetails.accountName}</dd></div>
                <div><dt>Branch</dt><dd>{siteConfig.footer.bankDetails.branch}</dd></div>
                <div><dt>IFSC code</dt><dd>{siteConfig.footer.bankDetails.ifsc}</dd></div>
              </dl>
            </div>
          </div>
          <div className="footer-copy">
            Copyright &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ===== MODALS ===== */}

      {showMyBookings && (
        <div className="modal-backdrop" onClick={() => setShowMyBookings(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setShowMyBookings(false)}>✕</button>
            <h2 className="modal-title">
              <img src={getAssetPath("/icons/booking-flow/confirmed.svg")} alt="" className="nav-icon" width="20" height="20" style={{ color: "var(--primary-orange)" }} />
              <span>Track Your Booking</span>
            </h2>
            <div className="modal-body">
              {!trackedBooking ? (
                <form onSubmit={handleTrackBooking}>
                  <p style={{ marginBottom: "0.85rem", fontSize: "0.85rem", color: "var(--text-gray)" }}>
                    Enter your booking reference ID to check current status and allotment.
                  </p>
                  <label htmlFor="track-id" className="form-label" style={{ fontWeight: 600 }}>Booking ID</label>
                  <input
                    id="track-id"
                    type="text"
                    className="modal-input"
                    placeholder="e.g. GAT-123456"
                    value={trackBookingId}
                    onChange={(e) => setTrackBookingId(e.target.value)}
                    required
                  />
                  <label htmlFor="track-tel" className="form-label" style={{ fontWeight: 600 }}>Mobile Number</label>
                  <input
                    id="track-tel"
                    type="tel"
                    className="modal-input"
                    placeholder="10-digit number"
                    value={trackPhone}
                    onChange={(e) => setTrackPhone(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem" }}>Search Trip Status ➔</button>
                  {trackAttempted && (
                    <p style={{ color: "var(--error-red)", fontSize: "0.75rem", marginTop: "0.5rem", fontWeight: 600 }}>
                      No active bookings found for ID: {trackBookingId}. Try typing your active ID: {bookingId}
                    </p>
                  )}
                </form>
              ) : (
                <div>
                  <div className="booking-summary-box" style={{ margin: "0.5rem 0 1rem" }}>
                    <div className="booking-summary-title" style={{ color: "var(--success-green)" }}>
                      Status: {trackedBooking.status}
                    </div>
                    <div className="bill-row" style={{ fontSize: "0.8rem", marginBlock: "0.2rem" }}>
                      <span>Booking ID:</span><strong>{trackedBooking.id}</strong>
                    </div>
                    <div className="bill-row" style={{ fontSize: "0.8rem", marginBlock: "0.2rem" }}>
                      <span>Route:</span><span>{trackedBooking.route}</span>
                    </div>
                    <div className="bill-row" style={{ fontSize: "0.8rem", marginBlock: "0.2rem" }}>
                      <span>Vehicle:</span><span>{trackedBooking.car}</span>
                    </div>
                    <div className="bill-row" style={{ fontSize: "0.8rem", marginBlock: "0.2rem" }}>
                      <span>Reporting:</span><span>{trackedBooking.date} at {trackedBooking.time}</span>
                    </div>
                    <div className="bill-row" style={{ fontSize: "0.8rem", marginBlock: "0.2rem" }}>
                      <span>Assured Cost:</span><strong>₹{trackedBooking.price}</strong>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <a
                      href={getWhatsAppUrl("Hello Global Air Travels, please verify status of Booking ID " + trackedBooking.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-whatsapp-confirm"
                      style={{ flex: 1, textDecoration: "none" }}
                    >
                      Verify on WhatsApp
                    </a>
                    <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setTrackedBooking(null)}>
                      Search Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSupport && (
        <div className="modal-backdrop" onClick={() => setShowSupport(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setShowSupport(false)}>✕</button>
            <h2 className="modal-title">
              <img src={getAssetPath("/icons/nav/support-nav.svg")} alt="" className="nav-icon" width="20" height="20" style={{ color: "var(--primary-orange)" }} />
              <span>Customer Helpdesk</span>
            </h2>
            <div className="modal-body">
              <p style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-gray)" }}>
                Need help with your booking? Contact our Mysore booking office directly:
              </p>
              <div className="booking-summary-box" style={{ margin: "0.5rem 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div>📞 <strong>Call booking manager:</strong> <a href={`tel:${siteConfig.phone}`} style={{ color: "var(--primary-blue)", fontWeight: 700 }}>{siteConfig.phoneDisplay}</a></div>
                <div>💬 <strong>WhatsApp Chat:</strong> <a href={getWhatsAppUrl()} target="_blank" rel="noreferrer" style={{ color: "var(--success-green)", fontWeight: 700 }}>{siteConfig.whatsappDisplay}</a></div>
                <div>✉️ <strong>Email Address:</strong> <a href={`mailto:${siteConfig.email}`} style={{ color: "var(--primary-blue)" }}>{siteConfig.email}</a></div>
                <div>📍 <strong>Registered Office:</strong> Mysore, Karnataka, India</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
