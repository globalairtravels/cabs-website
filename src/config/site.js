// Global Air Travels site configuration
export const siteConfig = {
  name: "Global Air Travels",
  tagline: "Simplest Cab Booking to & from Mysore & Bangalore",
  phone: "+919845181118", // Dynamic telephone number
  phoneDisplay: "+91 98451 81118",
  whatsapp: "+919845181118",
  whatsappDisplay: "+91 98451 81118",
  email: "booking@globalairtravels.com",
  upiId: "9845181118@ybl", // Merchant UPI ID for PhonePe (YBL - Yes Bank/PhonePe)
  merchantName: "Global Air Travels",
  
  // Popular quick-select routes to make booking incredibly easy for all users (e.g. 40+ demographic)
  popularRoutes: [
    {
      id: "mysore-blr-airport",
      label: "Mysore to Bangalore Airport",
      pickup: "Mysore City",
      drop: "Bangalore Airport (KIA)",
      distanceKm: 180,
      description: "One-way drop to Kempegowda International Airport",
    },
    {
      id: "blr-airport-mysore",
      label: "Bangalore Airport to Mysore",
      pickup: "Bangalore Airport (KIA)",
      drop: "Mysore City",
      distanceKm: 180,
      description: "One-way pickup from Kempegowda International Airport",
    },
    {
      id: "mysore-blr-city",
      label: "Mysore to Bangalore City",
      pickup: "Mysore City",
      drop: "Bangalore City",
      distanceKm: 150,
      description: "One-way trip to Bangalore City",
    },
    {
      id: "blr-city-mysore",
      label: "Bangalore City to Mysore",
      pickup: "Bangalore City",
      drop: "Mysore City",
      distanceKm: 150,
      description: "One-way trip to Mysore City",
    }
  ],

  // Cab types matching the SVGs in public/icons/
  cabTypes: [
    {
      id: "sedan",
      name: "Sedan",
      icon: "sedan.svg",
      example: "Dzire, Etios, Aura",
      seats: 4,
      luggage: "2 Bags",
      ac: true,
      baseRatePerKm: 14,
      mysoreBlrAirportPrice: 2799,
      mysoreBlrCityPrice: 2499,
      description: "Ideal for solo travelers or small families.",
      features: ["Professional Driver", "Neat & Clean Cars", "Toll & State Permits Included"]
    },
    {
      id: "suv",
      name: "SUV / Ertiga",
      icon: "suv.svg",
      example: "Ertiga, Triber, Carens",
      seats: 6,
      luggage: "3 Bags",
      ac: true,
      baseRatePerKm: 18,
      mysoreBlrAirportPrice: 3799,
      mysoreBlrCityPrice: 3499,
      description: "Budget-friendly option for medium families.",
      features: ["Professional Driver", "Ample Legroom", "Toll & State Permits Included"]
    },
    {
      id: "innova",
      name: "Innova",
      icon: "innova.svg",
      example: "Innova",
      seats: 7,
      luggage: "4 Bags",
      ac: true,
      baseRatePerKm: 22,
      mysoreBlrAirportPrice: 4799,
      mysoreBlrCityPrice: 4499,
      description: "Comfortable long drives with family.",
      features: ["Highly Professional Driver", "Premium Comfort", "Toll & State Permits Included"]
    },
    {
      id: "crysta",
      name: "Innova Crysta",
      icon: "crysta.svg",
      example: "Innova Crysta Premium",
      seats: 7,
      luggage: "4 Bags",
      ac: true,
      baseRatePerKm: 26,
      mysoreBlrAirportPrice: 5799,
      mysoreBlrCityPrice: 5299,
      description: "Ultimate luxury and safety for executive travel.",
      features: ["Premium Audio System", "Executive Captain Seats", "Toll & State Permits Included"]
    },
    {
      id: "tempo",
      name: "Tempo Traveller",
      icon: "tempo.svg",
      example: "Tempo Traveller 12/14 Seater",
      seats: 12,
      luggage: "8 Bags",
      ac: true,
      baseRatePerKm: 32,
      mysoreBlrAirportPrice: 7999,
      mysoreBlrCityPrice: 6999,
      description: "Best for large groups and pilgrimage trips.",
      features: ["Carrier for Luggage", "Pushback Seats", "Toll & State Permits Included"]
    }
  ],

  // Extra options configurations
  paymentOptions: [
    {
      id: "arrival",
      name: "Pay to Driver (Cash/UPI)",
      description: "Pay the full amount directly to the driver at the end of the trip.",
      extraCharge: 0
    },
    {
      id: "advance",
      name: "Pay Advance ₹500 (Secure Booking)",
      description: "Pay ₹500 now via PhonePe UPI to confirm booking, pay balance to driver.",
      extraCharge: 0
    },
    {
      id: "full",
      name: "Pay Full Amount (Zero Fee UPI)",
      description: "Pay 100% online now using PhonePe/UPI for instant confirmation.",
      extraCharge: 0
    }
  ]
};
