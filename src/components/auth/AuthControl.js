"use client";

// Header auth control. Renders:
//   - signed out: a "Log in" button that opens the OTP LoginModal.
//   - signed in: an account chip with a dropdown (Account, My Bookings, Sign out).
//
// `variant="mobile"` renders flat, full-width controls for the mobile drawer
// instead of a dropdown. `onNavigate` lets the drawer close on click.

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import LoginModal from "./LoginModal";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const href = (path) => `${BASE_PATH}${path}`;

// Short display name: profile name -> first word, else last 4 digits of phone.
function displayName(profile, user) {
  const name = (profile?.name || "").trim();
  if (name) return name.split(" ")[0];
  const phone = profile?.phone || user?.phoneNumber || "";
  const digits = phone.replace(/\D/g, "");
  return digits ? `…${digits.slice(-4)}` : "Account";
}

function initial(profile, user) {
  const name = (profile?.name || "").trim();
  if (name) return name[0].toUpperCase();
  const phone = profile?.phone || user?.phoneNumber || "";
  const digits = phone.replace(/\D/g, "");
  return digits ? digits.slice(-1) : "U";
}

export default function AuthControl({ variant = "desktop", onNavigate }) {
  const { user, profile, loading, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const go = (path) => {
    onNavigate?.();
    window.location.assign(href(path));
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    onNavigate?.();
    await signOut();
    try {
      localStorage.clear();
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
    }
    window.location.assign(href("/"));
  };

  const openLogin = () => {
    onNavigate?.();
    setShowLogin(true);
  };

  // ---- Mobile drawer layout ----
  if (variant === "mobile") {
    return (
      <>
        {!user ? (
          <button
            type="button"
            className="btn-login"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={openLogin}
            disabled={loading}
          >
            Log in / Sign up
          </button>
        ) : (
          <div className="drawer-account">
            <div className="drawer-account-head">
              <span className="account-avatar">{initial(profile, user)}</span>
              <div className="drawer-account-meta">
                <span className="drawer-account-name">{profile?.name || "Your account"}</span>
                <span className="drawer-account-phone">{profile?.phone || user.phoneNumber}</span>
              </div>
            </div>
            <button type="button" className="drawer-nav-link" onClick={() => go("/account/")}>
              <span>Account</span>
            </button>
            <button type="button" className="drawer-nav-link" onClick={() => go("/bookings/")}>
              <span>Bookings</span>
            </button>
            <button type="button" className="drawer-nav-link drawer-signout" onClick={handleSignOut}>
              <span>Sign out</span>
            </button>
          </div>
        )}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </>
    );
  }

  // ---- Desktop header layout ----
  return (
    <>
      {!user ? (
        <button type="button" className="btn-login" onClick={openLogin} disabled={loading}>
          Log in
        </button>
      ) : (
        <div className="account-menu" ref={menuRef}>
          <button
            type="button"
            className="account-chip"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="account-avatar">{initial(profile, user)}</span>
            <span className="account-chip-name">{displayName(profile, user)}</span>
            <span className={`account-caret ${menuOpen ? "up" : ""}`}>▾</span>
          </button>

          {menuOpen && (
            <div className="account-dropdown" role="menu">
              <div className="account-dropdown-head">
                <span className="account-dropdown-name">{profile?.name || "Your account"}</span>
                <span className="account-dropdown-phone">{profile?.phone || user.phoneNumber}</span>
              </div>
              <button type="button" className="account-dropdown-item" role="menuitem" onClick={() => go("/account/")}>
                Account
              </button>
              <button type="button" className="account-dropdown-item" role="menuitem" onClick={() => go("/bookings/")}>
                Bookings
              </button>
              <div className="account-dropdown-divider" />
              <button type="button" className="account-dropdown-item signout" role="menuitem" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
