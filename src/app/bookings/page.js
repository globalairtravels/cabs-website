"use client";

import { useEffect, useRef, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthProvider";
import { getDb } from "@/lib/firebase";
import { siteConfig } from "@/config/site";
import AccountHeader from "@/components/auth/AccountHeader";
import LoginModal from "@/components/auth/LoginModal";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const WHATSAPP_NUMBER = siteConfig.whatsapp.replace(/\D/g, "");

const STATUS_META = {
  requested: { label: "Requested", cls: "ok" },
  confirmed: { label: "Confirmed", cls: "ok" },
  paid: { label: "Paid", cls: "ok" },
  success: { label: "Confirmed", cls: "ok" },
  pending: { label: "Pending", cls: "warn" },
  failed: { label: "Failed", cls: "bad" },
};

function formatDate(createdAt) {
  if (!createdAt) return "";
  const d = typeof createdAt.toDate === "function" ? createdAt.toDate() : new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function routeOf(details) {
  if (!details) return "—";
  const { tripType, pickup, drop } = details;
  if (tripType === "city" || tripType === "tempo") return pickup || "—";
  return drop ? `${pickup} → ${drop}` : pickup || "—";
}

export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const fetchedFor = useRef(null);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!user) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    if (fetchedFor.current === user.uid) return undefined;

    let cancelled = false;
    const run = async () => {
      const db = getDb();
      if (!db) {
        if (!cancelled) { setError("Bookings are unavailable right now."); setLoading(false); }
        return;
      }
      try {
        fetchedFor.current = user.uid;
        const q = query(
          collection(db, "bookings"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        if (!cancelled) setError(err?.message || "Could not load your bookings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const busy = authLoading || loading;

  return (
    <div className="flex flex-col min-h-screen account-page-bg">
      <AccountHeader />

      <div className="main-wrapper">
        <div className="account-shell">
          {busy ? (
            <div className="account-center">
              <div className="account-spinner" />
              <p style={{ color: "var(--text-gray)", fontSize: "0.85rem", marginTop: "0.75rem" }}>Loading your bookings…</p>
            </div>
          ) : !user ? (
            <SignedOutGate />
          ) : (
            <>
              <div className="account-page-head">
                <h1 className="account-page-title">My Bookings</h1>
                <p className="account-page-sub">Trips linked to {user.phoneNumber}.</p>
              </div>

              {error && <p className="auth-error">{error}</p>}

              {bookings.length === 0 && !error ? (
                <div className="booking-card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧳</div>
                  <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--primary-navy)", margin: "0 0 0.4rem" }}>
                    No bookings yet
                  </h2>
                  <p style={{ color: "var(--text-gray)", fontSize: "0.88rem", marginBottom: "1.25rem" }}>
                    Bookings requested or paid from this number will appear here.
                  </p>
                  <a href={`${BASE_PATH}/`} className="btn-primary" style={{ display: "inline-flex" }}>Book a Cab</a>
                </div>
              ) : (
                <div className="bookings-list">
                  {bookings.map((b) => {
                    const details = b.bookingDetails || {};
                    const status = STATUS_META[b.paymentStatus] || { label: b.paymentStatus || "—", cls: "warn" };
                    const amount = typeof b.amount === "number" ? Math.round(b.amount / 100) : null;
                    return (
                      <a
                        key={b.id}
                        href={`${BASE_PATH}/bookings/status/?id=${encodeURIComponent(b.bookingId || b.id)}`}
                        className="booking-row-card"
                      >
                        <div className="booking-row-main">
                          <div className="booking-row-top">
                            <span className="booking-row-route">{routeOf(details)}</span>
                            <span className={`booking-status-pill ${status.cls}`}>{status.label}</span>
                          </div>
                          <div className="booking-row-meta">
                            <span>{details.cab || "Cab"}</span>
                            {details.date && <span>• {details.date}{details.time ? ` ${details.time}` : ""}</span>}
                            <span>• {b.bookingId || b.id}</span>
                          </div>
                          <div className="booking-row-sub">Booked on {formatDate(b.createdAt)}</div>
                        </div>
                        <div className="booking-row-side">
                          {amount != null && <span className="booking-row-amount">₹{amount}</span>}
                          <span className="booking-row-chevron">›</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              <p className="bookings-guest-note">
                Booked over WhatsApp or as a guest? Track it with your Booking ID on the{" "}
                <a href={`${BASE_PATH}/`}>home page</a> or message us on{" "}
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">WhatsApp</a>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SignedOutGate() {
  const [showLogin, setShowLogin] = useState(false);
  return (
    <div className="account-center">
      <div className="booking-card" style={{ textAlign: "center", maxWidth: 420 }}>
        <h1 className="account-page-title" style={{ marginBottom: "0.5rem" }}>Sign in to see your bookings</h1>
        <p style={{ color: "var(--text-gray)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          Log in with your mobile number to view trips linked to your account.
        </p>
        <button type="button" className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setShowLogin(true)}>
          Log in / Sign up
        </button>
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
