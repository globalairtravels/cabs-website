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
  // Daily / Outstation options
  const [numDays, setNumDays] = useState(1);

  // Form Fields
  const [pickup, setPickup] = useState("Mysore");
  const [drop, setDrop] = useState("Bangalore Airport (KIA)");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);

  // Selected Cab & Passenger Info
  const [selectedCab, setSelectedCab] = useState(siteConfig.cabTypes[0]);
  const [bookingId, setBookingId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  
  // Payment Options: 'arrival' (Driver), 'advance' (₹500), 'full' (Total)
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

  // Sync inputs when trip type tab changes
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
  };

  const suggestions = {
    pickup: ["Mysore", "Bangalore Airport (KIA)", "Bangalore City", "Ooty", "Coorg (Madikeri)", "Kabini", "Bandipur"],
    drop: ["Bangalore Airport (KIA)", "Bangalore City", "Mysore", "Ooty", "Coorg (Madikeri)", "Kabini", "Bandipur"]
  };

  // Calculation Engine
  const calculatePrice = (cab) => {
    if (tripType === "airport") {
      return cab.airportPrice;
    } else if (tripType === "city") {
      return cab.cityPrice;
    } else {
      // Daily / Outstation package: (baseRatePerKm * minKmPerDay + driverAllowance) * numDays
      const baseFare = cab.ratePerKm * cab.minKmPerDay;
      const driverFare = cab.driverAllowance;
      return (baseFare + driverFare) * numDays;
    }
  };

  // Calculate pricing values
  const totalPrice = calculatePrice(selectedCab);
  
  // Custom booking advance structure (₹500 per day as noted in the leaflet)
  const requiredAdvance = tripType === "daily" ? 500 * numDays : 500;
  
  const onlinePaymentAmount = paymentMethod === "full" ? totalPrice : paymentMethod === "advance" ? requiredAdvance : 0;
  const payToDriverAmount = totalPrice - onlinePaymentAmount;

  // Navigation handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!pickup || !drop || !date || !time) {
      alert("Please fill in all routing fields.");
      return;
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
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <a href="#" className="logo-link" onClick={() => setStep(1)}>
            <img src={getAssetPath("/icons/taxi.svg")} alt="Logo" className="logo-icon" />
            <span className="logo-text">
              GLOBAL<span className="logo-highlight">AIR</span>TRAVELS
            </span>
          </a>
          <a href={`tel:${siteConfig.phone}`} className="call-badge" aria-label="Call booking manager">
            <img src={getAssetPath("/icons/phone.svg")} alt="" className="call-icon" />
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

      {/* Main Content Area */}
      <main className="main-content">
        {/* Stepper progress indicator */}
        <div className="stepper" role="navigation" aria-label="Booking Progress">
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

        {/* Step 1: Search and Book Form */}
        {step === 1 && (
          <div className="booking-card">
            {/* Service Type Tabs (Cleartrip style) */}
            <div className="tabs-container" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tripType === "airport"}
                className={`tab-button ${tripType === "airport" ? "active" : ""}`}
                onClick={() => handleTabChange("airport")}
              >
                <img src={getAssetPath("/icons/airport.svg")} alt="" className="tab-icon" />
                <span>Airport transfer</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tripType === "city"}
                className={`tab-button ${tripType === "city" ? "active" : ""}`}
                onClick={() => handleTabChange("city")}
              >
                <img src={getAssetPath("/icons/route.svg")} alt="" className="tab-icon" />
                <span>Bangalore Drops</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tripType === "daily"}
                className={`tab-button ${tripType === "daily" ? "active" : ""}`}
                onClick={() => handleTabChange("daily")}
              >
                <img src={getAssetPath("/icons/calendar.svg")} alt="" className="tab-icon" />
                <span>Local / Tour (Daily)</span>
              </button>
            </div>

            {/* Configurable directions and inputs based on tabs */}
            <form onSubmit={handleSearchSubmit} className="form-grid">
              
              {/* DIRECTION - Airport Transfer */}
              {tripType === "airport" && (
                <div className="form-group">
                  <span className="form-label">Transfer Direction</span>
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

              {/* DIRECTION - Bangalore City drops */}
              {tripType === "city" && (
                <div className="form-group">
                  <span className="form-label">Transfer Direction</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        backgroundColor: cityType === "drop" ? "var(--primary-navy-light)" : "transparent",
                        borderColor: cityType === "drop" ? "var(--primary-navy)" : "var(--border-color)",
                        color: cityType === "drop" ? "var(--primary-navy-dark)" : "var(--text-muted)"
                      }}
                      onClick={() => handleCityDirectionChange("drop")}
                    >
                      Mysore ➔ Bangalore
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        flex: 1,
                        backgroundColor: cityType === "pickup" ? "var(--primary-navy-light)" : "transparent",
                        borderColor: cityType === "pickup" ? "var(--primary-navy)" : "var(--border-color)",
                        color: cityType === "pickup" ? "var(--primary-navy-dark)" : "var(--text-muted)"
                      }}
                      onClick={() => handleCityDirectionChange("pickup")}
                    >
                      Bangalore ➔ Mysore
                    </button>
                  </div>
                </div>
              )}

              {/* DURATION - Daily Local or Outstation */}
              {tripType === "daily" && (
                <div className="form-group">
                  <label htmlFor="duration-select" className="form-label">Hire Duration (Days)</label>
                  <div className="input-wrapper">
                    <img src={getAssetPath("/icons/calendar.svg")} alt="" className="input-icon" />
                    <select
                      id="duration-select"
                      className="form-select"
                      value={numDays}
                      onChange={(e) => setNumDays(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                        <option key={d} value={d}>{d} Day{d > 1 ? "s" : ""} Hire Package</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Pickup field */}
              <div className="form-group" style={{ position: "relative" }}>
                <label htmlFor="pickup-loc" className="form-label">Pickup Location</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/location.svg")} alt="" className="input-icon" />
                  <input
                    id="pickup-loc"
                    type="text"
                    className="form-input"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    onFocus={() => setShowPickupSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                    placeholder="Enter pickup city/location"
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

              {/* Drop field */}
              <div className="form-group" style={{ position: "relative" }}>
                <label htmlFor="drop-loc" className="form-label">Drop Location</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/location.svg")} alt="" className="input-icon" />
                  <input
                    id="drop-loc"
                    type="text"
                    className="form-input"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    onFocus={() => setShowDropSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDropSuggestions(false), 200)}
                    placeholder="Enter drop destination"
                    required
                    disabled={tripType === "daily"}
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

              {/* Date and Time selectors */}
              <div className="form-grid two-cols" style={{ padding: 0 }}>
                <div className="form-group">
                  <label htmlFor="travel-date" className="form-label">Journey Date</label>
                  <div className="input-wrapper">
                    <img src={getAssetPath("/icons/calendar.svg")} alt="" className="input-icon" />
                    <input
                      id="travel-date"
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
                  <label htmlFor="travel-time" className="form-label">Pickup Time</label>
                  <div className="input-wrapper">
                    <img src={getAssetPath("/icons/calendar.svg")} alt="" className="input-icon" />
                    <input
                      id="travel-time"
                      type="time"
                      className="form-input"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Inclusions note helper */}
              {tripType === "airport" && (
                <div className="cab-inclusions-card" style={{ margin: 0 }}>
                  <div className="cab-inclusion-item">Toll charges & driver allowance included.</div>
                  <div className="cab-inclusion-item">Airport pickup waiting up to 45 mins included.</div>
                </div>
              )}

              {tripType === "city" && (
                <div className="cab-inclusions-card" style={{ margin: 0 }}>
                  <div className="cab-inclusion-item">Includes Toll (₹400) + Base Fare.</div>
                  <div className="cab-inclusion-item">150 Kms Limit drop.</div>
                </div>
              )}

              {tripType === "daily" && (
                <div className="cab-inclusions-card" style={{ margin: 0 }}>
                  <div className="cab-inclusion-item">Outstation daily charge calculates min runs per day.</div>
                  <div className="cab-inclusion-item">Toll, State border permits, and parking are separate (paid by guest).</div>
                </div>
              )}

              <button type="submit" className="btn-primary">
                Search Available Cabs ➔
              </button>
            </form>

            {/* Presets Shortcuts */}
            <div className="quick-routes-section">
              <h2 className="quick-routes-title">Popular Quick Route Shortcuts</h2>
              <div className="quick-routes-grid">
                <button type="button" className="quick-route-btn" onClick={() => handleQuickRouteSelect("mysore-blr-airport")}>
                  <span className="quick-route-name">Mysore ➔ Bangalore Airport</span>
                  <span className="quick-route-price">₹3,600 Sedan • Toll Included</span>
                </button>
                <button type="button" className="quick-route-btn" onClick={() => handleQuickRouteSelect("blr-airport-mysore")}>
                  <span className="quick-route-name">Bangalore Airport ➔ Mysore</span>
                  <span className="quick-route-price">₹3,600 Sedan • Toll Included</span>
                </button>
                <button type="button" className="quick-route-btn" onClick={() => handleQuickRouteSelect("mysore-blr-city")}>
                  <span className="quick-route-name">Mysore ➔ Bangalore City</span>
                  <span className="quick-route-price">₹3,100 Sedan • Toll Included</span>
                </button>
                <button type="button" className="quick-route-btn" onClick={() => handleQuickRouteSelect("blr-city-mysore")}>
                  <span className="quick-route-name">Bangalore City ➔ Mysore</span>
                  <span className="quick-route-price">₹3,100 Sedan • Toll Included</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Cab Options */}
        {step === 2 && (
          <div>
            {/* Trip Config Summary Bar */}
            <div className="route-summary-bar">
              <div className="route-summary-info">
                <span className="route-summary-cities">
                  {pickup} ➔ {drop}
                </span>
                <span className="route-summary-details">
                  Date: {date} at {time} • {tripType === "airport" ? "Airport Drop/Pickup" : tripType === "city" ? "Bangalore City Transfer" : `Daily Tour (${numDays} Days)`}
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ minHeight: "36px", padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
                onClick={() => setStep(1)}
              >
                Change
              </button>
            </div>

            {/* Cab Card grid */}
            <h2 className="quick-routes-title" style={{ marginBottom: "1rem" }}>Select Your Car</h2>
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
                          <span className="cab-spec-badge">{cab.ac ? "❄️ AC" : "💨 Non-AC"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rates breakdowns depending on service type */}
                    <div className="cab-inclusions-card">
                      {tripType === "daily" ? (
                        <>
                          <div className="cab-inclusions-title">Daily Booking Fare Details</div>
                          <ul className="cab-inclusions-list">
                            <li className="cab-inclusion-item">Running Rate: <strong>₹{cab.ratePerKm}/km</strong></li>
                            <li className="cab-inclusion-item">Minimum Run Limit: <strong>{cab.minKmPerDay} km/day</strong></li>
                            <li className="cab-inclusion-item">Driver Allowance: <strong>₹{cab.driverAllowance}/day</strong></li>
                            <li className="cab-inclusion-item exclude">Tolls, Border Permits, Parking (Excl.)</li>
                          </ul>
                          <div style={{ fontSize: "0.75rem", marginTop: "0.5rem", color: "var(--text-muted)", borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem" }}>
                            Assured Base: (₹{cab.ratePerKm} × {cab.minKmPerDay} km + ₹{cab.driverAllowance}) × {numDays} Days = <strong>₹{cabPrice}</strong>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="cab-inclusions-title">Assured Inclusions</div>
                          <ul className="cab-inclusions-list">
                            <li className="cab-inclusion-item">Toll Charges Included</li>
                            <li className="cab-inclusion-item">State Border permit/tax Included</li>
                            <li className="cab-inclusion-item">Driver Allowance Included</li>
                            <li className="cab-inclusion-item">GST Included</li>
                            <li className="cab-inclusion-item exclude">Airport Parking charges (Excl.)</li>
                          </ul>
                        </>
                      )}
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
                      {isSelected ? "Selected (Proceed)" : "Choose This Car"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Interstate Permits Table for reference */}
            {tripType === "daily" && (
              <div className="booking-card" style={{ marginTop: "1.5rem" }}>
                <h3 className="quick-routes-title" style={{ marginBottom: "0.5rem" }}>
                  {siteConfig.interstatePermits.title}
                </h3>
                <p className="cab-price-subtext" style={{ marginBottom: "0.75rem" }}>
                  {siteConfig.interstatePermits.note}
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-primary)", fontWeight: 700 }}>
                        <th style={{ padding: "0.5rem 0.25rem" }}>Vehicle</th>
                        <th style={{ padding: "0.5rem 0.25rem" }}>State Border</th>
                        <th style={{ padding: "0.5rem 0.25rem", textAlign: "right" }}>Permit Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siteConfig.interstatePermits.details.map((p, index) => (
                        <tr key={index} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "0.5rem 0.25rem", color: "var(--text-primary)" }}>{p.vehicle}</td>
                          <td style={{ padding: "0.5rem 0.25rem", color: "var(--text-muted)" }}>{p.state}</td>
                          <td style={{ padding: "0.5rem 0.25rem", color: "var(--primary-navy-dark)", fontWeight: 700, textAlign: "right" }}>₹{p.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Passenger Information */}
        {step === 3 && (
          <div className="booking-card">
            <h2 className="quick-routes-title" style={{ marginBottom: "1rem" }}>Passenger Information</h2>
            
            <form onSubmit={handlePassengerSubmit} className="passenger-form">
              {/* Traveler name */}
              <div className="form-group">
                <label htmlFor="traveler-name" className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/driver.svg")} alt="" className="input-icon" />
                  <input
                    id="traveler-name"
                    type="text"
                    className="form-input"
                    placeholder="Enter primary passenger's name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="form-group">
                <label htmlFor="traveler-phone" className="form-label">Mobile Number (WhatsApp preferred)</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/phone.svg")} alt="" className="input-icon" />
                  <input
                    id="traveler-phone"
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
                  Used to send driver allotment details, phone, and car plate number.
                </span>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="traveler-email" className="form-label">Email Address (Optional)</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/invoice.svg")} alt="" className="input-icon" />
                  <input
                    id="traveler-email"
                    type="email"
                    className="form-input"
                    placeholder="For booking receipts and invoices"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Pickup Address */}
              <div className="form-group">
                <label htmlFor="traveler-address" className="form-label">Detailed Pickup Address</label>
                <div className="input-wrapper">
                  <img src={getAssetPath("/icons/location.svg")} alt="" className="input-icon" style={{ alignSelf: "flex-start", marginTop: "1rem" }} />
                  <textarea
                    id="traveler-address"
                    className="form-input"
                    style={{ minHeight: "90px", padding: "0.75rem 0.85rem 0.75rem 2.5rem", resize: "vertical" }}
                    placeholder="Enter street, hotel name, landmark, or specific airport terminal"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    required
                    autoComplete="street-address"
                  ></textarea>
                </div>
              </div>

              {/* Flight details if Airport pickup */}
              {tripType === "airport" && airportType === "pickup" && (
                <div className="form-group">
                  <label htmlFor="traveler-flight" className="form-label">Flight Number & Arrival Terminal</label>
                  <div className="input-wrapper">
                    <img src={getAssetPath("/icons/airport.svg")} alt="" className="input-icon" />
                    <input
                      id="traveler-flight"
                      type="text"
                      className="form-input"
                      placeholder="e.g., AI-508, Terminal 2"
                      value={flightNumber}
                      onChange={(e) => setFlightNumber(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
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
                  Review Booking Details ➔
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Checkout and UPI Details */}
        {step === 4 && (
          <div className="booking-card">
            <h2 className="quick-routes-title" style={{ marginBottom: "1rem" }}>Confirm Your Trip Booking</h2>
            
            <div className="payment-section">
              {/* Price Calculation Invoice Card */}
              <div className="trip-bill-summary">
                <div className="bill-title">Assured Booking Invoice</div>
                <div className="bill-row">
                  <span>Car Selected:</span>
                  <span style={{ fontWeight: 600 }}>{selectedCab.name}</span>
                </div>
                <div className="bill-row">
                  <span>Route:</span>
                  <span>{pickup} to {drop}</span>
                </div>
                <div className="bill-row">
                  <span>Reporting Time:</span>
                  <span>{date} at {time}</span>
                </div>
                {tripType === "daily" && (
                  <div className="bill-row">
                    <span>Duration:</span>
                    <span>{numDays} Day{numDays > 1 ? "s" : ""} Hire</span>
                  </div>
                )}
                <div className="bill-row total">
                  <span>Assured Fare (All Inc.):</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>

              {/* Payment selector */}
              <h3 className="form-label" style={{ marginTop: "0.5rem" }}>Select Payment Option</h3>
              <div className="payment-methods" role="radiogroup" aria-label="Payment Preference">
                {/* Pay on arrival */}
                <div
                  className={`payment-method-card ${paymentMethod === "arrival" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("arrival")}
                >
                  <input
                    type="radio"
                    id="pay-arrival"
                    name="payment"
                    checked={paymentMethod === "arrival"}
                    onChange={() => {}}
                    className="payment-radio"
                  />
                  <div className="payment-method-info">
                    <label htmlFor="pay-arrival" className="payment-method-name">Pay to Driver</label>
                    <span className="payment-method-desc">Pay full amount of ₹{totalPrice} directly to driver using cash or UPI at trip end.</span>
                  </div>
                </div>

                {/* Secure booking with Rs. 500 advance per day as noted in the leaflet */}
                <div
                  className={`payment-method-card ${paymentMethod === "advance" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("advance")}
                >
                  <input
                    type="radio"
                    id="pay-advance"
                    name="payment"
                    checked={paymentMethod === "advance"}
                    onChange={() => {}}
                    className="payment-radio"
                  />
                  <div className="payment-method-info">
                    <label htmlFor="pay-advance" className="payment-method-name">
                      Pay Booking Advance (₹{requiredAdvance})
                      <span className="payment-badge" style={{ backgroundColor: "var(--accent-yellow-light)", color: "var(--accent-yellow-dark)" }}>Leaflet Policy</span>
                    </label>
                    <span className="payment-method-desc">Pay ₹{requiredAdvance} now via GPay/PhonePe to secure booking. Balance ₹{payToDriverAmount} to driver.</span>
                  </div>
                </div>

                {/* Pay full online */}
                <div
                  className={`payment-method-card ${paymentMethod === "full" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("full")}
                >
                  <input
                    type="radio"
                    id="pay-full"
                    name="payment"
                    checked={paymentMethod === "full"}
                    onChange={() => {}}
                    className="payment-radio"
                  />
                  <div className="payment-method-info">
                    <label htmlFor="pay-full" className="payment-method-name">
                      Pay Full Amount (₹{totalPrice})
                      <span className="payment-badge">Zero Charges</span>
                    </label>
                    <span className="payment-method-desc">100% online payment with zero processing charges via PhonePe UPI.</span>
                  </div>
                </div>
              </div>

              {/* UPI QR Mock Panel */}
              {paymentMethod !== "arrival" && (
                <div className="upi-gateway-container">
                  <div className="upi-brands">
                    <img src={getAssetPath("/icons/upi.svg")} alt="UPI" className="upi-brand-icon" style={{ height: 18 }} />
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#5f259f" }}>GPay / PhonePe Merchant Payment</span>
                  </div>
                  
                  <div className="qr-instructions">
                    <span style={{ display: "block", fontWeight: 700, fontSize: "1.1rem", color: "var(--primary-navy-dark)" }}>
                      Amount Online: ₹{onlinePaymentAmount}
                    </span>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                      Payee Name: <strong>{siteConfig.merchantName}</strong>
                    </span>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Phone Number: <strong>{siteConfig.phoneDisplay}</strong>
                    </span>
                  </div>

                  {/* UPI QR Canvas API Call */}
                  <div className="qr-code-box">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generateUpiLink())}`}
                      alt="UPI QR Code"
                      className="qr-mock-img"
                    />
                  </div>

                  <p className="qr-instructions">
                    Scan using PhonePe, Google Pay, or Paytm. The amount and payee details are pre-filled.
                  </p>

                  <div className="pay-btn-group">
                    {/* Native Deep Link invocation */}
                    <a
                      href={generateUpiLink()}
                      className="btn-phonepe-pay"
                    >
                      📱 Pay via UPI Mobile App
                    </a>
                  </div>
                </div>
              )}

              {/* Submission buttons */}
              <div className="pay-btn-group" style={{ marginTop: "1rem" }}>
                
                {/* Whatsapp Confirmation (Main Booking Submission) */}
                <button
                  type="button"
                  className="btn-whatsapp-confirm"
                  onClick={handleWhatsAppRedirect}
                >
                  <img src={getAssetPath("/icons/whatsapp.svg")} alt="" className="whatsapp-icon-white" />
                  Confirm & Send Details to WhatsApp
                </button>
                
                {/* Traditional confirm booking */}
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    backgroundColor: "var(--primary-navy)",
                    color: "var(--text-white)"
                  }}
                  onClick={() => setStep(5)}
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

        {/* Step 5: Booking Success */}
        {step === 5 && (
          <div className="booking-card success-card">
            <div className="success-badge">
              <img src={getAssetPath("/icons/verified.svg")} alt="" className="success-icon-svg" />
            </div>
            
            <h2 className="success-title">Booking Registered!</h2>
            <p className="success-desc">
              Dear {name}, we have registered your booking request. We are arranging the driver and vehicle for you.
            </p>

            {/* Receipt invoice details */}
            <div className="booking-summary-box">
              <div className="booking-summary-title">Booking Summary: {bookingId}</div>
              <div className="bill-row">
                <span>Passenger:</span>
                <span style={{ fontWeight: 600 }}>{name}</span>
              </div>
              <div className="bill-row">
                <span>Mobile:</span>
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
                <span>Vehicle Class:</span>
                <span>{selectedCab.name}</span>
              </div>
              <div className="bill-row" style={{ borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                <span>Payment Plan:</span>
                <span style={{ fontWeight: 600, color: "var(--primary-navy-dark)" }}>
                  {paymentMethod === "full" ? "Paid Full Online" : 
                   paymentMethod === "advance" ? `Paid ₹${requiredAdvance} Advance (₹${payToDriverAmount} to Driver)` : 
                   `Pay Driver ₹${totalPrice} at end of trip`}
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
                Message Booking Details on WhatsApp
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

        {/* Brand Value Trust Badges */}
        <section className="features-grid">
          <div className="feature-item">
            <div className="feature-icon-box">
              <img src={getAssetPath("/icons/verified.svg")} alt="" className="feature-icon" />
            </div>
            <div className="feature-info">
              <h3 className="feature-title">Leaflet Verified Cabs</h3>
              <p className="feature-desc">All clean vehicles driven by verified professional drivers.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-box">
              <img src={getAssetPath("/icons/ontime.svg")} alt="" className="feature-icon" />
            </div>
            <div className="feature-info">
              <h3 className="feature-title">Punctual Pickups</h3>
              <p className="feature-desc">Drivers arrive early. Our commitment is comfort & safety.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-box">
              <img src={getAssetPath("/icons/ac.svg")} alt="" className="feature-icon" />
            </div>
            <div className="feature-info">
              <h3 className="feature-title">Chilled AC Comfort</h3>
              <p className="feature-desc">Proper climate control and clean seating environment.</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon-box">
              <img src={getAssetPath("/icons/fare.svg")} alt="" className="feature-icon" />
            </div>
            <div className="feature-info">
              <h3 className="feature-title">Zero Hidden Surcharges</h3>
              <p className="feature-desc">Tolls and driver allowances are included in transfer quotes.</p>
            </div>
          </div>
        </section>

        {/* Special Terms accordion info list */}
        <div className="booking-card" style={{ marginTop: "1.5rem" }}>
          <h3 className="quick-routes-title" style={{ marginBottom: "0.5rem" }}>Terms & Tour Guidelines</h3>
          <ul style={{ paddingLeft: "1.25rem", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {siteConfig.notes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      </main>

      {/* Float WhatsApp icon */}
      <a
        href={`https://wa.me/${siteConfig.whatsapp}`}
        className="whatsapp-float"
        target="_blank"
        rel="noreferrer"
        aria-label="Contact manager on WhatsApp"
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
