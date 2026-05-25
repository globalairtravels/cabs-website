"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";

export default function Home() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const getAssetPath = (path) => `${basePath}${path}`;

  // Booking Flow States
  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState("airport"); // 'airport', 'city', 'daily'
  
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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  // Active filters inside search box
  const [only6Seaters, setOnly6Seaters] = useState(false);
  const [filterToll, setFilterToll] = useState(true);
  const [filterAc, setFilterAc] = useState(true);
  const [filterDriver, setFilterDriver] = useState(true);

  // Selected Cab & Passenger Info
  const [selectedCab, setSelectedCab] = useState(siteConfig.cabTypes[0]);
  const [bookingId, setBookingId] = useState("");
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

  // Load defaults
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);
    
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setBookingId(`GAT-${randomNum}`);
  }, []);

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
    if (tab === "airport") {
      handleAirportDirectionChange("drop");
    } else if (tab === "city") {
      handleCityDirectionChange("drop");
    } else if (tab === "daily") {
      setPickup("Mysore");
      setDrop("Outstation Tour / Local");
    }
  };

  const [swapRotation, setSwapRotation] = useState(0);

  // Swap pickup & drop locations
  const handleSwapLocations = () => {
    if (tripType === "daily") return; // No swap for daily sightseeing
    
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

  // Quick route presets selection
  const handleQuickRouteSelect = (routeId) => {
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
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const suggestions = {
    pickup: ["Mysore", "Bangalore Airport (KIA)", "Bangalore City", "Ooty", "Coorg (Madikeri)", "Kabini", "Bandipur"],
    drop: ["Bangalore Airport (KIA)", "Bangalore City", "Mysore", "Ooty", "Coorg (Madikeri)", "Kabini", "Bandipur"]
  };

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
  const requiredAdvance = tripType === "daily" ? 500 * numDays : 500;
  
  const onlinePaymentAmount = paymentMethod === "full" ? totalPrice : paymentMethod === "advance" ? requiredAdvance : 0;
  const payToDriverAmount = totalPrice - onlinePaymentAmount;

  // Filtered Cabs based on search filters (Show 6+ Seater Cabs Only)
  const filteredCabs = siteConfig.cabTypes.filter((cab) => {
    if (only6Seaters && cab.seats < 6) return false;
    return true;
  });

  // Navigation handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!pickup || !drop || !date || !time) {
      alert("Please fill in all routing fields.");
      return;
    }
    // Set default selected cab to first item in filtered list
    if (filteredCabs.length > 0) {
      setSelectedCab(filteredCabs[0]);
    }
    setStep(2);
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
      tripDetails = `Airport Transfer (${airportType === "drop" ? "Mysore to Airport" : "Airport to Mysore"})`;
    } else if (tripType === "city") {
      tripDetails = `Bangalore City Drop (${cityType === "drop" ? "Mysore to Bangalore" : "Bangalore to Mysore"})`;
    } else {
      tripDetails = `Local / Outstation Daily Hire (${numDays} Day${numDays > 1 ? "s" : ""})`;
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
    const encodedText = encodeURIComponent(getWhatsAppMessage());
    window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodedText}`, "_blank");
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
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" className="nav-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </a>
            <button type="button" className="mobile-menu-toggle" onClick={() => setShowMobileMenu(true)} aria-label="Open navigation menu">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" className="nav-icon"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>

          {/* Desktop only navigation menu */}
          <nav className="desktop-only" aria-label="Main Navigation">
            <ul className="desktop-nav">
              <li>
                <button type="button" className="nav-item-link" onClick={handleOffersClick}>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" className="nav-icon"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  <span>Offers</span>
                </button>
              </li>
              <li>
                <button type="button" className="nav-item-link" onClick={() => { setShowMyBookings(true); setTrackAttempted(false); setTrackedBooking(null); setTrackBookingId(""); }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" className="nav-icon"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  <span>My Bookings</span>
                </button>
              </li>
              <li>
                <button type="button" className="nav-item-link" onClick={() => setShowSupport(true)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" className="nav-icon"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
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
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className="nav-icon"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    <span>Offers & Promos</span>
                  </button>
                </li>
                <li>
                  <button type="button" className="drawer-nav-link" onClick={() => { setShowMobileMenu(false); setShowMyBookings(true); setTrackAttempted(false); setTrackedBooking(null); setTrackBookingId(""); }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className="nav-icon"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    <span>Track Bookings</span>
                  </button>
                </li>
                <li>
                  <button type="button" className="drawer-nav-link" onClick={() => { setShowMobileMenu(false); setShowSupport(true); }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className="nav-icon"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
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
                <img src={getAssetPath("/icons/nav/airport.svg")} alt="" className="product-icon" />
              </div>
              <span>Airport Transfer</span>
            </button>
            <button
              type="button"
              className={`product-pill ${tripType === "city" ? "active" : ""}`}
              onClick={() => handleTabChange("city")}
            >
              <div className="product-icon-wrapper">
                <img src={getAssetPath("/icons/hero/one-way.svg")} alt="" className="product-icon" />
              </div>
              <span>Bangalore Drops</span>
            </button>
            <button
              type="button"
              className={`product-pill ${tripType === "daily" ? "active" : ""}`}
              onClick={() => handleTabChange("daily")}
            >
              <div className="product-icon-wrapper">
                <img src={getAssetPath("/icons/hero/calendar.svg")} alt="" className="product-icon" />
              </div>
              <span>Daily Sightseeing / Tour</span>
            </button>
          </nav>
        )}

        {/* Step-based view selector */}
        {step === 1 ? (
          <div className="cleartrip-grid step-container">
            {/* Left Column: Cleartrip Search Box Card */}
            <div>
              <div className="cleartrip-heading-area">
                <h1 className="cleartrip-title">Book Domestic & Outstation Cabs</h1>
                <p className="cleartrip-subtitle">Enjoy hassle free cab bookings at lowest rates</p>
              </div>

              <div className="cleartrip-card">
                {/* Inline Selectors (One way vs Round trip / Days) */}
                <div className="inline-selectors-row">
                  {tripType === "daily" ? (
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
                    {tripType !== "daily" && (
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
                        disabled={tripType === "daily"}
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
                    {tripType === "daily" ? (
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

                  {/* Quick Filters Checkbox Row (Cleartrip style tags) */}
                  <div className="filter-tags-row">
                    <label className={`filter-tag ${filterToll ? "checked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={filterToll}
                        onChange={(e) => setFilterToll(e.target.checked)}
                        className="filter-checkbox"
                      />
                      <span>Tolls Included</span>
                    </label>
                    <label className={`filter-tag ${filterAc ? "checked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={filterAc}
                        onChange={(e) => setFilterAc(e.target.checked)}
                        className="filter-checkbox"
                      />
                      <span>AC Cab</span>
                    </label>
                    <label className={`filter-tag ${filterDriver ? "checked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={filterDriver}
                        onChange={(e) => setFilterDriver(e.target.checked)}
                        className="filter-checkbox"
                      />
                      <span>Driver Allowance Incl.</span>
                    </label>
                  </div>

                  {/* Bottom Action Row (Toggle Switch & Primary Button) */}
                  <div className="cleartrip-bottom-row">
                    {/* Dynamic Seating Filter Toggle Switch */}
                    <div className="toggle-container" onClick={() => setOnly6Seaters(!only6Seaters)}>
                      <div className="toggle-switch-box">
                        <input
                          type="checkbox"
                          checked={only6Seaters}
                          onChange={() => {}} // Handled by container click
                          className="toggle-input"
                        />
                        <span className="toggle-slider"></span>
                      </div>
                      <span className="toggle-label-text">Show 6+ Seaters Only (SUV/Tempo)</span>
                    </div>

                    <button type="submit" className="btn-cleartrip-search">
                      Search Cabs ➔
                    </button>
                  </div>

                </form>
              </div>
            </div>

            {/* Right Column: Cleartrip Sidebar */}
            <aside className="cleartrip-sidebar">
              {/* Gradient Ad Banner */}
              <div
                className="cleartrip-ad-card"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.45)), url(${getAssetPath("/images/airport.webp")})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  color: "#ffffff"
                }}
              >
                <span className="ad-badge" style={{ backgroundColor: "var(--primary-orange)", color: "#ffffff" }}>Special Rate</span>
                <p className="ad-text" style={{ color: "#ffffff", textShadow: "0 1px 3px rgba(0, 0, 0, 0.6)" }}>Mysore ⇄ KIA Airport Drop starting at just ₹3,600/-</p>
                <span className="ad-footer" style={{ color: "#e2e8f0" }}>Includes driver allowance & toll tax!</span>
              </div>

              {/* Quick Route Shortcuts */}
              <div className="cleartrip-sidebar-card">
                <div className="sidebar-title-row">
                  <h2 className="sidebar-title">Popular Routes</h2>
                  <span className="sidebar-link">Quick Select</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button type="button" className="quick-route-btn" onClick={() => handleQuickRouteSelect("mysore-blr-airport")}>
                    <span className="quick-route-name">Mysore ➔ Bangalore Airport</span>
                    <span className="quick-route-price">₹3,600 Sedan • Toll Incl.</span>
                  </button>
                  <button type="button" className="quick-route-btn" onClick={() => handleQuickRouteSelect("blr-airport-mysore")}>
                    <span className="quick-route-name">Bangalore Airport ➔ Mysore</span>
                    <span className="quick-route-price">₹3,600 Sedan • Toll Incl.</span>
                  </button>
                  <button type="button" className="quick-route-btn" onClick={() => handleQuickRouteSelect("mysore-blr-city")}>
                    <span className="quick-route-name">Mysore ➔ Bangalore City</span>
                    <span className="quick-route-price">₹3,100 Sedan • Toll Incl.</span>
                  </button>
                </div>
              </div>

              {/* Interstate permits summary */}
              <div className="cleartrip-sidebar-card">
                <div className="sidebar-title-row">
                  <h2 className="sidebar-title">Border Permits (7 Days)</h2>
                </div>
                <ul style={{ paddingLeft: "1rem", fontSize: "0.75rem", color: "var(--text-gray)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <li>Sedan (All borders): <strong>₹600</strong></li>
                  <li>Ertiga SUV (All borders): <strong>₹1,000</strong></li>
                  <li>Innova (Tamil Nadu): <strong>₹1,250</strong></li>
                  <li>Innova (Kerala): <strong>₹3,000</strong></li>
                  <li>TT AC (Tamil Nadu): <strong>₹2,000</strong></li>
                  <li>TT AC (Kerala): <strong>₹4,000</strong></li>
                </ul>
              </div>
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
                      Date: {date} at {time} • {tripType === "airport" ? "Airport Transfer" : tripType === "city" ? "Bangalore Drop" : `Daily Tour (${numDays} Days)`}
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
                          {tripType === "daily" ? (
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
                      <button type="button" className="btn-secondary" style={{ marginTop: "1rem", display: "inline-flex" }} onClick={() => setOnly6Seaters(false)}>
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
                    {tripType === "daily" && (
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
                      <img src={getAssetPath("/icons/whatsapp.svg")} alt="" className="whatsapp-icon-white" />
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
                    href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(getWhatsAppMessage())}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-whatsapp-confirm"
                  >
                    <img src={getAssetPath("/icons/whatsapp.svg")} alt="" className="whatsapp-icon-white" />
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
                      setBookingId(`GAT-${Math.floor(100000 + Math.random() * 900000)}`);
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
        {step === 1 && (
          <section className="cleartrip-promo-row" id="promos" aria-label="Offers and Promotions">
            {/* Promo 1 */}
            <div className="promo-card">
              <div className="promo-img-box" style={{ color: "#22A06B" }}>🎁</div>
              <div className="promo-info">
                <span className="promo-tag">AIRPORT SPECIAL</span>
                <h3 className="promo-title">Flat 10% Off Drops</h3>
                <p className="promo-desc">Get 10% off on Mysore ➔ Bangalore Airport Drops. Code: <strong>AIRPORT10</strong></p>
              </div>
            </div>

            {/* Promo 2 */}
            <div className="promo-card">
              <div className="promo-img-box" style={{ color: "#FF4F00" }}>🎟️</div>
              <div className="promo-info">
                <span className="promo-tag">NEW TRAVELER</span>
                <h3 className="promo-title">₹150 Off First Trip</h3>
                <p className="promo-desc">Book your first ride and get ₹150 off instantly. Code: <strong>GAT150</strong></p>
              </div>
            </div>

            {/* Promo 3 */}
            <div className="promo-card">
              <div className="promo-img-box" style={{ color: "#3366CC" }}>📅</div>
              <div className="promo-info">
                <span className="promo-tag">MULTI-DAY TOUR</span>
                <h3 className="promo-title">Free Driver Day</h3>
                <p className="promo-desc">Driver allowance waived off on tours longer than 3 days. Code: <strong>TOURALLOW</strong></p>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* Floating WhatsApp button */}
      <a
        href={`https://wa.me/${siteConfig.whatsapp}`}
        className="whatsapp-float"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp support"
      >
        <img src={getAssetPath("/icons/whatsapp.svg")} alt="WhatsApp" className="whatsapp-float-icon" />
      </a>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <span className="footer-logo">GLOBAL AIR TRAVELS</span>
          <div className="footer-contact">
            <a href={`tel:${siteConfig.phone}`} className="footer-link">📞 Call: {siteConfig.phoneDisplay}</a>
            <span>•</span>
            <a href={`https://wa.me/${siteConfig.whatsapp}`} className="footer-link">💬 WhatsApp: {siteConfig.whatsappDisplay}</a>
            <span>•</span>
            <a href={`mailto:${siteConfig.email}`} className="footer-link">✉️ Email: {siteConfig.email}</a>
          </div>
          <div className="footer-copy">
            &copy; {new Date().getFullYear()} Global Air Travels. All rights reserved. Registered Cab Services, Mysore, Karnataka.
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
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" className="nav-icon" style={{ color: "var(--primary-orange)" }}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
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
                      href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent("Hello Global Air Travels, please verify status of Booking ID " + trackedBooking.id)}`}
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
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" className="nav-icon" style={{ color: "var(--primary-orange)" }}><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
              <span>Customer Helpdesk</span>
            </h2>
            <div className="modal-body">
              <p style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-gray)" }}>
                Need help with your booking? Contact our Mysore booking office directly:
              </p>
              
              <div className="booking-summary-box" style={{ margin: "0.5rem 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div>📞 <strong>Call booking manager:</strong> <a href={`tel:${siteConfig.phone}`} style={{ color: "var(--primary-blue)", fontWeight: 700 }}>{siteConfig.phoneDisplay}</a></div>
                <div>💬 <strong>WhatsApp Chat:</strong> <a href={`https://wa.me/${siteConfig.whatsapp}`} target="_blank" rel="noreferrer" style={{ color: "var(--success-green)", fontWeight: 700 }}>{siteConfig.whatsappDisplay}</a></div>
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
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" className="nav-icon" style={{ color: "var(--primary-orange)" }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
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
