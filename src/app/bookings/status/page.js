"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const getAssetPath = (path) => `${BASE_PATH}${path}`;

export default function BookingStatusPage() {
  const [bookingId, setBookingId] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setBookingId(params.get("id") || "");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-light, #f7f8fa)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: "2.5rem 2rem", maxWidth: 480, width: "100%", textAlign: "center" }}>
        <img src={getAssetPath("/icons/verified.svg")} alt="" style={{ width: 56, height: 56, marginBottom: "1rem" }} />
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--primary-navy, #0B3D91)", marginBottom: "0.5rem" }}>
          Payment Received
        </h1>
        <p style={{ fontSize: "0.95rem", color: "#555", marginBottom: "1.5rem" }}>
          Thank you for your payment. Your booking is being confirmed and our team will be in touch shortly.
        </p>

        {bookingId && (
          <div style={{ background: "#f0f5ff", border: "1px solid #c7dcf8", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>Booking Reference</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--primary-navy, #0B3D91)", letterSpacing: "0.05em" }}>{bookingId}</div>
          </div>
        )}

        <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1.5rem" }}>
          For support, call{" "}
          <a href={`tel:${siteConfig.phone}`} style={{ color: "var(--primary-orange, #F26B1F)", fontWeight: 600 }}>
            {siteConfig.phoneDisplay}
          </a>
        </p>

        <a
          href={`${BASE_PATH}/`}
          style={{ display: "inline-block", background: "var(--primary-orange, #F26B1F)", color: "#fff", fontWeight: 700, borderRadius: "0.5rem", padding: "0.75rem 2rem", textDecoration: "none", fontSize: "0.95rem" }}
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
