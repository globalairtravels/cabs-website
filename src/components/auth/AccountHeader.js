"use client";

// Shared header for the /account pages: logo + auth control, with a mobile
// drawer that mirrors the home/booking headers.

import { useState } from "react";
import { siteConfig } from "@/config/site";
import AuthControl from "./AuthControl";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const getAssetPath = (path) => `${BASE_PATH}${path}`;

export default function AccountHeader() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-container">
          <a href={`${BASE_PATH}/`} className="logo-link">
            <img src={getAssetPath("/logo/logo.svg")} alt="Global Air Travels Logo" className="logo-image" />
          </a>

          <div className="mobile-only header-mobile-actions">
            <a href={`tel:${siteConfig.phone}`} className="mobile-call-icon-btn" aria-label="Call Us">
              <img src={getAssetPath("/icons/call/phone-ring.svg")} alt="" className="nav-icon" width="20" height="20" />
            </a>
            <button type="button" className="mobile-menu-toggle" onClick={() => setShowMobileMenu(true)} aria-label="Open navigation menu">
              <img src={getAssetPath("/icons/nav/menu.svg")} alt="" className="nav-icon" width="24" height="24" />
            </button>
          </div>

          <nav className="desktop-only" aria-label="Main Navigation">
            <ul className="desktop-nav">
              <li>
                <a href={`${BASE_PATH}/`} className="nav-item-link">
                  <span>Book a Cab</span>
                </a>
              </li>
              <li>
                <AuthControl variant="desktop" />
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {showMobileMenu && (
        <div className="mobile-drawer-backdrop" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <img src={getAssetPath("/logo/logo.svg")} alt="Global Air Travels Logo" className="logo-image" />
              <button type="button" className="drawer-close-btn" onClick={() => setShowMobileMenu(false)}>✕</button>
            </div>
            <div className="mobile-drawer-body">
              <ul className="mobile-drawer-nav">
                <li>
                  <a href={`${BASE_PATH}/`} className="drawer-nav-link">
                    <span>Book a Cab</span>
                  </a>
                </li>
                <li className="divider"></li>
                <li>
                  <AuthControl variant="mobile" onNavigate={() => setShowMobileMenu(false)} />
                </li>
              </ul>
              <div className="mobile-drawer-footer">
                <a href={`tel:${siteConfig.phone}`} className="drawer-call-btn">
                  📞 Call Support: {siteConfig.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
