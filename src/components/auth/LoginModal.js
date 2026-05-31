"use client";

// Two-step phone OTP login modal.
//   Step 1: 10-digit Indian mobile (prefixed +91) -> invisible reCAPTCHA -> SMS.
//   Step 2: 6-digit OTP -> sign in.
// Styling reuses the site's modal / form CSS variables (orange + navy).

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthProvider";

const RESEND_SECONDS = 30;
const RECAPTCHA_ID = "recaptcha-container";

// Map raw Firebase auth errors to short, human messages.
function friendlyError(err) {
  const code = err?.code || "";
  if (code.includes("invalid-phone-number")) return "That phone number looks invalid.";
  if (code.includes("invalid-verification-code")) return "Incorrect OTP. Please check and try again.";
  if (code.includes("code-expired")) return "This OTP has expired. Please resend.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please try again later.";
  if (code.includes("quota-exceeded")) return "SMS limit reached. Please try again later.";
  if (code.includes("missing-phone-number")) return "Please enter your mobile number.";
  return err?.message || "Something went wrong. Please try again.";
}

export default function LoginModal({ onClose, onSuccess }) {
  const { sendOtp, confirmOtp, isConfigured } = useAuth();

  const [stage, setStage] = useState("phone"); // "phone" | "otp"
  const [phoneDigits, setPhoneDigits] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const otpInputRef = useRef(null);

  // Resend countdown.
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const id = setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  // Focus the OTP field when we reach step 2.
  useEffect(() => {
    if (stage === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [stage]);

  const phoneValid = /^[6-9]\d{9}$/.test(phoneDigits);
  const otpValid = /^\d{6}$/.test(otp);

  const requestOtp = async () => {
    if (!phoneValid) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await sendOtp(`+91${phoneDigits}`, RECAPTCHA_ID);
      setStage("otp");
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    requestOtp();
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpValid) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await confirmOtp(otp);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || loading) return;
    setOtp("");
    await requestOtp();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box auth-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close login">✕</button>

        <h2 className="modal-title">
          <span>{stage === "phone" ? "Login or Sign up" : "Verify your number"}</span>
        </h2>

        <div className="modal-body">
          {!isConfigured ? (
            <p style={{ fontSize: "0.85rem", color: "var(--text-gray)" }}>
              Login is temporarily unavailable. Please book as a guest or contact support.
            </p>
          ) : stage === "phone" ? (
            <form onSubmit={handlePhoneSubmit}>
              <p className="auth-subtext">
                We&apos;ll send a one-time password (OTP) to verify your mobile number.
              </p>
              <label htmlFor="auth-phone" className="form-label" style={{ fontWeight: 600 }}>
                Mobile number
              </label>
              <div className="auth-phone-row">
                <span className="auth-cc">+91</span>
                <input
                  id="auth-phone"
                  type="tel"
                  className="modal-input auth-phone-input"
                  placeholder="10-digit mobile number"
                  value={phoneDigits}
                  onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  autoFocus
                  required
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
                disabled={loading || !phoneValid}
              >
                {loading ? "Sending OTP…" : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <p className="auth-subtext">
                Enter the 6-digit code sent to <strong>+91 {phoneDigits}</strong>.{" "}
                <button type="button" className="auth-link-btn" onClick={() => { setStage("phone"); setOtp(""); setError(""); }}>
                  Change
                </button>
              </p>
              <label htmlFor="auth-otp" className="form-label" style={{ fontWeight: 600 }}>
                One-time password
              </label>
              <input
                id="auth-otp"
                ref={otpInputRef}
                type="text"
                className="modal-input auth-otp-input"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />

              {error && <p className="auth-error">{error}</p>}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
                disabled={loading || !otpValid}
              >
                {loading ? "Verifying…" : "Verify & Continue"}
              </button>

              <div className="auth-resend-row">
                {resendIn > 0 ? (
                  <span>Resend OTP in {resendIn}s</span>
                ) : (
                  <button type="button" className="auth-link-btn" onClick={handleResend} disabled={loading}>
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* Invisible reCAPTCHA mounts here */}
          <div id={RECAPTCHA_ID} />

          <p className="auth-legal">
            By continuing you agree to receive an SMS for verification. Standard rates may apply.
          </p>
        </div>
      </div>
    </div>
  );
}
