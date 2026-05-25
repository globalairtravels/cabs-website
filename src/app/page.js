"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";

export default function Home() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const getAssetPath = (path) => `${basePath}${path}`;

  // Booking Flow States
  const [step, setStep] = useState(1);
  const [tripType, setTripType] = useState("airport"); // 'airport', 'city', 'daily'
  
  // Airport direction options: 'drop' (Mysore to Airport) or 'pickup' (Airport to Mysore)
  const [airportType, setAirportType] = useState("drop");
  // City direction options: 'drop' (Mysore to Blr City) or 'pickup' (Blr City to Mysore)
  const [cityType, setCityType] = useState("drop");
  
  // Trip Duration options
  const [outstationDirection, setOutstationDirection] = useState("oneway"); // 'oneway', 'roundtrip'
  const [numDays, setNumDays] = useState(1);
  const [swapRotation, setSwapRotation] = useState(0);

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

  // Common suggestions lists
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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Pure White Header matching Cleartrip */}
      <header className="header">
        <div className="header-container">
          <a href="#" className="logo-link" onClick={() => setStep(1)}>
            <img src={getAssetPath("/icons/taxi.svg")} alt="Taxi Logo" className="logo-icon" />
            <span className="logo-text">
              GLOBAL<span className="logo-highlight">AIR</span>TRAVELS
            </span>
          </a>
          <a href={`tel:${siteConfig.phone}`} className="call-badge" aria-label="Call Booking Manager">
            <img src={getAssetPath("/icons/phone.svg")} alt="" className="call-icon" />
            <span>Call: {siteConfig.phoneDisplay}</span>
          </a>
        </div>
      </header>

      {/* Main Wrapper Layout */}
      <div className="main-wrapper">
        
        {/* Product Switcher Pills (Flights, Hotels, Buses style) */}
        {step === 1 && (
          <nav className="product-switcher-bar" aria-label="Service Type">
            <button
              type="button"
              className={`product-pill ${tripType === "airport" ? "active" : ""}`}
              onClick={() => handleTabChange("airport")}
            >
              <div className="product-icon-wrapper">
                <img src={getAssetPath("/icons/airport.svg")} alt="" className="product-icon" />
              </div>
              <span>Airport Transfer</span>
            </button>
            <button
              type="button"
              className={`product-pill ${tripType === "city" ? "active" : ""}`}
              onClick={() => handleTabChange("city")}
            >
              <div className="product-icon-wrapper">
                <img src={getAssetPath("/icons/route.svg")} alt="" className="product-icon" />
              </div>
              <span>Bangalore Drops</span>
            </button>
            <button
              type="button"
              className={`product-pill ${tripType === "daily" ? "active" : ""}`}
              onClick={() => handleTabChange("daily")}
            >
              <div className="product-icon-wrapper">
                <img src={getAssetPath("/icons/calendar.svg")} alt="" className="product-icon" />
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
                        style={{ transform: `translate(-50%, -50%) rotate(${swapRotation}deg)` }}
                        aria-label="Swap pickup and drop locations"
                      >
                        <img src={getAssetPath("/icons/route.svg")} alt="" className="swap-circle-icon" />
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
              <div className="cleartrip-ad-card">
                <span className="ad-badge">Special Rate</span>
                <p className="ad-text">Mysore ⇄ KIA Airport Drop starting at just ₹3,600/-</p>
                <span className="ad-footer">Includes driver allowance & toll tax!</span>
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
                      <img src={getAssetPath("/icons/driver.svg")} alt="" className="input-icon" />
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
                      <img src={getAssetPath("/icons/phone.svg")} alt="" className="input-icon" />
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
                      <img src={getAssetPath("/icons/invoice.svg")} alt="" className="input-icon" />
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
                      <img src={getAssetPath("/icons/location.svg")} alt="" className="input-icon" style={{ alignSelf: "flex-start", marginTop: "0.8rem" }} />
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
          <section className="cleartrip-promo-row" aria-label="Offers and Promotions">
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
    </div>
  );
}
