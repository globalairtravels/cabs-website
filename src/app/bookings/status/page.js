"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { siteConfig } from "@/config/site";
import { getBookingStatusApiUrl } from "@/lib/checkout-config";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const getAssetPath = (path) => `${BASE_PATH}${path}`;
const WHATSAPP_NUMBER = siteConfig.whatsapp.replace(/\D/g, "");

const VIEW = {
  loading: { tone: "neutral", icon: "/icons/booking-flow/confirmed.svg", title: "Checking your booking…", desc: "Hold on while we look up this booking reference." },
  requested: { tone: "success", icon: "/icons/booking-flow/confirmed.svg", title: "Booking Request Received", desc: "Thank you! Our team will confirm this trip on WhatsApp or a call shortly. Please keep your booking reference handy." },
  pending: { tone: "neutral", icon: "/icons/booking-flow/confirmed.svg", title: "Confirming your payment…", desc: "We've received your request and are confirming the payment. This page updates automatically — no need to refresh." },
  confirmed: { tone: "success", icon: "/icons/verified.svg", title: "Payment Successful", desc: "Thank you! Your payment is confirmed and your booking is secured. Our team will share driver details before pickup." },
  failed: { tone: "error", icon: "/icons/booking-flow/confirmed.svg", title: "Payment Not Completed", desc: "Your payment was cancelled or could not be completed. No money has been deducted for a cancelled payment. You can try again or reach us to book." },
  notfound: { tone: "neutral", icon: "/icons/booking-flow/confirmed.svg", title: "Booking Not Found", desc: "We couldn't find this booking reference. If you just submitted a request, please contact us with the reference and we'll confirm it." },
  error: { tone: "error", icon: "/icons/booking-flow/confirmed.svg", title: "Couldn't Load Status", desc: "Something went wrong while loading your booking status. Please contact us with your reference and we'll confirm it for you." },
};

const TONE_COLOR = {
  success: "var(--success-green, #22A06B)",
  error: "var(--error-red, #D7263D)",
  neutral: "var(--primary-navy, #0B3D91)",
};

function viewKeyFromPayload(data) {
  const ps = data?.paymentStatus;
  if (ps === "requested") return "requested";
  if (ps === "confirmed") return "confirmed";
  if (ps === "failed") return "failed";
  if (ps === "pending") return "pending";
  if (data?.mode === "request") return "requested";
  return "pending";
}

export default function BookingStatusPage() {
  const [bookingId, setBookingId] = useState("");
  const [status, setStatus] = useState("loading");
  const [amount, setAmount] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setBookingId(params.get("id") || "");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!bookingId) {
      const t = setTimeout(() => setStatus("notfound"), 0);
      return () => clearTimeout(t);
    }

    const url = getBookingStatusApiUrl(bookingId);
    if (!url) {
      const t = setTimeout(() => setStatus("error"), 0);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    let poll = 0;
    const load = async () => {
      try {
        const res = await fetch(url);
        if (cancelled) return;
        if (res.status === 404) {
          setStatus("notfound");
          return;
        }
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const data = await res.json();
        const next = viewKeyFromPayload(data);
        setStatus(next);
        setAmount(typeof data.amount === "number" ? Math.round(data.amount / 100) : null);
        if (next !== "pending" && poll) {
          window.clearInterval(poll);
          poll = 0;
        }
      } catch (err) {
        console.error("Failed to read booking status:", err);
        if (!cancelled) setStatus("error");
      }
    };

    load();
    poll = window.setInterval(load, 4000);
    return () => {
      cancelled = true;
      if (poll) window.clearInterval(poll);
    };
  }, [bookingId]);

  const view = VIEW[status] ?? VIEW.loading;
  const accent = TONE_COLOR[view.tone];
  const showSpinner = status === "loading" || status === "pending";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-light, #f7f8fa)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" }}>
      <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: "2.5rem 2rem", maxWidth: 480, width: "100%", textAlign: "center" }}>
        {showSpinner ? (
          <div style={{ display: "inline-block", width: 48, height: 48, border: "3px solid #e2e8f0", borderTopColor: "var(--primary-orange, #F26B1F)", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
        ) : (
          <Image src={getAssetPath(view.icon)} alt="" width={56} height={56} style={{ marginBottom: "1rem" }} />
        )}
        <style dangerouslySetInnerHTML={{ __html: "@keyframes spin { to { transform: rotate(360deg); } }" }} />

        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: accent, marginBottom: "0.5rem" }}>
          {view.title}
        </h1>
        <p style={{ fontSize: "0.95rem", color: "#555", marginBottom: "1.5rem" }}>
          {view.desc}
        </p>

        {bookingId && (
          <div style={{ background: "#f0f5ff", border: "1px solid #c7dcf8", borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>Booking Reference</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--primary-navy, #0B3D91)", letterSpacing: "0.05em" }}>{bookingId}</div>
            {status === "confirmed" && amount != null && (
              <div style={{ fontSize: "0.85rem", color: "var(--success-green, #22A06B)", fontWeight: 700, marginTop: "0.4rem" }}>Paid ₹{amount}</div>
            )}
            {status === "requested" && amount != null && amount > 0 && (
              <div style={{ fontSize: "0.85rem", color: "var(--primary-navy, #0B3D91)", fontWeight: 700, marginTop: "0.4rem" }}>Intended ₹{amount}</div>
            )}
          </div>
        )}

        <p style={{ fontSize: "0.8rem", color: "#888", marginBottom: "1.5rem" }}>
          For support, call{" "}
          <a href={`tel:${siteConfig.phone}`} style={{ color: "var(--primary-orange, #F26B1F)", fontWeight: 600 }}>
            {siteConfig.phoneDisplay}
          </a>{" "}
          or{" "}
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" style={{ color: "var(--success-green, #22A06B)", fontWeight: 600 }}>
            WhatsApp us
          </a>
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {status === "failed" && (
            <a
              href={`${BASE_PATH}/`}
              style={{ display: "inline-block", background: "var(--primary-orange, #F26B1F)", color: "#fff", fontWeight: 700, borderRadius: "0.5rem", padding: "0.75rem 2rem", textDecoration: "none", fontSize: "0.95rem" }}
            >
              Try Booking Again
            </a>
          )}
          {(status === "confirmed" || status === "pending" || status === "requested") && (
            <a
              href={`${BASE_PATH}/bookings/`}
              style={{ display: "inline-block", background: "var(--primary-orange, #F26B1F)", color: "#fff", fontWeight: 700, borderRadius: "0.5rem", padding: "0.75rem 2rem", textDecoration: "none", fontSize: "0.95rem" }}
            >
              View My Bookings
            </a>
          )}
          <a
            href={`${BASE_PATH}/`}
            style={{ display: "inline-block", background: "transparent", color: "var(--primary-navy, #0B3D91)", fontWeight: 700, borderRadius: "0.5rem", padding: "0.6rem 2rem", textDecoration: "none", fontSize: "0.9rem", border: "1px solid var(--border-color, #e2e8f0)" }}
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
