// Global Air Travels site configuration based on official leaflet
export const siteConfig = {
  name: "Global Air Travels",
  tagline: "Simplest Cab Booking in Mysore & Bangalore",
  phone: "+919844082581", // Contact number from leaflet
  phoneDisplay: "+91 98440 82581",
  whatsapp: "+919844082581",
  whatsappDisplay: "+91 98440 82581",
  email: "info@globalairtravels.com",
  upiId: "9844082581@ybl", // Payee UPI ID based on the phone number
  merchantName: "Madhusudan H G", // Name from payment details in leaflet
  footer: {
    description: "Founded in 1998, Global Air Travels is a Mysore travel agency known for reliable tours, ticketing, visa, forex, insurance, passport assistance and cab services.",
    bankDetails: {
      title: "Our Bank Details / For Net Transfers",
      bank: "HDFC Bank",
      accountNumber: "00652000010126",
      accountName: "Global Air Travels",
      branch: "Saraswatipuram, Mysore",
      ifsc: "HDFC0000065"
    },
    offices: [
      {
        title: "Main Office / Kuvempunagar",
        name: "GLOBAL AIR TRAVELS",
        address: "Panchamantra road, Kumar Medicals Opp Road, No 1660, Anikethana road 7th Cross, P&T block, Kuvempunagar, Mysuru 570023 Karnataka, India",
        phone: "+919844082581",
        phoneDisplay: "+91 98440 82581",
        email: "info@globalairtravels.com"
      },
      {
        title: "Branch 2 / Vishweshwaranagar",
        name: "GLOBAL AIR TRAVELS",
        address: "Flat D 07, 3rd Floor, Shridhaara Apartment, St Thomas School Road, Opp Yashoda Natarajan Kalyanamanatapa, Industrial Suburb, Vishweshwaranagar, Mysore, Karnataka 570008",
        phone: "+919844082581",
        phoneDisplay: "+91 98440 82581"
      }
    ]
  },
  
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
      intercityPrice: 3100,
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
      intercityPrice: 3900,
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
      intercityPrice: 4100,
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
      intercityPrice: 4600,
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
      intercityPrice: 7200,
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
      intercityPrice: 6600,
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
        title: "Book Airport Transfer Cabs",
        subtitle: "One-way transfers from fixed places to the airport. Toll and driver allowance included."
      },
      banner: {
        badge: "Special Rate",
        text: "Airport drops & pickups at fixed package prices",
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
        title: "Book Local & Outstation Daily Cabs",
        subtitle: "Flat per-day cabs for travel within or outside city. Driver allowance and fuel included."
      },
      banner: {
        badge: "Daily Run",
        text: "Local & Outstation packages at fixed daily rates",
        footer: "Book in number of days. Go anywhere within or outside city.",
        image: "/images/local-taxi.webp",
      },
      quickSelect: {
        title: "Popular Daily Packages",
        items: [
          { id: "local-mysore", name: "Mysore Local / Outstation", subtitle: "₹3,400/day Sedan • 250 km/day & driver incl." },
          { id: "local-bangalore", name: "Bangalore Local / Outstation", subtitle: "₹3,400/day Sedan • 250 km/day & driver incl." }
        ]
      },
      info: {
        title: "Local & Outstation Daily Trip Inclusions",
        items: [
          "Flexible daily travel: go within or outside the city limits",
          "Booked in number of days with unlimited stops & flexible daily routing",
          "Each day includes a fixed minimum kilometer limit (250 km for cars)",
          "Driver allowance & fuel charges included in the per-day fare",
          "Ideal for multi-day sightseeing, shopping, or outstation tours",
          "Parking, toll fees, and state border permits extra (paid directly as actuals)"
        ]
      }
    },
    daily: {
      heading: {
        title: "Book Intercity One-Way Cabs",
        subtitle: "One-way intercity drops between fixed locations. Toll and driver allowance included."
      },
      banner: {
        badge: "Special Rate",
        text: "One-way intercity drops at fixed package prices",
        footer: "Includes toll tax & driver allowance!",
        image: "/images/local-taxi.webp",
        gradient: "linear-gradient(135deg, #F26B1F 0%, #FF9248 100%)"
      },
      quickSelect: {
        title: "Popular Intercity Routes",
        items: [
          { id: "mysore-blr-city", name: "Mysore ➔ Bangalore City", subtitle: "₹3,100 Sedan • Toll Incl." },
          { id: "blr-city-mysore", name: "Bangalore City ➔ Mysore", subtitle: "₹3,100 Sedan • Toll Incl." }
        ]
      },
      info: {
        title: "Intercity Drop Inclusions",
        items: [
          "Toll taxes and driver allowance included",
          "One-way direct transfer to destination",
          "No extra helper/state permits charge for standard route",
          "Dedicated clean AC cab just for your group"
        ]
      }
    },
    tempo: {
      heading: {
        title: "Book Tempo Travellers for Groups",
        subtitle: "Spacious 12+1 seaters for group trips, tours, weddings and corporate outings."
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
