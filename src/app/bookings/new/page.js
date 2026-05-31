"use client";

import { useState, useEffect, useRef } from "react";
import { siteConfig } from "@/config/site";
import { bookingConfig } from "@/lib/booking-config";
import { useAuth } from "@/context/AuthProvider";
import AuthControl from "@/components/auth/AuthControl";

const createBookingId = () => `GAT-${Math.floor(100000 + Math.random() * 900000)}`;

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
};

const isTempoCab = (cab) => cab.id.startsWith("tempo");
const TEMPO_CAB = bookingConfig.cabTypes.find(isTempoCab);

const TRIP_TYPE_TO_BOOKING_TYPE = {
  airport: "airport",
  city: "city",
  daily: "intercity",
  tempo: "tempo",
};

const TRIP_TYPE_ICON = {
  airport: "/images/airport-transfers.svg",
  daily: "/images/intercity-travel.svg",
  city: "/images/city-taxi-service.svg",
  tempo: "/images/tempo-traveller.svg",
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

export default function BookingNew() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(3);
  const [tripType, setTripType] = useState("airport");
  const [airportType, setAirportType] = useState("drop");
  const [cityType, setCityType] = useState("drop");
  const [outstationDirection, setOutstationDirection] = useState("oneway");
  const [numDays, setNumDays] = useState(1);
  const [cityDays, setCityDays] = useState(1);
  const [tempoDays, setTempoDays] = useState(1);
  const [tempoEstKm, setTempoEstKm] = useState(300);

  const [pickup, setPickup] = useState("Mysuru");
  const [drop, setDrop] = useState("Bangalore Airport (KIA)");
  const [date, setDate] = useState(getTomorrowDate);
  const [time, setTime] = useState("10:00");
  const [selectedCab, setSelectedCab] = useState(bookingConfig.cabTypes[0]);

  // Passenger state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPincode, setAddrPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("full");
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Modals / Misc
  const [bookingId, setBookingId] = useState(createBookingId);
  const [showSupport, setShowSupport] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [trackBookingId, setTrackBookingId] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackedBooking, setTrackedBooking] = useState(null);
  const [trackAttempted, setTrackAttempted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryBookingType = params.get("booking_type");
    const queryCab = params.get("cab");

    if (!queryBookingType || !queryCab) {
      window.location.href = `${BASE_PATH}/`;
      return;
    }

    const timer = setTimeout(() => {
      let tType = "airport";
      if (queryBookingType === "city") tType = "city";
      else if (queryBookingType === "intercity") tType = "daily";
      else if (queryBookingType === "tempo") tType = "tempo";
      setTripType(tType);

      const qPickup = params.get("pickup");
      if (qPickup) {
        setPickup(qPickup);
        if (qPickup.toLowerCase().includes("airport")) {
          setAirportType("pickup");
        }
      }

      const qDrop = params.get("drop");
      if (qDrop) {
        setDrop(qDrop);
        if (qDrop.toLowerCase().includes("airport")) {
          setAirportType("drop");
        }
      }

      const qDays = params.get("days");
      if (qDays) {
        const daysNum = Number(qDays);
        setCityDays(daysNum);
        setTempoDays(daysNum);
      }

      const foundCab = bookingConfig.cabTypes.find((c) => c.id === queryCab);
      if (foundCab) {
        setSelectedCab(foundCab);
      }

      setLoading(false);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Prefill passenger fields from the signed-in user's profile (once), without
  // clobbering anything they've already typed. setTimeout keeps the state writes
  // out of the synchronous effect body (avoids react-hooks/set-state-in-effect).
  const prefilledFor = useRef(null);
  useEffect(() => {
    if (!profile || prefilledFor.current === profile.uid) return undefined;
    const timer = setTimeout(() => {
      prefilledFor.current = profile.uid;
      if (profile.name) setName((v) => v || profile.name);
      if (profile.email) setEmail((v) => v || profile.email);
      const digits = (profile.phone || "").replace(/\D/g, "").slice(-10);
      if (digits) setPhone((v) => v || digits);
      if (profile.line1) setAddrLine1((v) => v || profile.line1);
      if (profile.line2) setAddrLine2((v) => v || profile.line2);
      if (profile.city) setAddrCity((v) => v || profile.city);
      if (profile.state) setAddrState((v) => v || profile.state);
      if (profile.pincode) setAddrPincode((v) => v || profile.pincode);
    }, 0);
    return () => clearTimeout(timer);
  }, [profile]);

  const cityDayCount = normalizePositiveInteger(cityDays, { max: 30 });
  const tempoDayCount = normalizePositiveInteger(tempoDays, { max: 30 });
  const tempoKmCount = normalizePositiveInteger(tempoEstKm);

  const tripSummaryLabel =
    tripType === "airport" ? "Airport Transfers" :
    tripType === "city" ? `Local/Outstation Taxi (${cityDayCount} Day${plural(cityDayCount)})` :
    tripType === "tempo" ? `Tempo Travellers (${tempoDayCount} Day${plural(tempoDayCount)})` :
    "Intercity Travels";

  const getTempoEffectiveKm = (cab) =>
    Math.max(tempoKmCount, tempoDayCount * cab.minKmPerDay);

  const calculatePrice = (cab) => {
    if (!cab) return 0;
    if (tripType === "airport") return cab.airportPrice;
    if (tripType === "daily") return cab.intercityPrice;
    if (tripType === "city") return (cab.ratePerKm * cab.minKmPerDay + cab.driverAllowance) * cityDayCount;
    if (tripType === "tempo") {
      return getTempoEffectiveKm(cab) * cab.ratePerKm + tempoDayCount * cab.driverAllowance;
    }
    return 0;
  };

  const totalPrice = calculatePrice(selectedCab);

  const advanceDays =
    tripType === "city" ? cityDayCount :
    tripType === "tempo" ? tempoDayCount : 1;
  const requiredAdvance = 500 * advanceDays;

  const bookingTypeId = TRIP_TYPE_TO_BOOKING_TYPE[tripType];
  const applicablePromos = bookingConfig.promos.filter(
    (promo) => !promo.appliesTo || promo.appliesTo.length === 0 || promo.appliesTo.includes(bookingTypeId)
  );

  const promoDiscount = appliedPromo
    ? appliedPromo.type === "percent"
      ? Math.min(
          Math.floor((totalPrice * appliedPromo.value) / 100),
          appliedPromo.maxDiscount ?? Infinity
        )
      : appliedPromo.value
    : 0;
  const finalTotal = Math.max(0, totalPrice - promoDiscount);

  const onlinePaymentAmount = paymentMethod === "full" ? finalTotal : paymentMethod === "advance" ? requiredAdvance : 0;
  const payToDriverAmount = finalTotal - onlinePaymentAmount;

  const handleApplyPromo = (promo) => {
    if (appliedPromo?.code === promo.code) {
      setAppliedPromo(null);
    } else if (paymentMethod === "advance") {
      setToastMessage("Coupons are only applicable for full online payments");
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 2500);
    } else if (!promo.minFare || totalPrice >= promo.minFare) {
      setAppliedPromo(promo);
    } else {
      setToastMessage(`Min fare ₹${promo.minFare} required for this offer`);
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 2500);
    }
  };

  const handleSelectPaymentMethod = (method) => {
    setPaymentMethod(method);
    if (method === "advance" && appliedPromo) {
      setAppliedPromo(null);
      setToastMessage("Coupon removed. Coupons are only applicable for full online payments.");
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 2500);
    }
  };

  const handlePassengerSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone || !pickupAddress) {
      alert("Please fill in name, phone, and pickup address.");
      return;
    }
    setStep(5);
  };

  const getWhatsAppMessage = () => {
    let tripDetails;
    if (tripType === "airport") {
      tripDetails = `Airport Transfers (${airportType === "drop" ? "Mysore to Airport" : "Airport to Mysore"})`;
    } else if (tripType === "city") {
      tripDetails = `Local & Outstation Taxi (${cityDayCount} Day${plural(cityDayCount)} · ${selectedCab.minKmPerDay} km/day & driver allowance included)`;
    } else if (tripType === "tempo") {
      const effectiveKm = getTempoEffectiveKm(selectedCab);
      tripDetails = `Tempo Travellers (${tempoDayCount} Day${plural(tempoDayCount)} / ~${tempoKmCount} km estimated · ${effectiveKm} km billed @ ₹${selectedCab.ratePerKm}/km)`;
    } else if (tripType === "daily") {
      tripDetails = "Intercity Travels (One Way)";
    } else {
      tripDetails = `Intercity Travels (${numDays} Day${plural(numDays)})`;
    }

    const payStatus =
      paymentMethod === "full" ? "Paid 100% Full UPI" :
      `Paid ₹${requiredAdvance} Advance UPI (Balance to Driver)`;

    return `Hello Global Air Travels,

I would like to book a cab. Here are my booking details:
*Booking ID:* ${bookingId}
*Trip Category:* ${tripDetails}
*Route:* ${pickup} ➔ ${drop}
*Date & Time:* ${date || "Tomorrow"} at ${time}
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

  const handleOffersClick = () => {
    window.location.href = `${BASE_PATH}/#promos`;
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

  if (loading) {
    return (
      <div style={{ display: "flex", flexFlow: "column nowrap", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--slate-50)", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid #cbd5e1", borderTopColor: "var(--primary-orange)", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
          <h2 style={{ color: "var(--primary-navy)", fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Setting up your secure booking invoice...</h2>
          <p style={{ color: "var(--text-gray)", fontSize: "0.8rem", marginTop: "0.5rem" }}>Please wait a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "white" }}>
      <header className="header">
        <div className="header-container">
          <a href="#" className="logo-link" onClick={() => window.location.href = `${BASE_PATH}/`}>
            <img src={getAssetPath("/logo/logo.svg")} alt="Global Air Travels Logo" className="logo-image" />
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
                <AuthControl variant="desktop" />
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {showMobileMenu && (
        <div className="mobile-drawer-backdrop" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <img src={getAssetPath("/logo/logo.svg")} alt="Global Air Travels Logo" className="logo-image" />
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
                  <AuthControl variant="mobile" onNavigate={() => setShowMobileMenu(false)} />
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
        <div className="stepper-result step-container booking-page">
          
          {/* Step 3: Passenger Info */}
          {step === 3 && (
            <div className="booking-card">
              <div className="booking-two-col">

                {/* LEFT on desktop / BOTTOM on mobile: Passenger fields */}
                <div className="booking-fields">
                  {/* airport route banner */}
                  {tripType === "airport" && (
                    <div style={{ background: "var(--primary-navy-light)", borderRadius: "var(--border-radius)", padding: "0.75rem 1rem", border: "1px solid #d3e4fd", fontSize: "0.82rem", color: "var(--primary-navy-dark)", fontWeight: 600, marginBottom: "0.25rem" }}>
                      {airportType === "drop" ? "✈️  Mysore → Bangalore Airport (Drop)" : "✈️  Bangalore Airport → Mysore (Pickup)"}
                    </div>
                  )}

                  <form onSubmit={handlePassengerSubmit}>

                    {/* ── Section 1: Booking Dates ── */}
                    <div style={{ padding: "1.5rem 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                        <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", border: "2px solid var(--text-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-dark)", flexShrink: 0 }}>1</div>
                        <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--text-dark)" }}>Booking Dates</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="form-group">
                          <label htmlFor="reporting-date" className="form-label">Booking Date</label>
                          <input id="reporting-date" type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required min={new Date().toISOString().split("T")[0]} />
                        </div>
                        <div className="form-group">
                          <label htmlFor="reporting-time" className="form-label">Booking Time</label>
                          <input id="reporting-time" type="time" className="form-input" value={time} onChange={(e) => setTime(e.target.value)} required />
                        </div>
                      </div>
                      {tripType === "city" && (
                        <div className="form-group" style={{ marginTop: "1rem" }}>
                          <label htmlFor="city-days-input" className="form-label">Number Of Days</label>
                          <input id="city-days-input" type="number" className="form-input" value={cityDays}
                            onChange={(e) => { const { value } = e.target; setCityDays(value === "" ? "" : normalizePositiveInteger(value, { max: 30 })); }}
                            onBlur={() => setCityDays(cityDayCount)} min="1" max="30" required />
                        </div>
                      )}
                      {tripType === "tempo" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                          <div className="form-group">
                            <label htmlFor="tempo-days-input" className="form-label">Number Of Days</label>
                            <input id="tempo-days-input" type="number" className="form-input" value={tempoDays}
                              onChange={(e) => { const { value } = e.target; setTempoDays(value === "" ? "" : normalizePositiveInteger(value, { max: 30 })); }}
                              onBlur={() => setTempoDays(tempoDayCount)} min="1" max="30" required />
                          </div>
                          <div className="form-group">
                            <label htmlFor="tempo-km-input" className="form-label">Estimated Kilometers</label>
                            <input id="tempo-km-input" type="number" className="form-input" value={tempoEstKm}
                              onChange={(e) => { const { value } = e.target; setTempoEstKm(value === "" ? "" : normalizePositiveInteger(value)); }}
                              onBlur={() => setTempoEstKm(tempoKmCount)} min="1" required />
                          </div>
                        </div>
                      )}
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: 0 }} />

                    {/* ── Section 2: Add Customer Details ── */}
                    <div style={{ padding: "1.5rem 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                        <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", border: "2px solid var(--text-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-dark)", flexShrink: 0 }}>2</div>
                        <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--text-dark)" }}>Add Customer Details</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                        <div className="form-group">
                          <label htmlFor="cust-name" className="form-label">Full Name</label>
                          <input id="cust-name" type="text" className="form-input" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cust-phone" className="form-label">WhatsApp Mobile Number</label>
                          <input id="cust-phone" type="tel" className="form-input" placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} required pattern="[6-9][0-9]{9}" inputMode="tel" autoComplete="tel" />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cust-email" className="form-label">
                            Email Address <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                          </label>
                          <input id="cust-email" type="email" className="form-input" placeholder="For booking confirmation" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cust-address" className="form-label">
                            {tripType === "airport" && airportType === "pickup" ? "Drop address in Mysuru" : "Pickup address"}
                          </label>
                          <textarea
                            id="cust-address"
                            className="form-input"
                            placeholder={
                              tripType === "airport" && airportType === "pickup"
                                ? "Your destination in Mysuru (home / hotel)"
                                : tripType === "airport"
                                ? "Your home / hotel address in Mysuru"
                                : "Reporting address with any landmark"
                            }
                            value={pickupAddress}
                            onChange={(e) => setPickupAddress(e.target.value)}
                            required
                            autoComplete="street-address"
                          />
                        </div>
                        {tripType === "airport" && (
                          <div className="form-group">
                            <label htmlFor="cust-flight" className="form-label">
                              Flight Number <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                            </label>
                            <input id="cust-flight" type="text" className="form-input" placeholder="e.g. 6E-203, AI-820" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} autoComplete="off" />
                          </div>
                        )}
                        <div className="form-group">
                          <label htmlFor="cust-addr-line1" className="form-label">Address Line 1</label>
                          <input id="cust-addr-line1" type="text" className="form-input" placeholder="House / flat, street" value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} autoComplete="address-line1" />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cust-addr-line2" className="form-label">
                            Address Line 2 <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                          </label>
                          <input id="cust-addr-line2" type="text" className="form-input" placeholder="Area, landmark" value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} autoComplete="address-line2" />
                        </div>
                        <div className="account-grid-3">
                          <div className="form-group">
                            <label htmlFor="cust-addr-city" className="form-label">City</label>
                            <input id="cust-addr-city" type="text" className="form-input" placeholder="City" value={addrCity} onChange={(e) => setAddrCity(e.target.value)} autoComplete="address-level2" />
                          </div>
                          <div className="form-group">
                            <label htmlFor="cust-addr-state" className="form-label">State</label>
                            <input id="cust-addr-state" type="text" className="form-input" placeholder="State" value={addrState} onChange={(e) => setAddrState(e.target.value)} autoComplete="address-level1" />
                          </div>
                          <div className="form-group">
                            <label htmlFor="cust-addr-pin" className="form-label">Pincode</label>
                            <input id="cust-addr-pin" type="text" className="form-input" placeholder="560001" inputMode="numeric" value={addrPincode} onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="postal-code" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: 0 }} />

                    {/* ── Section 3: Review & Pay ── */}
                    <div style={{ padding: "1.5rem 0 0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                        <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", border: "2px solid var(--text-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-dark)", flexShrink: 0 }}>3</div>
                        <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--text-dark)" }}>Review &amp; Pay</span>
                      </div>

                      {/* Payment method selection */}
                      <div className="payment-methods" role="radiogroup" aria-label="Payment Mode" style={{ marginBottom: "1rem" }}>
                        <div className={`payment-method-card ${paymentMethod === "full" ? "selected" : ""}`} onClick={() => handleSelectPaymentMethod("full")}>
                          <input type="radio" id="radio-full" name="payment-preference" checked={paymentMethod === "full"} onChange={() => {}} className="payment-radio" />
                          <div className="payment-method-info">
                            <label htmlFor="radio-full" className="payment-method-name">
                              Pay Full Online (₹{finalTotal})
                              <span className="payment-badge">Zero Fees</span>
                            </label>
                            <span className="payment-method-desc">Pay full ₹{finalTotal} online now using GPay/PhonePe/UPI.</span>
                          </div>
                        </div>

                        <div className={`payment-method-card ${paymentMethod === "advance" ? "selected" : ""}`} onClick={() => handleSelectPaymentMethod("advance")}>
                          <input type="radio" id="radio-advance" name="payment-preference" checked={paymentMethod === "advance"} onChange={() => {}} className="payment-radio" />
                          <div className="payment-method-info">
                            <label htmlFor="radio-advance" className="payment-method-name">
                              Pay Booking Advance (₹{requiredAdvance})
                              <span className="payment-badge">Leaflet Policy</span>
                            </label>
                            <span className="payment-method-desc">Pay ₹{requiredAdvance} now via GPay/PhonePe to secure booking. Pay balance ₹{payToDriverAmount} to driver.</span>
                          </div>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                        Pay Now ₹{onlinePaymentAmount}
                      </button>
                    </div>

                  </form>
                </div>

              {/* RIGHT on desktop / TOP on mobile: Trip summary */}
              <div className="booking-summary">
                <div className="route-summary-bar" style={{ marginBottom: "1rem" }}>
                  <div className="trip-type-icon-box">
                    <img src={getAssetPath(TRIP_TYPE_ICON[tripType])} alt="" className="trip-type-icon-img" />
                  </div>
                  <div className="route-summary-info">
                    <span className="route-summary-cities">
                      {(tripType === "city" || tripType === "tempo") ? pickup : `${pickup} ➔ ${drop}`}
                    </span>
                    <span className="route-summary-details">{tripSummaryLabel}</span>
                  </div>
                </div>

                <div className="cab-card selected">
                  <div className="cab-card-header">
                    <div className="cab-icon-box">
                      <img
                        src={selectedCab.icon.startsWith("images/") ? getAssetPath(`/${selectedCab.icon}`) : getAssetPath(`/icons/${selectedCab.icon}`)}
                        alt=""
                        className="cab-icon-img"
                      />
                    </div>
                    <div className="cab-meta">
                      <div className="cab-name-row">
                        <h3 className="cab-name">{selectedCab.name}</h3>
                        <div className="cab-price-col">
                          <span className="cab-price">₹{totalPrice}</span>
                          <span className="cab-price-subtext"> (Assured)</span>
                        </div>
                      </div>
                      <p className="cab-example">e.g. {selectedCab.example}</p>
                      <div className="cab-specs">
                        <span className="cab-spec-badge">{selectedCab.seats} Seats</span>
                        <span className="cab-spec-badge">{selectedCab.luggage}</span>
                        {selectedCab.ac && <span className="cab-spec-badge">AC</span>}
                      </div>
                    </div>
                  </div>

                </div>

                <div className="trip-bill-summary" style={{ marginTop: "1rem" }}>
                  <div className="bill-title">Fare Breakdown</div>
                  <div className="bill-row">
                    <span>Trip:</span>
                    <span>{(tripType === "city" || tripType === "tempo") ? pickup : `${pickup} → ${drop}`}</span>
                  </div>
                  {tripType === "airport" && (
                    <div className="bill-row">
                      <span>Assured flat fare:</span>
                      <span>₹{selectedCab.airportPrice}</span>
                    </div>
                  )}
                  {tripType === "daily" && (
                    <div className="bill-row">
                      <span>One-way intercity fare:</span>
                      <span>₹{selectedCab.intercityPrice}</span>
                    </div>
                  )}
                  {tripType === "city" && (() => {
                    const totalKm = selectedCab.minKmPerDay * cityDayCount;
                    const runningCharges = selectedCab.ratePerKm * totalKm;
                    const driverCharges = selectedCab.driverAllowance * cityDayCount;
                    return (
                      <>
                        <div className="bill-row">
                          <span>Duration:</span>
                          <span>{cityDayCount} Day{plural(cityDayCount)} · {selectedCab.minKmPerDay} km/day</span>
                        </div>
                        <div className="bill-row">
                          <span>Running ({totalKm} km × ₹{selectedCab.ratePerKm}/km):</span>
                          <span>₹{runningCharges}</span>
                        </div>
                        <div className="bill-row">
                          <span>Driver allowance ({cityDayCount}d × ₹{selectedCab.driverAllowance}):</span>
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
                          <span>{tempoDayCount} Day{plural(tempoDayCount)} · {effectiveKm} km billed</span>
                        </div>
                        <div className="bill-row">
                          <span>Running ({effectiveKm} km × ₹{selectedCab.ratePerKm}/km):</span>
                          <span>₹{runningCharges}</span>
                        </div>
                        <div className="bill-row">
                          <span>Driver allowance ({tempoDayCount}d × ₹{selectedCab.driverAllowance}):</span>
                          <span>₹{driverCharges}</span>
                        </div>
                      </>
                    );
                  })()}
                  <div className="bill-row">
                    <span>Base fare:</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="bill-row" style={{ color: "var(--success-green)", fontWeight: 600 }}>
                      <span>Coupon ({appliedPromo.code}):</span>
                      <span>− ₹{promoDiscount}</span>
                    </div>
                  )}
                  <div className="bill-row total">
                    <span>Total Assured Fare:</span>
                    <span>₹{finalTotal}</span>
                  </div>
                </div>

                {applicablePromos.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <div className="bill-title" style={{ marginBottom: "0.6rem" }}>Available Offers</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      {applicablePromos.map((promo, idx) => {
                        const isApplied = appliedPromo?.code === promo.code;
                        const ineligible = promo.minFare && totalPrice < promo.minFare;
                        const title =
                          promo.type === "percent"
                            ? `${promo.value}% Off${promo.maxDiscount ? ` (max ₹${promo.maxDiscount})` : ""}`
                            : `Flat ₹${promo.value} Off`;
                        return (
                          <div
                            key={promo.code}
                            className="promo-card"
                            style={{
                              opacity: ineligible ? 0.55 : 1,
                              border: isApplied ? "1.5px solid var(--success-green)" : undefined,
                              padding: "0.75rem",
                            }}
                          >
                            <div className="promo-img-box" style={{ color: PROMO_PALETTE[idx % PROMO_PALETTE.length], width: 36, height: 36, fontSize: "1.1rem" }}>
                              {PROMO_ICONS[idx % PROMO_ICONS.length]}
                            </div>
                            <div className="promo-info" style={{ flex: 1, minWidth: 0 }}>
                              <span className="promo-tag">{promo.code}</span>
                              <h3 className="promo-title" style={{ fontSize: "0.8rem" }}>{title}</h3>
                              <p className="promo-desc">{promo.label}{promo.minFare ? ` Min ₹${promo.minFare}.` : ""}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleApplyPromo(promo)}
                              style={{
                                flexShrink: 0,
                                alignSelf: "center",
                                padding: "0.3rem 0.65rem",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                borderRadius: "6px",
                                border: isApplied ? "1.5px solid var(--success-green)" : "1.5px solid var(--primary-orange)",
                                background: "transparent",
                                color: isApplied ? "var(--success-green)" : "var(--primary-orange)",
                                cursor: ineligible ? "not-allowed" : "pointer",
                              }}
                            >
                              {isApplied ? "✓ Applied" : "Apply"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                  <span>{date || "Tomorrow"} at {time}</span>
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
                    window.location.href = `${BASE_PATH}/`;
                  }}
                >
                  Book Another Cab
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <a href={getWhatsAppUrl()} className="whatsapp-float" target="_blank" rel="noreferrer" aria-label="WhatsApp support">
        <img src={WHATSAPP_ICON_PATH} alt="WhatsApp" className="whatsapp-float-icon" />
      </a>


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
