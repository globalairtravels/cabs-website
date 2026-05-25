// Global Air Travels site configuration based on official leaflet
export const siteConfig = {
  name: "Global Air Travels",
  tagline: "Simplest Cab Booking in Mysore & Bangalore",
  phone: "+919844082581", // Contact number from leaflet
  phoneDisplay: "+91 98440 82581",
  whatsapp: "+919844082581",
  whatsappDisplay: "+91 98440 82581",
  email: "booking@globalairtravels.com",
  upiId: "9844082581@ybl", // Payee UPI ID based on the phone number
  merchantName: "Madhusudan H G", // Name from payment details in leaflet
  
  // Service Packages based on official leaflet structure
  popularRoutes: [
    {
      id: "mysore-blr-airport-oneway",
      label: "One-Way Airport Transfer (Mysore ⇄ Bangalore Airport)",
      pickup: "Mysore",
      drop: "Bangalore Airport (KIA)",
      distanceKm: 180,
      description: "Toll & Driver allowance included! Airport waiting up to 45 mins included.",
      pricing: {
        sedan: 3600,
        suv: 4500, // Ertiga
        innova: 4700,
        crysta: 5400,
        tempo: 7200 // Est. based on per km AC minimums
      }
    },
    {
      id: "mysore-blr-city-oneway",
      label: "Mysore ⇄ Bangalore City One Way (150 Kms Limit)",
      pickup: "Mysore",
      drop: "Bangalore City",
      distanceKm: 150,
      description: "Includes Toll (₹400) + Base Fare.",
      pricing: {
        sedan: 3100, // 2700 + 400 toll
        suv: 3900,   // 3500 + 400 toll (Ertiga)
        innova: 4100, // 3700 + 400 toll
        crysta: 4600, // 4200 + 400 toll
        tempo: 7200  // Est. base
      }
    }
  ],

  // Cab types — icons live in public/icons/categories/
  cabTypes: [
    {
      id: "sedan",
      name: "Sedan AC",
      icon: "categories/sedan.svg",
      example: "Etios, Dzire, Xcent",
      seats: 4,
      luggage: "2 Bags",
      ac: true,
      ratePerKm: 12, // From leaflet
      minKmPerDay: 250, // From leaflet
      driverAllowance: 400, // From leaflet
      airportPrice: 3600,
      cityPrice: 3100,
      description: "Comfortable and economical. Perfect for quick drops and small families."
    },
    {
      id: "suv",
      name: "Ertiga AC",
      icon: "categories/suv.svg",
      example: "Ertiga (6+1)",
      seats: 6,
      luggage: "3 Bags",
      ac: true,
      ratePerKm: 15, // From leaflet
      minKmPerDay: 250, // From leaflet
      driverAllowance: 400, // From leaflet
      airportPrice: 4500,
      cityPrice: 3900,
      description: "Ideal for family travel, offering extra seats and flexible luggage space."
    },
    {
      id: "innova",
      name: "Innova AC",
      icon: "categories/innova.svg",
      example: "Innova (7+1)",
      seats: 7,
      luggage: "4 Bags",
      ac: true,
      ratePerKm: 16, // From leaflet
      minKmPerDay: 250, // From leaflet
      driverAllowance: 400, // From leaflet
      airportPrice: 4700,
      cityPrice: 4100,
      description: "Standard premium family ride, highly stable and comfortable for long distances."
    },
    {
      id: "crysta",
      name: "Crysta AC",
      icon: "categories/crysta.svg",
      example: "Innova Crysta AC",
      seats: 7,
      luggage: "4 Bags",
      ac: true,
      ratePerKm: 17, // From leaflet
      minKmPerDay: 250, // From leaflet
      driverAllowance: 400, // From leaflet
      airportPrice: 5400,
      cityPrice: 4600,
      description: "Ultimate luxury and safety, executive ride for family or business groups."
    },
    {
      id: "tempo",
      name: "Tempo Traveller AC",
      icon: "categories/tempo-cat.svg",
      example: "TT (12+1 Seater)",
      seats: 12,
      luggage: "8 Bags",
      ac: true,
      ratePerKm: 22, // From leaflet
      minKmPerDay: 300, // From leaflet
      driverAllowance: 600, // From leaflet
      airportPrice: 7200,
      cityPrice: 7200,
      description: "Best for wedding groups, pilgrim groups, and large family tours."
    },
    {
      id: "tempo-non-ac",
      name: "Tempo Traveller Non-AC",
      icon: "categories/tempo-cat.svg",
      example: "TT (12+1 Seater)",
      seats: 12,
      luggage: "8 Bags",
      ac: false,
      ratePerKm: 20, // From leaflet
      minKmPerDay: 300, // From leaflet
      driverAllowance: 600, // From leaflet
      airportPrice: 6600,
      cityPrice: 6600,
      description: "Budget-friendly option for larger group travels where AC is not needed."
    }
  ],

  // Interstate Permits list for display/help
  interstatePermits: {
    title: "Interstate Permit / Tax (Valid for 7 Days)",
    note: "Paid directly by guest if crossing state borders",
    details: [
      { vehicle: "Sedan", state: "All borders", price: 600 },
      { vehicle: "Ertiga (SUV)", state: "All borders", price: 1000 },
      { vehicle: "Innova / Crysta", state: "Tamil Nadu", price: 1250 },
      { vehicle: "Innova / Crysta", state: "Kerala", price: 3000 },
      { vehicle: "Innova / Crysta", state: "Andhra", price: 2500 },
      { vehicle: "Tempo Traveller", state: "Tamil Nadu", price: 2000 },
      { vehicle: "Tempo Traveller", state: "Kerala", price: 4000 },
      { vehicle: "Tempo Traveller", state: "Andhra", price: 3500 },
      { vehicle: "Tempo Traveller", state: "Goa (Special Permit)", price: 4500 }
    ]
  },

  // Booking Rules & Notes
  notes: [
    "During peak season, rates may increase by ₹1 per km depending on vehicle demand.",
    "Nice Road Toll is charged separately when applicable.",
    "Toll & Parking charges are to be paid directly by the guest (for local/outstation daily bookings).",
    "Night Driver Allowance (10 PM - 6 AM): ₹400 for cars, ₹600 for Tempo Traveller extra depending on vehicle.",
    "Booking confirmation requires an advance of ₹500 per day."
  ]
};
