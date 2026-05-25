"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";

export default function Home() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const getAssetPath = (path) => `${basePath}${path}`;

  // Form State
  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState("airport"); // 'airport', 'outstation', 'local'
  const [airportType, setAirportType] = useState("drop"); // 'pickup' (Airport to Mysore) or 'drop' (Mysore to Airport)
  const [outstationType, setOutstationType] = useState("oneway"); // 'oneway', 'roundtrip'
  const [localPackage, setLocalPackage] = useState("8hr"); // '8hr' (80km) or '12hr' (120km)
  
  const [pickup, setPickup] = useState("Mysore");
  const [drop, setDrop] = useState("Bangalore Airport (KIA)");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [seats, setSeats] = useState(4);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  // Selected Cab & Booking Info
  const [selectedCab, setSelectedCab] = useState(siteConfig.cabTypes[0]);
  const [bookingId, setBookingId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState("arrival"); // 'arrival', 'advance', 'full'

  // Pre-fill default date to tomorrow on load
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);
    
    // Generate a unique booking ID
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setBookingId(`GAT-${randomNum}`);
  }, []);

  // Sync pickup/drop based on airport direction
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

  // Sync defaults when switching tabs
  const handleTabChange = (tab) => {
    setTripType(tab);
    if (tab === "airport") {
      handleAirportDirectionChange("drop");
    } else if (tab === "outstation") {
      setPickup("Mysore");
      setDrop("Ooty");
    } else if (tab === "local") {
      setPickup("Mysore City");
      setDrop("Local Sightseeing");
    }
  };

  // Quick route select handler
  const handleQuickRouteSelect = (route) => {
    setPickup(route.pickup);
    setDrop(route.drop);
    if (route.id.includes("airport")) {
      setTripType("airport");
      setAirportType(route.id.startsWith("blr") ? "pickup" : "drop");
    } else {
      setTripType("outstation");
      setOutstationType("oneway");
    }
  };

  // Common suggestion lists
  const suggestions = {
    pickup: ["Mysore City", "Bangalore Airport (KIA)", "Bangalore City", "Ooty", "Coorg (Madikeri)", "Kabini"],
    drop: ["Bangalore Airport (KIA)", "Mysore City", "Bangalore City", "Ooty", "Coorg (Madikeri)", "Kabini"]
  };

  // Pricing engine
  const calculatePrice = (cab) => {
    // 1. Check if it's local rental
    if (tripType === "local") {
      const multiplier = localPackage === "12hr" ? 1.5 : 1.0;
      const baseLocal = cab.id === "sedan" ? 2000 : 
                        cab.id === "suv" ? 2800 : 
                        cab.id === "innova" ? 3800 : 
                        cab.id === "crysta" ? 4500 : 6000;
      return Math.round(baseLocal * multiplier);
    }

    // 2. Check if it matches popular predefined routes
    const isBlrAirportRoute = (pickup.toLowerCase().includes("airport") && drop.toLowerCase().includes("mysore")) ||
                               (pickup.toLowerCase().includes("mysore") && drop.toLowerCase().includes("airport"));
    
    const isBlrCityRoute = (pickup.toLowerCase().includes("bangalore") && !pickup.toLowerCase().includes("airport") && drop.toLowerCase().includes("mysore")) ||
                            (pickup.toLowerCase().includes("mysore") && drop.toLowerCase().includes("bangalore") && !drop.toLowerCase().includes("airport"));

    let basePrice = 0;
    if (isBlrAirportRoute) {
      basePrice = cab.mysoreBlrAirportPrice;
    } else if (isBlrCityRoute) {
      basePrice = cab.mysoreBlrCityPrice;
    } else {
      // 3. Fallback to distance calculation
      const estimatedKm = 160; // Mock distance
      basePrice = estimatedKm * cab.baseRatePerKm;
    }

    // Outstation roundtrip adjustments
    if (tripType === "outstation" && outstationType === "roundtrip") {
      return Math.round(basePrice * 1.8); // 80% extra for roundtrip (driver and return km savings)
    }

    return basePrice;
  };

  // Get total price for selected cab
  const totalPrice = calculatePrice(selectedCab);
  
  // Determine payment amount online now
  const onlinePaymentAmount = paymentMethod === "full" ? totalPrice : paymentMethod === "advance" ? 500 : 0;
  const payToDriverAmount = totalPrice - onlinePaymentAmount;

  // Form validations before proceeding
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!pickup || !drop || !date || !time) {
      alert("Please fill in all search details.");
      return;
    }
    // Set default seats matching first cab or user selector
    setStep(2);
  };

  const handleCabSelect = (cab) => {
    setSelectedCab(cab);
    setSeats(cab.seats);
    setStep(3);
  };

  const handlePassengerSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone || !pickupAddress) {
      alert("Please fill in Name, Phone, and Pickup Address.");
      return;
    }
    setStep(4);
  };

  // Generate UPI Deep Link
  const generateUpiLink = () => {
    const note = `Cab Booking ${bookingId}`;
    return `upi://pay?pa=${siteConfig.upiId}&pn=${encodeURIComponent(siteConfig.merchantName)}&am=${onlinePaymentAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
  };

  // WhatsApp checkout message generator
  const getWhatsAppMessage = () => {
    let tripDetails = "";
    if (tripType === "airport") {
      tripDetails = `Airport Transfer (${airportType === "drop" ? "Drop to Airport" : "Pickup from Airport"})`;
    } else if (tripType === "outstation") {
      tripDetails = `Outstation (${outstationType === "oneway" ? "One Way" : "Round Trip"})`;
    } else {
      tripDetails = `Local Rental (${localPackage === "8hr" ? "8 Hours / 80 Kms" : "12 Hours / 120 Kms"})`;
    }

    const payStatus = paymentMethod === "full" ? "Paid 100% Full UPI" : 
                      paymentMethod === "advance" ? "Paid ₹500 Advance UPI (Balance to Driver)" : 
                      "Pay to Driver (Cash/UPI)";

    return `Hello Global Air Travels,

I would like to book a cab. Here are my booking details:
*Booking ID:* ${bookingId}
*Trip Type:* ${tripDetails}
*Route:* ${pickup} ➔ ${drop}
*Date & Time:* ${date} at ${time}
*Car Model:* ${selectedCab.name} (${selectedCab.seats} Seater)

*Passenger Details:*
*Name:* ${name}
*Phone:* ${phone}
*Pickup Address:* ${pickupAddress}
${flightNumber ? `*Flight Number:* ${flightNumber}\n` : ""}
*Payment Option:* ${payStatus}
*Total Fare:* ₹${totalPrice}/-

Please confirm my booking. Thank you!`;
  };

  const handleWhatsAppRedirect = () => {
    const encodedText = encodeURIComponent(getWhatsAppMessage());
    window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodedText}`, "_blank");
    setStep(5);
  };

  const handleCompleteBooking = () => {
    // Send to success page
    setStep(5);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <a href="#" className="logo-link" onClick={() => setStep(1)}>
            <img src={getAssetPath("/icons/taxi.svg")} alt="Taxi Logo" className="logo-icon" />
            <span className="logo-text">
              GLOBAL<span className="logo-highlight">AIR</span>TRAVELS
            </span>
          </a>
          <a href={`tel:${siteConfig.phone}`} className="call-badge" aria-label="Call for Bookings">
            <img src={getAssetPath("/icons/phone.svg")} alt="Phone" className="call-icon" />
            <span>{siteConfig.phoneDisplay}</span>
          </a>
        </div>
      </header>

      {/* Hero section */}
      <section className="hero-section">
        <div className="hero-container">
          <h1 className="hero-title">{siteConfig.name}</h1>
          <p className="hero-subtitle">{siteConfig.tagline}</p>
        </div>
      </section>

      {/* Main Container */}
      <main className="main-content">
        {/* Stepper progress indicator */}
        <div className="stepper" role="navigation" aria-label="Progress Tracker">
          <div className={`step-item ${step >= 1 ? "active" : ""} ${step > 1 ? "completed" : ""}`}>
            <span className="step-number">1</span>
            <span>Search</span>
          </div>
          <div className="step-separator"></div>
          <div className={`step-item ${step >= 2 ? "active" : ""} ${step > 2 ? "completed" : ""}`}>
            <span className="step-number">2</span>
            <span>Cars</span>
          </div>
          <div className="step-separator"></div>
          <div className={`step-item ${step >= 3 ? "active" : ""} ${step > 3 ? "completed" : ""}`}>
            <span className="step-number">3</span>
            <span>Details</span>
          </div>
          <div className="step-separator"></div>
          <div className={`step-item ${step >= 4 ? "active" : ""} ${step > 4 ? "completed" : ""}`}>
            <span className="step-number">4</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Step 1: Search Form */}
        {step === 1 && (
          <div className="booking-card">
            {/* Service Type Tabs (Cleartrip layout) */}
            <div className="tabs-container" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tripType === "airport"}
                className={`tab-button ${tripType === "airport" ? "active" : ""}`}
                onClick={() => handleTabChange("airport")}
              >
                <img src={getAssetPath("/icons/airport.svg")} alt="" className="tab-icon" />
                <span>Airport Drop/Pickup</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tripType === "outstation"}
                className={`tab-button ${tripType === "outstation" ? "active" : ""}`}
                onClick={() => handleTabChange("outstation")}
              >
                <img src={getAssetPath("/icons/outstation.svg")} alt="" className="tab-icon" />
                <span>Outstation (One-Way / Round)</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tripType === "local"}
                className={`tab-button ${tripType === "local" ? "active" : ""}`}
                onClick={() => handleTabChange("local")}
              >
                <img src={getAssetPath("/icons/local.svg")} alt="" className="tab-icon" />
                <span>Local Rental</span>
              </button>
            </div>

            {/* Core Search Form */}
            <form onSubmit={handleSearchSubmit} className="form-grid">
              {/* Contextual suboptions */}
              {tripType === "airport" && (
                <div className="form-group">
                  <span className="form-label">Direction</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        backgroundColor: airportType === "drop" ? "var(--primary-navy-light)" : "transparent",
                        borderColor: airportType === "drop" ? "var(--primary-navy)" : "var(--border-color)",
                        color: airportType === "drop" ? "var(--primary-navy-dark)" : "var(--text-muted)"
                      }}
                      onClick={() => handleAirportDirectionChange("drop")}
                    >
                      <img src={getAssetPath("/icons/dropoff.svg")} alt="" style={{ width: 16 }} />
                      Drop to Airport
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        backgroundColor: airportType === "pickup" ? "var(--primary-navy-light)" : "transparent",
                        borderColor: airportType === "pickup" ? "var(--primary-navy)" : "var(--border-color)",
                        color: airportType === "pickup" ? "var(--primary-navy-dark)" : "var(--text-muted)"
                      }}
                      onClick={() => handleAirportDirectionChange("pickup")}
                    >
                      <img src={getAssetPath("/icons/pickup.svg")} alt="" style={{ width: 16 }} />
                      Pickup from Airport
                    </button>
                  </div>
                </div>
              )}

              {tripType === "outstation" && (
                <div className="form-group">
                  <span className="form-label">Trip Duration</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        backgroundColor: outstationType === "oneway" ? "var(--primary-navy-light)" : "transparent",
                        borderColor: outstationType === "oneway" ? "var(--primary-navy)" : "var(--border-color)",
                        color: outstationType === "oneway" ? "var(--primary-navy-dark)" : "var(--text-muted)"
                      }}
                      onClick={() => setOutstationType("oneway")}
                    >
                      <img src={getAssetPath("/icons/oneway.svg")} alt="" style={{ width: 16 }} />
                      One-Way
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        backgroundColor: outstationType === "roundtrip" ? "var(--primary-navy-light)" : "transparent",
                        borderColor: outstationType === "roundtrip" ? "var(--primary-navy)" : "var(--border-color)",
                        color: outstationType === "roundtrip" ? "var(--primary-navy-dark)" : "var(--text-muted)"
                      }}
                      onClick={() => setOutstationType("roundtrip")}
                    >
                      <img src={getAssetPath("/icons/roundtrip.svg")} alt="" style={{ width: 16 }} />
                      Round Trip
                    </button>
                  </div>
                </div>
              )}

              {tripType === "local" && (
                <div className="form-group">
                  <span className="form-label">Select Package</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        backgroundColor: localPackage === "8hr" ? "var(--primary-navy-light)" : "transparent",
                        borderColor: localPackage === "8hr" ? "var(--primary-navy)" : "var(--border-color)",
                        color: localPackage === "8hr" ? "var(--primary-navy-dark)" : "var(--text-muted)"
                      }}
                      onClick={() => setLocalPackage("8hr")}
                    >
                      8 Hrs / 80 Kms
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        backgroundColor: localPackage === "12hr" ? "var(--primary-navy-light)" : "transparent",
                        borderColor: localPackage === "12hr" ? "var(--primary-navy)" : "var(--border-color)",
                        color: localPackage === "12hr" ? "var(--primary-navy-dark)" : "var(--text-muted)"
                      }}
                      onClick={() => setLocalPackage("12hr")}
                    >
                      12 Hrs / 120 Kms
                    </button>
                  </div>
                </div>
              )}

              {/* Pickup location input */}
              <div className="form-group" style={{ position: "relative" }}>
                <label htmlFor="pickup-input" className="form-label">Pickup Location</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/location.svg")} alt="" className="input-icon" />
                  <input
                    id="pickup-input"
                    type="text"
                    className="form-input"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    onFocus={() => setShowPickupSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                    placeholder="Enter city, hotel, or airport"
                    required
                  />
                </div>
                {showPickupSuggestions && (
                  <ul className="booking-card" style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                    listStyle: "none"
                  }}>
                    {suggestions.pickup.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          style={{
                            width: "100%",
                            background: "none",
                            border: "none",
                            padding: "0.5rem",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "0.9rem"
                          }}
                          onMouseDown={() => setPickup(s)}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Drop location input */}
              <div className="form-group" style={{ position: "relative" }}>
                <label htmlFor="drop-input" className="form-label">Drop Location</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/location.svg")} alt="" className="input-icon" />
                  <input
                    id="drop-input"
                    type="text"
                    className="form-input"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    onFocus={() => setShowDropSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDropSuggestions(false), 200)}
                    placeholder="Enter destination city or location"
                    required
                    disabled={tripType === "local"}
                  />
                </div>
                {showDropSuggestions && (
                  <ul className="booking-card" style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    padding: "0.5rem",
                    marginTop: "0.25rem",
                    listStyle: "none"
                  }}>
                    {suggestions.drop.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          style={{
                            width: "100%",
                            background: "none",
                            border: "none",
                            padding: "0.5rem",
                            textAlign: "left",
                            cursor: "pointer",
                            fontSize: "0.9rem"
                          }}
                          onMouseDown={() => setDrop(s)}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Date & Time Picker */}
              <div className="form-grid two-cols" style={{ padding: 0 }}>
                <div className="form-group">
                  <label htmlFor="date-input" className="form-label">Travel Date</label>
                  <div className="input-wrapper">
                    <img src={getAssetPath("/icons/calendar.svg")} alt="" className="input-icon" />
                    <input
                      id="date-input"
                      type="date"
                      className="form-input"
                      value={date}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="time-input" className="form-label">Pickup Time</label>
                  <div className="input-wrapper">
                    <img src={getAssetPath("/icons/calendar.svg")} alt="" className="input-icon" />
                    <input
                      id="time-input"
                      type="time"
                      className="form-input"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Search Submit Button */}
              <button type="submit" className="btn-primary">
                Search Cab & Get Quotation
              </button>
            </form>

            {/* Predefined Quick Select Routes */}
            <div className="quick-routes-section">
              <h2 className="quick-routes-title">Popular Quick Booking Routes</h2>
              <div className="quick-routes-grid">
                {siteConfig.popularRoutes.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    className="quick-route-btn"
                    onClick={() => handleQuickRouteSelect(route)}
                  >
                    <span className="quick-route-name">{route.label}</span>
                    <span className="quick-route-price">
                      Presets available • Tap to select
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Cab Selection */}
        {step === 2 && (
          <div>
            {/* Route Summary Bar */}
            <div className="route-summary-bar">
              <div className="route-summary-info">
                <span className="route-summary-cities">
                  {pickup} ➔ {drop}
                </span>
                <span className="route-summary-details">
                  Date: {date} at {time} • {tripType === "airport" ? "Airport Transfer" : tripType === "outstation" ? `Outstation (${outstationType === "oneway" ? "One-way" : "Round trip"})` : `Local (${localPackage})`}
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ minHeight: "36px", padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
                onClick={() => setStep(1)}
              >
                Modify
              </button>
            </div>

            {/* Cab Card List */}
            <h2 className="quick-routes-title" style={{ marginBottom: "1rem" }}>Available Cabs</h2>
            <div className="cab-list">
              {siteConfig.cabTypes.map((cab) => {
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
                          alt={cab.name}
                          className="cab-icon-img"
                        />
                      </div>
                      
                      <div className="cab-meta">
                        <div className="cab-name-row">
                          <h3 className="cab-name">{cab.name}</h3>
                          <div className="cab-price-col">
                            <span className="cab-price">₹{cabPrice}</span>
                            <span className="cab-price-subtext"> (All Inc.)</span>
                          </div>
                        </div>
                        <p className="cab-example">e.g. {cab.example}</p>
                        
                        <div className="cab-specs">
                          <span className="cab-spec-badge">
                            👤 {cab.seats} Seats
                          </span>
                          <span className="cab-spec-badge">
                            💼 {cab.luggage}
                          </span>
                          <span className="cab-spec-badge">
                            ❄️ {cab.ac ? "AC" : "Non-AC"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fare Details Panel */}
                    <div className="cab-inclusions-card">
                      <div className="cab-inclusions-title">What is included in this fare?</div>
                      <ul className="cab-inclusions-list">
                        <li className="cab-inclusion-item">Toll Charges Included</li>
                        <li className="cab-inclusion-item">State Permit/Tax Included</li>
                        <li className="cab-inclusion-item">Driver Allowance Included</li>
                        <li className="cab-inclusion-item">GST Included</li>
                        <li className="cab-inclusion-item exclude">Parking charges (Excl.)</li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      className="btn-primary"
                      style={{
                        marginTop: "0.5rem",
                        backgroundColor: isSelected ? "var(--primary-navy)" : "var(--accent-yellow)",
                        color: isSelected ? "var(--text-white)" : "var(--primary-navy-dark)"
                      }}
                      onClick={() => handleCabSelect(cab)}
                    >
                      {isSelected ? "Select & Continue" : "Book This Cab"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Passenger Information */}
        {step === 3 && (
          <div className="booking-card">
            <h2 className="quick-routes-title" style={{ marginBottom: "1rem" }}>Passenger Details</h2>
            
            <form onSubmit={handlePassengerSubmit} className="passenger-form">
              {/* Name */}
              <div className="form-group">
                <label htmlFor="name-input" className="form-label">Full Name of Traveler</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/driver.svg")} alt="" className="input-icon" />
                  <input
                    id="name-input"
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

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="phone-input" className="form-label">Mobile Number</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/phone.svg")} alt="" className="input-icon" />
                  <input
                    id="phone-input"
                    type="tel"
                    className="form-input"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    pattern="[6-9][0-9]{9}"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
                <span className="cab-price-subtext" style={{ paddingLeft: "0.5rem" }}>
                  Used to send driver details via SMS & WhatsApp
                </span>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email-input" className="form-label">Email Address (Optional)</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/invoice.svg")} alt="" className="input-icon" />
                  <input
                    id="email-input"
                    type="email"
                    className="form-input"
                    placeholder="For invoice / receipts"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Pickup Address */}
              <div className="form-group">
                <label htmlFor="address-input" className="form-label">Full Pickup Address</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/location.svg")} alt="" className="input-icon" style={{ alignSelf: "flex-start", marginTop: "1rem" }} />
                  <textarea
                    id="address-input"
                    className="form-input"
                    style={{ minHeight: "100px", padding: "0.75rem 0.85rem 0.75rem 2.5rem", resize: "vertical" }}
                    placeholder="Enter home/hotel address, street name, pincode"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    required
                    autoComplete="street-address"
                  ></textarea>
                </div>
              </div>

              {/* Flight Details (Conditional) */}
              {tripType === "airport" && airportType === "pickup" && (
                <div className="form-group">
                  <label htmlFor="flight-input" className="form-label">Flight Number & Airport Terminal</label>
                  <div className="input-wrapper">
                    <img src={getAssetPath("/icons/airport.svg")} alt="" className="input-icon" />
                    <input
                      id="flight-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. 6E-2053, Terminal 2"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                    />
                  </div>
                  <span className="cab-price-subtext" style={{ paddingLeft: "0.5rem" }}>
                    Helps the driver track flight delays
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Confirm Fare Details ➔
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Checkout & Payment Options */}
        {step === 4 && (
          <div className="booking-card">
            <h2 className="quick-routes-title" style={{ marginBottom: "1rem" }}>Confirm Booking & Payment</h2>
            
            <div className="payment-section">
              {/* Bill Details */}
              <div className="trip-bill-summary">
                <div className="bill-title">Booking Invoice Summary</div>
                <div className="bill-row">
                  <span>Cab Category:</span>
                  <span style={{ fontWeight: 600 }}>{selectedCab.name} ({seats} Seater)</span>
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
                  <span>Base Trip Cost (All Included):</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="bill-row total">
                  <span>Total Amount Due:</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>

              {/* Payment Option Selector */}
              <h3 className="form-label" style={{ marginTop: "0.5rem" }}>Select Payment Option</h3>
              <div className="payment-methods" role="radiogroup" aria-label="Payment Options">
                {siteConfig.paymentOptions.map((opt) => {
                  const isSelected = paymentMethod === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`payment-method-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setPaymentMethod(opt.id)}
                    >
                      <input
                        type="radio"
                        id={opt.id}
                        name="payment"
                        checked={isSelected}
                        onChange={() => {}} // Controlled via onClick on parent card
                        className="payment-radio"
                      />
                      <div className="payment-method-info">
                        <label htmlFor={opt.id} className="payment-method-name">
                          {opt.name}
                          {opt.id === "full" && <span className="payment-badge">Zero Fees</span>}
                        </label>
                        <span className="payment-method-desc">{opt.description}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* UPI Online Payment Form (Dynamic) */}
              {paymentMethod !== "arrival" && (
                <div className="upi-gateway-container">
                  <div className="upi-brands">
                    <img src={getAssetPath("/icons/upi.svg")} alt="UPI logo" className="upi-brand-icon" style={{ height: 18 }} />
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#5f259f" }}>PhonePe Gateway</span>
                  </div>
                  
                  <div className="qr-instructions">
                    <span style={{ display: "block", fontWeight: 700, fontSize: "1rem", color: "var(--primary-navy-dark)" }}>
                      Amount to Pay Online: ₹{onlinePaymentAmount}
                    </span>
                    {paymentMethod === "advance" && (
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        (Pay remaining ₹{payToDriverAmount} to driver in cash/UPI)
                      </span>
                    )}
                  </div>

                  {/* QR Code Container */}
                  <div className="qr-code-box" aria-label="UPI Payment QR Code">
                    {/* Generates a live QR code directly mapping a standard UPI Merchant payload */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generateUpiLink())}`}
                      alt="Scan to pay via UPI"
                      className="qr-mock-img"
                    />
                  </div>

                  <p className="qr-instructions">
                    Scan this QR code with any UPI app (PhonePe, GPay, Paytm) to complete payment instantly.
                  </p>

                  <div className="pay-btn-group">
                    {/* Mobile App Deep link */}
                    <a
                      href={generateUpiLink()}
                      className="btn-phonepe-pay"
                    >
                      📱 Pay via UPI Apps (Mobile)
                    </a>
                  </div>
                </div>
              )}

              {/* Action Confirmation Buttons */}
              <div className="pay-btn-group" style={{ marginTop: "1rem" }}>
                {/* Fallback to WhatsApp Booking */}
                <button
                  type="button"
                  className="btn-whatsapp-confirm"
                  onClick={handleWhatsAppRedirect}
                >
                  <img src={getAssetPath("/icons/whatsapp.svg")} alt="" className="whatsapp-icon-white" />
                  Confirm & Send Details to WhatsApp
                </button>
                
                {/* Standard submit option */}
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    backgroundColor: "var(--primary-navy)",
                    color: "var(--text-white)"
                  }}
                  onClick={handleCompleteBooking}
                >
                  Confirm Booking (Pay on Arrival)
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep(3)}
                >
                  Back to Passenger Info
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Success / Thank you Page */}
        {step === 5 && (
          <div className="booking-card success-card">
            <div className="success-badge">
              <img src={getAssetPath("/icons/verified.svg")} alt="" className="success-icon-svg" />
            </div>
            
            <h2 className="success-title">Booking Request Received!</h2>
            <p className="success-desc">
              Thank you, {name}! Your trip booking request has been initiated successfully. We are assigning a driver for you.
            </p>

            {/* Booking Details Invoice */}
            <div className="booking-summary-box">
              <div className="booking-summary-title">Booking Details: {bookingId}</div>
              <div className="bill-row">
                <span>Traveler Name:</span>
                <span style={{ fontWeight: 600 }}>{name}</span>
              </div>
              <div className="bill-row">
                <span>Contact Number:</span>
                <span>{phone}</span>
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
                <span>Cab Assigned:</span>
                <span>{selectedCab.name} (AC)</span>
              </div>
              <div className="bill-row" style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                <span>Payment Plan:</span>
                <span style={{ fontWeight: 600 }}>
                  {paymentMethod === "full" ? "Paid Full Online" : 
                   paymentMethod === "advance" ? "Paid ₹500 (₹" + payToDriverAmount + " to Driver)" : 
                   "Pay to Driver (₹" + totalPrice + " on trip)"}
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
                Message Us on WhatsApp
              </a>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  // Reset states and book a new cab
                  setStep(1);
                  setPaymentMethod("arrival");
                  setName("");
                  setPhone("");
                  setEmail("");
                  setPickupAddress("");
                  setFlightNumber("");
                  // Generate new ID
                  setBookingId(`GAT-${Math.floor(100000 + Math.random() * 900000)}`);
                }}
              >
                Book Another Trip
              </button>
            </div>
          </div>
        )}

        {/* Brand Value Trust Badges */}
        <section className="features-grid">
          <div className="feature-item">
            <div className="feature-icon-box">
              <img src={getAssetPath("/icons/verified.svg")} alt="" className="feature-icon" />
            </div>
            <div className="feature-info">
              <h3 className="feature-title">Verified Cab Partners</h3>
              <p className="feature-desc">All vehicles are fully licensed and clean.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-box">
              <img src={getAssetPath("/icons/ontime.svg")} alt="" className="feature-icon" />
            </div>
            <div className="feature-info">
              <h3 className="feature-title">Punctual & Safe Trips</h3>
              <p className="feature-desc">Drivers arrive 15 minutes before pickup time.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-box">
              <img src={getAssetPath("/icons/ac.svg")} alt="" className="feature-icon" />
            </div>
            <div className="feature-info">
              <h3 className="feature-title">A/C Cabin Comfort</h3>
              <p className="feature-desc">Chilled AC, sanitized interior, and music player.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-box">
              <img src={getAssetPath("/icons/fare.svg")} alt="" className="feature-icon" />
            </div>
            <div className="feature-info">
              <h3 className="feature-title">Zero Hidden Fees</h3>
              <p className="feature-desc">Tolls and driver allowances are included in the quote.</p>
            </div>
          </div>
        </section>
      </main>

      {/* WhatsApp float badge */}
      <a
        href={`https://wa.me/${siteConfig.whatsapp}`}
        className="whatsapp-float"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <img src={getAssetPath("/icons/whatsapp.svg")} alt="WhatsApp Support" className="whatsapp-float-icon" />
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
            &copy; {new Date().getFullYear()} Global Air Travels. All rights reserved. Registered Cab Services, Mysore.
          </div>
        </div>
      </footer>
    </div>
  );
}
