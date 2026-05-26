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

// UI tab id → bookingTypes id in firestore/config.booking.json
const TRIP_TYPE_TO_BOOKING_TYPE = {
  airport: "airport",
  city: "city",
  daily: "intercity",
  tempo: "tempo",
};

export default function Home() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const getAssetPath = (path) => `${basePath}${path}`;
  const whatsappNumber = siteConfig.whatsapp.replace(/\D/g, "");
  const whatsappIconPath = getAssetPath("/icons/messaging/whatsapp-chat.svg");
  const getWhatsAppUrl = (message) => {
    const baseUrl = `https://wa.me/${whatsappNumber}`;
    return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
  };

  // Booking Flow States
  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState("airport"); // 'airport', 'city', 'daily', 'tempo'
  
  // Airport direction options: 'drop' (Mysore to KIA) or 'pickup' (KIA to Mysore)
  const [airportType, setAirportType] = useState("drop");
  // City direction options: 'drop' (Mysore to Blr City) or 'pickup' (Blr City to Mysore)
  const [cityType, setCityType] = useState("drop");
  
  // Trip Duration options
  const [outstationDirection, setOutstationDirection] = useState("oneway"); // 'oneway', 'roundtrip'
  const [numDays, setNumDays] = useState(1);

  // Form Fields
  const [pickup, setPickup] = useState("Mysore");
  const [drop, setDrop] = useState("Bangalore Airport (KIA)");
  const [date, setDate] = useState(getTomorrowDate);
  const [time, setTime] = useState("10:00");
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  // Active filters inside search box
  const [minSeats, setMinSeats] = useState(4);

  // Inline cab preview expansion on home screen
  const [showInlineCabs, setShowInlineCabs] = useState(false);

  // Selected Cab & Passenger Info
  const [selectedCab, setSelectedCab] = useState(bookingConfig.cabTypes[0]);
  const [bookingId, setBookingId] = useState(createBookingId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  
  // Payment Options: 'arrival', 'advance', 'full'
  const [paymentMethod, setPaymentMethod] = useState("arrival");

  // Navigation / Modal Display States
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("");

  // OTP Login Flow States
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Tracking Bookings Flow States
  const [trackBookingId, setTrackBookingId] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackedBooking, setTrackedBooking] = useState(null);
  const [trackAttempted, setTrackAttempted] = useState(false);
  const isOutstationTrip = tripType === "daily" || tripType === "tempo";
  const showTripModeSelector = tripType !== "airport";
  const tempoCab = bookingConfig.cabTypes.find(isTempoCab);
  const tripSummaryLabel = tripType === "airport" ? "Airport Transfers" :
                           tripType === "city" ? "City Taxi Service" :
                           tripType === "tempo" ? `Tempo Traveller (${numDays} Days)` :
                           `Intercity Travel (${numDays} Days)`;

  // Sync inputs when airport transfer direction changes
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

  // Sync inputs when city drop direction changes
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

  // Sync inputs when product switcher tab changes (Flights, Hotels, Buses style)
  const handleTabChange = (tab) => {
    setTripType(tab);

    // Reset selectedCab if it's not applicable for the new tab.
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
      if (tempoCab) {
        setSelectedCab(tempoCab);
      }
    }
  };

  const [swapRotation, setSwapRotation] = useState(0);

  // Swap pickup & drop locations
  const handleSwapLocations = () => {
    if (isOutstationTrip) return; // No swap for outstation packages
    
    const temp = pickup;
    setPickup(drop);
    setDrop(temp);
    setSwapRotation(prev => prev + 180);

    // Sync sub-types
    if (tripType === "airport") {
      setAirportType(airportType === "drop" ? "pickup" : "drop");
    } else if (tripType === "city") {
      setCityType(cityType === "drop" ? "pickup" : "drop");
    }
  };

  // Quick route presets selection — handles both fixed routes and tour package items
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
      if (item.days) setNumDays(item.days);
      if (tempoCab) setSelectedCab(tempoCab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bookingTypeId = TRIP_TYPE_TO_BOOKING_TYPE[tripType];
  const activeBookingType = bookingConfig.bookingTypes[bookingTypeId] ?? null;
  const applicableCabIds = activeBookingType?.applicableCabs ?? [];

  // Suggestions: Firestore cities valid for this booking type; outstation tabs add free-text tour destinations.
  const firestoreCityNames = bookingConfig.cities
    .filter((c) => c.validFor.includes(bookingTypeId))
    .map((c) => c.name);
  const outstationDestinations = ["Ooty", "Coorg (Madikeri)", "Kabini", "Bandipur", "Wayanad"];
  const suggestionList = isOutstationTrip
    ? Array.from(new Set([...firestoreCityNames, ...outstationDestinations]))
    : firestoreCityNames;
  const suggestions = { pickup: suggestionList, drop: suggestionList };

  // Pricing engine
  const calculatePrice = (cab) => {
    if (tripType === "airport") {
      return cab.airportPrice;
    } else if (tripType === "city") {
      return cab.cityPrice;
    } else {
      // Daily / Outstation package: (baseRatePerKm * minKmPerDay + driverAllowance) * numDays
      const baseFare = cab.ratePerKm * cab.minKmPerDay;
      const driverFare = cab.driverAllowance;
      const total = (baseFare + driverFare) * numDays;
      return outstationDirection === "roundtrip" ? Math.round(total * 1.8) : total;
    }
  };

  // Calculate pricing values
  const totalPrice = calculatePrice(selectedCab);
  
  // Custom booking advance structure (₹500 per day as noted in the leaflet)
  const requiredAdvance = isOutstationTrip ? 500 * numDays : 500;
  
  const onlinePaymentAmount = paymentMethod === "full" ? totalPrice : paymentMethod === "advance" ? requiredAdvance : 0;
  const payToDriverAmount = totalPrice - onlinePaymentAmount;

  const minSeatsLabel = minSeats >= 7 ? "7+" : String(minSeats);

  // Filtered Cabs based on search filters
  const filteredCabs = bookingConfig.cabTypes.filter((cab) => {
    if (applicableCabIds.length > 0 && !applicableCabIds.includes(cab.id)) return false;
    if (cab.seats < minSeats) return false;
    return true;
  });

  // Navigation handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!pickup || !drop || !date || !time) {
      alert("Please fill in all routing fields.");
      return;
    }
    if (filteredCabs.length > 0) {
      setSelectedCab(filteredCabs[0]);
    }
    setShowInlineCabs((prev) => !prev);
  };

  const handleInlineCabSelect = (cab) => {
    setSelectedCab(cab);
    setStep(3);
  };

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

  // Generate UPI Deep Link
  const generateUpiLink = () => {
    const note = `Booking ${bookingId}`;
    return `upi://pay?pa=${siteConfig.upiId}&pn=${encodeURIComponent(siteConfig.merchantName)}&am=${onlinePaymentAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  // Structured booking details message for WhatsApp
  const getWhatsAppMessage = () => {
    let tripDetails = "";
    if (tripType === "airport") {
      tripDetails = `Airport Transfers (${airportType === "drop" ? "Mysore to Airport" : "Airport to Mysore"})`;
    } else if (tripType === "city") {
      tripDetails = `City Taxi Service (${cityType === "drop" ? "Mysore to Bangalore" : "Bangalore to Mysore"})`;
    } else if (tripType === "tempo") {
      tripDetails = `Tempo Traveller (${numDays} Day${numDays > 1 ? "s" : ""})`;
    } else {
      tripDetails = `Intercity Travel (${numDays} Day${numDays > 1 ? "s" : ""})`;
    }

    const payStatus = paymentMethod === "full" ? "Paid 100% Full UPI" : 
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

  // Click Offers link handler
  const handleOffersClick = () => {
    if (step !== 1) {
      setStep(1);
    }
    // Wait for step render, scroll to promos
    setTimeout(() => {
      const promoSection = document.getElementById("promos");
      if (promoSection) {
        promoSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Mock OTP Signin verification
  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!loginPhone || loginPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpSent(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (loginOtp === "1234" || loginOtp.length === 4) {
      setIsLoggedIn(true);
      setLoggedInUser(loginPhone);
      setShowLogin(false);
      setOtpSent(false);
      setLoginPhone("");
      setLoginOtp("");
    } else {
      alert("Invalid OTP code. Please enter 1234 to log in.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInUser("");
  };

  // Mock Booking Status Tracker search
  const handleTrackBooking = (e) => {
    e.preventDefault();
    setTrackAttempted(true);
    // If the ID matches current active reservation or standard test keys
    if (trackBookingId.toUpperCase() === bookingId || trackBookingId.toUpperCase() === "GAT-123456" || trackBookingId.toUpperCase() === "GAT-987654") {
      setTrackedBooking({
        id: trackBookingId.toUpperCase(),
        route: "Mysore ➔ Bangalore Airport KIA",
        car: selectedCab.name,
        date: date || "Tomorrow",
        time: time || "10:00 AM",
        price: totalPrice,
        status: "Confirmed (Driver details assigning 15 mins before reporting)"
      });
    } else {
      setTrackedBooking(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Pure White Header matching Cleartrip */}
      <header className="header">
        <div className="header-container">
          <a href="#" className="logo-link" onClick={() => setStep(1)}>
            <img src={getAssetPath("/icons/nav/cab.svg")} alt="Taxi Logo" className="logo-icon" />
            <span className="logo-text">
              GLOBAL<span className="logo-highlight">AIR</span>TRAVELS
            </span>
          </a>
          
          {/* Mobile action bar with call button and hamburger menu */}
          <div className="mobile-only header-mobile-actions">
            <a href={`tel:${siteConfig.phone}`} className="mobile-call-icon-btn" aria-label="Call Us">
              <img src={getAssetPath("/icons/call/phone-ring.svg")} alt="" className="nav-icon" width="20" height="20" />
            </a>
            <button type="button" className="mobile-menu-toggle" onClick={() => setShowMobileMenu(true)} aria-label="Open navigation menu">
              <img src={getAssetPath("/icons/nav/menu.svg")} alt="" className="nav-icon" width="24" height="24" />
            </button>
          </div>

          {/* Desktop only navigation menu */}
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
                {isLoggedIn ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary-navy)" }}>👤 +91 {loggedInUser.slice(0,5)}...</span>
                    <button type="button" className="nav-item-link" style={{ fontSize: "0.75rem", textDecoration: "underline", padding: 0 }} onClick={handleLogout}>Logout</button>
                  </div>
                ) : (
                  <button type="button" className="btn-login" onClick={() => { setShowLogin(true); setOtpSent(false); setLoginPhone(""); setLoginOtp(""); }}>
                    Log in
                  </button>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
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
                  {isLoggedIn ? (
                    <div className="drawer-user-info">
                      <div className="user-phone" style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary-navy)", marginBottom: "0.5rem" }}>👤 +91 {loggedInUser}</div>
                      <button type="button" className="btn-login" style={{ width: "100%", justifyContent: "center" }} onClick={() => { setShowMobileMenu(false); handleLogout(); }}>
                        Log Out
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn-login" style={{ width: "100%", justifyContent: "center" }} onClick={() => { setShowMobileMenu(false); setShowLogin(true); setOtpSent(false); setLoginPhone(""); setLoginOtp(""); }}>
                      Log in
                    </button>
                  )}
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

      {/* Main Wrapper Layout */}
      <div className="main-wrapper">
        
        {/* Product Switcher Pills */}
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

        {/* Step-based view selector */}
        {step === 1 ? (
          <div className="cleartrip-grid step-container">
            {/* Left Column: Cleartrip Search Box Card */}
            <div>
              <div className="cleartrip-heading-area">
                <h1 className="cleartrip-title">{siteConfig.sidebarByTripType[tripType].heading.title}</h1>
                <p className="cleartrip-subtitle">{siteConfig.sidebarByTripType[tripType].heading.subtitle}</p>
              </div>

              <div className="cleartrip-card">
                {/* Inline Selectors (City trip mode / Outstation duration mode) */}
                {showTripModeSelector && (
                  <div className="inline-selectors-row">
                    {isOutstationTrip ? (
                      <label className="inline-radio-label">
                        <input
                          type="checkbox"
                          checked={outstationDirection === "roundtrip"}
                          onChange={(e) => setOutstationDirection(e.target.checked ? "roundtrip" : "oneway")}
                          className="inline-radio-input"
                        />
                        <span>Round Trip Outstation (1.8x Km base)</span>
                      </label>
                    ) : (
                      <>
                        <label className="inline-radio-label">
                          <input
                            type="radio"
                            name="direction-mode"
                            checked={true}
                            readOnly
                            className="inline-radio-input"
                          />
                          <span>One way</span>
                        </label>
                        <label className="inline-radio-label" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                          <input
                            type="radio"
                            name="direction-mode"
                            checked={false}
                            disabled
                            className="inline-radio-input"
                          />
                          <span>Round trip</span>
                        </label>
                      </>
                    )}
                  </div>
                )}

                {/* Main Booking Search Form */}
                <form onSubmit={handleSearchSubmit}>
                  
                  {/* Row 1: Adjacent Pickup & Drop Inputs with Swap circle */}
                  <div className="cleartrip-input-row">
                    {/* Pickup Input Column */}
                    <div className="input-col" style={{ position: "relative" }}>
                      <label htmlFor="pickup-input" className="input-mini-label">From</label>
                      <input
                        id="pickup-input"
                        type="text"
                        className="input-field"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        onFocus={() => setShowPickupSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                        placeholder="Enter pickup city"
                        required
                      />
                      {showPickupSuggestions && (
                        <div className="suggestions-dropdown">
                          {suggestions.pickup.map((s) => (
                            <button
                              key={s}
                              type="button"
                              className="suggestion-item"
                              onMouseDown={() => setPickup(s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Swap Button (Absolutely centered overlapping borders) */}
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

                    {/* Drop Input Column */}
                    <div className="input-col" style={{ position: "relative" }}>
                      <label htmlFor="drop-input" className="input-mini-label">To</label>
                      <input
                        id="drop-input"
                        type="text"
                        className="input-field"
                        value={drop}
                        onChange={(e) => setDrop(e.target.value)}
                        onFocus={() => setShowDropSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowDropSuggestions(false), 200)}
                        placeholder="Enter destination city"
                        required
                        disabled={isOutstationTrip}
                      />
                      {showDropSuggestions && (
                        <div className="suggestions-dropdown">
                          {suggestions.drop.map((s) => (
                            <button
                              key={s}
                              type="button"
                              className="suggestion-item"
                              onMouseDown={() => setDrop(s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Adjacent Dates & Duration Inputs */}
                  <div className="cleartrip-input-row">
                    {/* Journey Date Input */}
                    <div className="input-col">
                      <label htmlFor="date-input" className="input-mini-label">Depart Date</label>
                      <input
                        id="date-input"
                        type="date"
                        className="input-field"
                        value={date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>

                    {/* Pickup Time or Duration Days input */}
                    {isOutstationTrip ? (
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
                            <option key={d} value={d}>{d} Day{d > 1 ? "s" : ""} Tour</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="input-col">
                        <label htmlFor="time-input" className="input-mini-label">Pickup Time</label>
                        <input
                          id="time-input"
                          type="time"
                          className="input-field"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Included service tags */}
                  <div className="filter-tags-row" aria-label="Included services">
                    <span className="filter-tag included-tag">Tolls Included</span>
                    <span className="filter-tag included-tag">AC Cabs</span>
                    <span className="filter-tag included-tag">Driver Allowance Incl.</span>
                  </div>

                  {/* Bottom Action Row (Seat Slider & Primary Button) */}
                  <div className="cleartrip-bottom-row">
                    <div className="seat-filter">
                      <div className="seat-filter-header">
                        <label htmlFor="min-seats-slider" className="seat-filter-label">Minimum seats</label>
                        <span className="seat-filter-value">{minSeatsLabel}</span>
                      </div>
                      <input
                        id="min-seats-slider"
                        type="range"
                        min="4"
                        max="7"
                        step="1"
                        value={minSeats}
                        onChange={(e) => setMinSeats(Number(e.target.value))}
                        className="seat-filter-slider"
                        aria-valuetext={`${minSeatsLabel} seats`}
                      />
                      <div className="seat-filter-marks" aria-hidden="true">
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7+</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-cleartrip-search"
                      aria-expanded={showInlineCabs}
                    >
                      <span>{showInlineCabs ? "Hide Cabs" : "Show Cabs"}</span>
                      <span
                        className="show-cabs-chevron"
                        style={{
                          display: "inline-block",
                          marginLeft: "0.4rem",
                          transition: "transform 0.25s ease",
                          transform: showInlineCabs ? "rotate(180deg)" : "rotate(0deg)"
                        }}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    </button>
                  </div>

                  {showInlineCabs && (
                    <div className="inline-cab-preview" style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--primary-navy)", margin: 0 }}>
                          Available Cabs ({filteredCabs.length})
                        </h3>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-gray)" }}>
                          {tripSummaryLabel} • {date}
                        </span>
                      </div>

                      <div className="inline-cab-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {filteredCabs.map((cab) => {
                          const cabPrice = calculatePrice(cab);
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
                                backgroundColor: "#fff"
                              }}
                            >
                              <img
                                src={getAssetPath(`/icons/${cab.icon}`)}
                                alt=""
                                style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary-navy)" }}>
                                  {cab.name}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-gray)" }}>
                                  {cab.seats} Seats • {cab.luggage} {cab.ac ? "• AC" : ""}
                                </div>
                                <div style={{ fontSize: "0.68rem", color: "var(--text-gray)", marginTop: "0.15rem" }}>
                                  e.g. {cab.example}
                                </div>
                              </div>
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--primary-orange)" }}>
                                  ₹{cabPrice}
                                </div>
                                <div style={{ fontSize: "0.65rem", color: "var(--text-gray)" }}>Assured</div>
                              </div>
                              <button
                                type="button"
                                className="btn-primary"
                                style={{
                                  minHeight: "32px",
                                  padding: "0.35rem 0.75rem",
                                  fontSize: "0.75rem",
                                  flexShrink: 0
                                }}
                                onClick={() => handleInlineCabSelect(cab)}
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
                  )}

                </form>
              </div>
            </div>

            {/* Right Column: Cleartrip Sidebar — content varies by tripType */}
            <aside className="cleartrip-sidebar">
              {(() => {
                const sidebar = siteConfig.sidebarByTripType[tripType];
                const bannerStyle = sidebar.banner.image
                  ? {
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.45)), url(${getAssetPath(sidebar.banner.image)}), ${sidebar.banner.gradient || "linear-gradient(135deg, #0B3D91 0%, #F26B1F 100%)"}`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "#ffffff"
                    }
                  : {
                      backgroundImage: sidebar.banner.gradient || "linear-gradient(135deg, #0B3D91 0%, #F26B1F 100%)",
                      color: "#ffffff"
                    };

                return (
                  <>
                    {/* Dynamic Ad Banner */}
                    <div className="cleartrip-ad-card" style={bannerStyle}>
                      <span className="ad-badge" style={{ backgroundColor: "var(--primary-orange)", color: "#ffffff" }}>{sidebar.banner.badge}</span>
                      <p className="ad-text" style={{ color: "#ffffff", textShadow: "0 1px 3px rgba(0, 0, 0, 0.6)" }}>{sidebar.banner.text}</p>
                      <span className="ad-footer" style={{ color: "#e2e8f0" }}>{sidebar.banner.footer}</span>
                    </div>

                    {/* Quick Select — routes or tour packages depending on trip type */}
                    <div className="cleartrip-sidebar-card">
                      <div className="sidebar-title-row">
                        <h2 className="sidebar-title">{sidebar.quickSelect.title}</h2>
                        <span className="sidebar-link">Quick Select</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {sidebar.quickSelect.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="quick-route-btn"
                            onClick={() => handleQuickRouteSelect(item)}
                          >
                            <span className="quick-route-name">{item.name}</span>
                            <span className="quick-route-price">{item.subtitle}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Info card — inclusions or border permits depending on trip type */}
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
                  </>
                );
              })()}
            </aside>
          </div>
        ) : (
          /* Multi-step screen inside center container */
          <div className="stepper-result step-container">
            {/* Step 2: Cab Selection */}
            {step === 2 && (
              <div>
                <div className="route-summary-bar">
                  <div className="route-summary-info">
                    <span className="route-summary-cities">
                      {pickup} ➔ {drop}
                    </span>
                    <span className="route-summary-details">
                      Date: {date} at {time} • {tripSummaryLabel}
                    </span>
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
                      <div
                        key={cab.id}
                        className={`cab-card ${isSelected ? "selected" : ""}`}
                      >
                        <div className="cab-card-header">
                          <div className="cab-icon-box">
                            <img
                              src={getAssetPath(`/icons/${cab.icon}`)}
                              alt=""
                              className="cab-icon-img"
                            />
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
                          {isOutstationTrip ? (
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
                            backgroundColor: isSelected ? "var(--primary-navy)" : "var(--primary-orange)"
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
                      <button type="button" className="btn-secondary" style={{ marginTop: "1rem", display: "inline-flex" }} onClick={() => setMinSeats(4)}>
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
                    <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                      Back
                    </button>
                    <button type="submit" className="btn-primary">
                      Confirm Address Details ➔
                    </button>
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
                    {isOutstationTrip && (
                      <div className="bill-row">
                        <span>Duration:</span>
                        <span>{numDays} Day{numDays > 1 ? "s" : ""} Tour</span>
                      </div>
                    )}
                    <div className="bill-row total">
                      <span>Total Assured Fare:</span>
                      <span>₹{totalPrice}</span>
                    </div>
                  </div>

                  <h3 className="form-label">Payment Preference</h3>
                  <div className="payment-methods" role="radiogroup" aria-label="Payment Mode">
                    {/* Pay on arrival */}
                    <div
                      className={`payment-method-card ${paymentMethod === "arrival" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("arrival")}
                    >
                      <input
                        type="radio"
                        id="radio-arrival"
                        name="payment-preference"
                        checked={paymentMethod === "arrival"}
                        onChange={() => {}}
                        className="payment-radio"
                      />
                      <div className="payment-method-info">
                        <label htmlFor="radio-arrival" className="payment-method-name">Pay to Driver (Cash/UPI)</label>
                        <span className="payment-method-desc">Pay ₹{totalPrice} directly to driver at the end of the trip.</span>
                      </div>
                    </div>

                    {/* Pay ₹500 advance */}
                    <div
                      className={`payment-method-card ${paymentMethod === "advance" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("advance")}
                    >
                      <input
                        type="radio"
                        id="radio-advance"
                        name="payment-preference"
                        checked={paymentMethod === "advance"}
                        onChange={() => {}}
                        className="payment-radio"
                      />
                      <div className="payment-method-info">
                        <label htmlFor="radio-advance" className="payment-method-name">
                          Pay Booking Advance (₹{requiredAdvance})
                          <span className="payment-badge">Leaflet Policy</span>
                        </label>
                        <span className="payment-method-desc">Pay ₹{requiredAdvance} now via GPay/PhonePe to secure booking. Pay balance ₹{payToDriverAmount} to driver.</span>
                      </div>
                    </div>

                    {/* Pay full online */}
                    <div
                      className={`payment-method-card ${paymentMethod === "full" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("full")}
                    >
                      <input
                        type="radio"
                        id="radio-full"
                        name="payment-preference"
                        checked={paymentMethod === "full"}
                        onChange={() => {}}
                        className="payment-radio"
                      />
                      <div className="payment-method-info">
                        <label htmlFor="radio-full" className="payment-method-name">
                          Pay Full Online (₹{totalPrice})
                          <span className="payment-badge">Zero Fees</span>
                        </label>
                        <span className="payment-method-desc">Pay full ₹{totalPrice} online now using GPay/PhonePe/UPI.</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Scan / Mobile App pay */}
                  {paymentMethod !== "arrival" && (
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
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(generateUpiLink())}`}
                          alt="Scan QR"
                          className="qr-mock-img"
                        />
                      </div>

                      <div className="pay-btn-group">
                        <a href={generateUpiLink()} className="btn-phonepe-pay">
                          📱 Pay via UPI Apps
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="pay-btn-group" style={{ marginTop: "1rem" }}>
                    <button
                      type="button"
                      className="btn-whatsapp-confirm"
                      onClick={handleWhatsAppRedirect}
                    >
                      <img src={whatsappIconPath} alt="" className="whatsapp-icon-white" />
                      Send Booking Request on WhatsApp
                    </button>
                    
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setStep(5)}
                    >
                      Confirm Booking (Pay on Arrival)
                    </button>

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setStep(3)}
                    >
                      Back
                    </button>
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
                      {paymentMethod === "full" ? "Paid Full Online" : 
                       paymentMethod === "advance" ? `Paid ₹${requiredAdvance} (₹${payToDriverAmount} to Driver)` : 
                       `Pay Driver ₹${totalPrice} at Trip End`}
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
                    <img src={whatsappIconPath} alt="" className="whatsapp-icon-white" />
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

        {/* Step 1 Promo Row (Matches bottom cards on Cleartrip screen) */}
        {(() => {
          if (step !== 1) return null;
          const applicablePromos = bookingConfig.promos.filter(
            (promo) => !promo.appliesTo || promo.appliesTo.length === 0 || promo.appliesTo.includes(bookingTypeId)
          );
          if (applicablePromos.length === 0) return null;
          return (
          <section className="cleartrip-promo-row" id="promos" aria-label="Offers and Promotions">
            {applicablePromos.map((promo, idx) => {
              const palette = ["#22A06B", "#FF4F00", "#3366CC", "#7A3FFF"];
              const icons = ["🎁", "🎟️", "📅", "🏷️"];
              const tag = (promo.appliesTo || []).join(" • ").toUpperCase() || "OFFER";
              const title = promo.type === "percent"
                ? `${promo.value}% Off${promo.maxDiscount ? ` (max ₹${promo.maxDiscount})` : ""}`
                : `Flat ₹${promo.value} Off`;
              return (
                <div key={promo.code} className="promo-card">
                  <div className="promo-img-box" style={{ color: palette[idx % palette.length] }}>
                    {icons[idx % icons.length]}
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
          );
        })()}

      </div>

      {/* Floating WhatsApp button */}
      <a
        href={getWhatsAppUrl()}
        className="whatsapp-float"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp support"
      >
        <img src={whatsappIconPath} alt="WhatsApp" className="whatsapp-float-icon" />
      </a>

      {/* Footer */}
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
                <div>
                  <dt>Bank</dt>
                  <dd>{siteConfig.footer.bankDetails.bank}</dd>
                </div>
                <div>
                  <dt>Current A/c Number</dt>
                  <dd>{siteConfig.footer.bankDetails.accountNumber}</dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>{siteConfig.footer.bankDetails.accountName}</dd>
                </div>
                <div>
                  <dt>Branch</dt>
                  <dd>{siteConfig.footer.bankDetails.branch}</dd>
                </div>
                <div>
                  <dt>IFSC code</dt>
                  <dd>{siteConfig.footer.bankDetails.ifsc}</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="footer-copy">
            Copyright &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ================= MODALS SYSTEM ================= */}
      
      {/* 1. Track Bookings / My Bookings Modal */}
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

                  <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem" }}>
                    Search Trip Status ➔
                  </button>
                  
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
                      <span>Booking ID:</span>
                      <strong>{trackedBooking.id}</strong>
                    </div>
                    <div className="bill-row" style={{ fontSize: "0.8rem", marginBlock: "0.2rem" }}>
                      <span>Route:</span>
                      <span>{trackedBooking.route}</span>
                    </div>
                    <div className="bill-row" style={{ fontSize: "0.8rem", marginBlock: "0.2rem" }}>
                      <span>Vehicle:</span>
                      <span>{trackedBooking.car}</span>
                    </div>
                    <div className="bill-row" style={{ fontSize: "0.8rem", marginBlock: "0.2rem" }}>
                      <span>Reporting:</span>
                      <span>{trackedBooking.date} at {trackedBooking.time}</span>
                    </div>
                    <div className="bill-row" style={{ fontSize: "0.8rem", marginBlock: "0.2rem" }}>
                      <span>Assured Cost:</span>
                      <strong>₹{trackedBooking.price}</strong>
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

      {/* 2. Customer Support Modal */}
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

              <button type="button" className="btn-primary" onClick={() => setShowSupport(false)}>
                Back to Website
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Login Modal */}
      {showLogin && (
        <div className="modal-backdrop" onClick={() => setShowLogin(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={() => setShowLogin(false)}>✕</button>
            <h2 className="modal-title">
              <img src={getAssetPath("/icons/nav/login.svg")} alt="" className="nav-icon" width="20" height="20" style={{ color: "var(--primary-orange)" }} />
              <span>Log in to your account</span>
            </h2>
            <div className="modal-body">
              {!otpSent ? (
                <form onSubmit={handleSendOtp}>
                  <p style={{ marginBottom: "0.85rem", fontSize: "0.85rem", color: "var(--text-gray)" }}>
                    Enter your phone number to receive a secure login code.
                  </p>
                  
                  <label htmlFor="login-tel" className="form-label" style={{ fontWeight: 600 }}>Mobile Number</label>
                  <input
                    id="login-tel"
                    type="tel"
                    className="modal-input"
                    placeholder="Enter 10-digit mobile number"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                    pattern="[6-9][0-9]{9}"
                    inputMode="tel"
                  />

                  <button type="submit" className="btn-primary" style={{ marginTop: "0.5rem" }}>
                    Send One-Time OTP ➔
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  <p style={{ marginBottom: "0.85rem", fontSize: "0.85rem", color: "var(--text-gray)" }}>
                    We sent a mock SMS OTP verification code to <strong>+91 {loginPhone}</strong>.
                  </p>

                  <label htmlFor="login-otp" className="form-label" style={{ fontWeight: 600 }}>Enter 4-Digit OTP Code</label>
                  <input
                    id="login-otp"
                    type="text"
                    className="modal-input"
                    placeholder="Enter OTP (type 1234)"
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value)}
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    inputMode="numeric"
                  />

                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.85rem", textAlign: "right" }}>
                    Hint: Enter code <strong>1234</strong> to verify.
                  </span>

                  <button type="submit" className="btn-primary">
                    Verify & Sign In
                  </button>
                  
                  <button type="button" className="btn-secondary" style={{ marginTop: "0.5rem", width: "100%" }} onClick={() => setOtpSent(false)}>
                    Back
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
