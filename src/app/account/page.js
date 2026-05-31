"use client";

// Profile page (/account). Protected: prompts login when signed out.
// Lets the user view/edit name, email and address. Phone is read-only — it is
// the auth identity and immutable per security rules.

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import AccountHeader from "@/components/auth/AccountHeader";
import LoginModal from "@/components/auth/LoginModal";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const EMPTY_FORM = {
  name: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function AccountPage() {
  const { user, profile, loading, updateProfile } = useAuth();

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(0);
  const hydratedFor = useRef(null);

  // Hydrate the form once the profile arrives (re-runs only if the uid changes).
  // setTimeout(0) keeps the state update out of the synchronous effect body.
  useEffect(() => {
    if (!profile || hydratedFor.current === profile.uid) return undefined;
    const timer = setTimeout(() => {
      hydratedFor.current = profile.uid;
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        line1: profile.address?.line1 || "",
        line2: profile.address?.line2 || "",
        city: profile.address?.city || "",
        state: profile.address?.state || "",
        pincode: profile.address?.pincode || "",
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [profile]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = form.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    const pincode = form.pincode.trim();
    if (pincode && !/^\d{6}$/.test(pincode)) {
      setError("Pincode must be 6 digits.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        email,
        address: {
          line1: form.line1.trim(),
          line2: form.line2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode,
        },
      });
      setSavedAt(Date.now());
      window.setTimeout(() => setSavedAt(0), 2500);
    } catch (err) {
      setError(err?.message || "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen account-page-bg">
      <AccountHeader />

      <div className="main-wrapper">
        <div className="account-shell">
          {loading ? (
            <AccountLoading />
          ) : !user ? (
            <SignedOutGate />
          ) : (
            <>
              <div className="account-page-head">
                <h1 className="account-page-title">My Account</h1>
                <p className="account-page-sub">Manage your contact details for faster bookings.</p>
              </div>

              <div className="booking-card">
                <form onSubmit={handleSubmit} className="account-form">
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <div className="account-readonly">
                      {profile?.phone || user.phoneNumber}
                      <span className="account-verified-badge">✓ Verified</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="acc-name" className="form-label">Full Name</label>
                    <input id="acc-name" type="text" className="form-input" placeholder="Your full name"
                      value={form.name} onChange={setField("name")} autoComplete="name" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="acc-email" className="form-label">
                      Email Address
                    </label>
                    <input id="acc-email" type="email" className="form-input" placeholder="you@example.com"
                      value={form.email} onChange={setField("email")} autoComplete="email" />
                  </div>

                  <div className="account-section-label">Address</div>

                  <div className="form-group">
                    <label htmlFor="acc-line1" className="form-label">Address Line 1</label>
                    <input id="acc-line1" type="text" className="form-input" placeholder="House / flat, street"
                      value={form.line1} onChange={setField("line1")} autoComplete="address-line1" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="acc-line2" className="form-label">
                      Address Line 2 <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input id="acc-line2" type="text" className="form-input" placeholder="Area, landmark"
                      value={form.line2} onChange={setField("line2")} autoComplete="address-line2" />
                  </div>

                  <div className="account-grid-3">
                    <div className="form-group">
                      <label htmlFor="acc-city" className="form-label">City</label>
                      <input id="acc-city" type="text" className="form-input" placeholder="City"
                        value={form.city} onChange={setField("city")} autoComplete="address-level2" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="acc-state" className="form-label">State</label>
                      <input id="acc-state" type="text" className="form-input" placeholder="State"
                        value={form.state} onChange={setField("state")} autoComplete="address-level1" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="acc-pin" className="form-label">Pincode</label>
                      <input id="acc-pin" type="text" className="form-input" placeholder="560001" inputMode="numeric"
                        value={form.pincode}
                        onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                        autoComplete="postal-code" />
                    </div>
                  </div>

                  {error && <p className="auth-error">{error}</p>}

                  <div className="account-form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? "Saving…" : savedAt ? "✓ Saved" : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountLoading() {
  return (
    <div className="account-center">
      <div className="account-spinner" />
      <p style={{ color: "var(--text-gray)", fontSize: "0.85rem", marginTop: "0.75rem" }}>Loading your profile…</p>
    </div>
  );
}

function SignedOutGate() {
  const [showLogin, setShowLogin] = useState(false);
  return (
    <div className="account-center">
      <div className="booking-card" style={{ textAlign: "center", maxWidth: 420 }}>
        <h1 className="account-page-title" style={{ marginBottom: "0.5rem" }}>Sign in to continue</h1>
        <p style={{ color: "var(--text-gray)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
          Log in with your mobile number to view and update your profile.
        </p>
        <button type="button" className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setShowLogin(true)}>
          Log in / Sign up
        </button>
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
