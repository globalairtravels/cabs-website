import "./globals.css";

export const metadata = {
  title: "Global Air Travels | Easy Cab Booking Mysore & Bangalore",
  description: "Super simple and mobile-friendly cab booking service between Mysore and Bangalore Airport. Sedan, SUV, Innova, and Tempo Travellers at lowest prices with zero-charge UPI payments.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export const viewport = {
  themeColor: "#0B3D91",
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
