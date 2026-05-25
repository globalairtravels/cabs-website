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
      label: "Airport Transfer (Mysore ⇄ Bangalore Airport)",
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

  // Sidebar content varies by booking type. Banner image paths point to public/images/.
  // Drop in city.webp / outstation.webp / tempo.webp later; missing files fall back to a gradient.
  sidebarByTripType: {
    airport: {
      heading: {
        title: "Book Mysore ⇄ Bangalore Airport Cabs",
        subtitle: "Fixed price drops & pickups with toll and driver included"
      },
      banner: {
        badge: "Special Rate",
        text: "Mysore ⇄ KIA Airport Drop starting at just ₹3,600/-",
        footer: "Includes driver allowance & toll tax!",
        image: "/images/airport.webp"
      },
      quickSelect: {
        title: "Popular Airport Routes",
        items: [
          { id: "mysore-blr-airport", name: "Mysore ➔ Bangalore Airport", subtitle: "₹3,600 Sedan • Toll Incl." },
          { id: "blr-airport-mysore", name: "Bangalore Airport ➔ Mysore", subtitle: "₹3,600 Sedan • Toll Incl." },
          { id: "mysore-mangalore-airport", name: "Mysore ➔ Mangalore Airport", subtitle: "₹5,500 Sedan • On Request" }
        ]
      },
      info: {
        title: "Airport Service Inclusions",
        items: [
          "45 minutes free airport waiting",
          "Flight tracking & schedule re-routing",
          "Toll, parking & driver allowance included",
          "Meet & greet at arrival gate"
        ]
      }
    },
    city: {
      heading: {
        title: "Book Mysore ⇄ Bangalore City Taxis",
        subtitle: "Comfortable point-to-point intercity rides with assured fares"
      },
      banner: {
        badge: "Best Price",
        text: "Mysore ⇄ Bangalore City One-Way from ₹3,100/-",
        footer: "Toll & driver allowance included.",
        image: "/images/city.webp",
        gradient: "linear-gradient(135deg, #0B3D91 0%, #1E5BBD 100%)"
      },
      quickSelect: {
        title: "Popular City Routes",
        items: [
          { id: "mysore-blr-city", name: "Mysore ➔ Bangalore City", subtitle: "₹3,100 Sedan • Toll Incl." },
          { id: "blr-city-mysore", name: "Bangalore City ➔ Mysore", subtitle: "₹3,100 Sedan • Toll Incl." },
          { id: "mysore-mangalore-city", name: "Mysore ➔ Mangalore City", subtitle: "₹5,200 Sedan • On Request" }
        ]
      },
      info: {
        title: "City Trip Inclusions",
        items: [
          "Up to 150 km point-to-point limit",
          "₹400 toll charges included",
          "One pickup and one drop point",
          "30 minutes waiting buffer free"
        ]
      }
    },
    daily: {
      heading: {
        title: "Plan Outstation & Multi-Day Tours",
        subtitle: "Coorg, Ooty, Kabini, Wayanad and beyond — per-day packages with driver"
      },
      banner: {
        badge: "Multi-Day Tour",
        text: "Outstation tours from ₹3,400/day in Sedan",
        footer: "Driver allowance waived on tours over 3 days.",
        image: "/images/outstation.webp",
        gradient: "linear-gradient(135deg, #F26B1F 0%, #FF9248 100%)"
      },
      quickSelect: {
        title: "Popular Tour Packages",
        items: [
          { id: "tour-coorg", name: "Coorg (Madikeri)", subtitle: "2 Day Tour • From ₹6,800", destination: "Coorg (Madikeri)", days: 2 },
          { id: "tour-ooty", name: "Ooty Hill Station", subtitle: "3 Day Tour • From ₹10,200", destination: "Ooty", days: 3 },
          { id: "tour-kabini", name: "Kabini Wildlife", subtitle: "2 Day Tour • From ₹6,800", destination: "Kabini", days: 2 },
          { id: "tour-wayanad", name: "Wayanad Resorts", subtitle: "3 Day Tour • From ₹10,200", destination: "Wayanad", days: 3 }
        ]
      },
      info: {
        title: "Border Permits (7 Days)",
        items: [
          "Sedan (All borders): ₹600",
          "Ertiga SUV (All borders): ₹1,000",
          "Innova (Tamil Nadu): ₹1,250",
          "Innova (Kerala): ₹3,000",
          "Innova (Andhra): ₹2,500"
        ]
      }
    },
    tempo: {
      heading: {
        title: "Hire a Tempo Traveller for Groups",
        subtitle: "12+1 seater for weddings, pilgrim tours and corporate outings"
      },
      banner: {
        badge: "Group Travel",
        text: "12+1 Tempo Traveller from ₹7,200 for group tours",
        footer: "Best for weddings, pilgrim groups & corporate outings.",
        image: "/images/tempo.webp",
        gradient: "linear-gradient(135deg, #0B3D91 0%, #F26B1F 100%)"
      },
      quickSelect: {
        title: "Group Tour Ideas",
        items: [
          { id: "tempo-wedding", name: "Wedding Group Transport", subtitle: "Local / Multi-day • Custom Quote", destination: "Wedding Group Travel", days: 2 },
          { id: "tempo-pilgrim", name: "Pilgrim Tour", subtitle: "Dharmasthala / Kukke • 2 Day", destination: "Dharmasthala-Kukke Pilgrim", days: 2 },
          { id: "tempo-coorg", name: "Coorg Group Getaway", subtitle: "2 Day Tour • From ₹14,400", destination: "Coorg (Madikeri)", days: 2 },
          { id: "tempo-corporate", name: "Corporate Outing", subtitle: "1 Day Local • From ₹7,200", destination: "Corporate Outing", days: 1 }
        ]
      },
      info: {
        title: "Tempo Border Permits (7 Days)",
        items: [
          "Tempo (Tamil Nadu): ₹2,000",
          "Tempo (Kerala): ₹4,000",
          "Tempo (Andhra): ₹3,500",
          "Tempo (Goa Special): ₹4,500"
        ]
      }
    }
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
