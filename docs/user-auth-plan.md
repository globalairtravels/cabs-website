# Firebase User Login & Accounts — Implementation Plan

> Scope: Add Firebase **Phone (OTP)** authentication, a **`/users/{uid}`** profile that users can view/update, and **per-user bookings** so a signed-in user sees their own booking history.

## 1. Context & Constraints

- **App is a static export** (`next build` → `out/`, deployed to Firebase Hosting). There is **no Next.js server at runtime** — all auth and any client-side Firestore access happen in the browser.
- **Backend = Cloud Functions** (`asia-south1`, Admin SDK). Bookings are currently written server-side by functions (bypassing security rules) and are **anonymous** — looked up by booking ID + phone.
- **Firebase Web SDK** (`firebase@^12`) is already a dependency. `NEXT_PUBLIC_FIREBASE_*` env vars exist in `.env.local.example`, but **no client `initializeApp` exists in `src/` yet**.
- **No `firestore.rules` file exists.** Enabling client-side reads/writes for profiles means we must add and deploy rules.
- Project: `globalairtravels-9651f`. Config (cabs/promos/pricing) comes from `firestore/config.booking.json` at build time; `siteConfig` is branding only.

### Key architectural decision
Phone OTP **must** run client-side (Firebase Auth Phone provider + reCAPTCHA). Two options for data access:

- **Profiles (`/users/{uid}`)** → client-side Firestore reads/writes, gated by security rules (`request.auth.uid == userId`). Simple, no new function needed.
- **Bookings** → already written by Cloud Functions. We will **attach `uid` to booking records** and read a user's bookings client-side via a rules-protected query (or a function). Recommended: client-side query with rules.

---

## 2. Prerequisites (Firebase Console — manual, one-time)

1. **Authentication → Sign-in method → Phone**: enable.
2. Add **test phone numbers** (e.g. `+91 99999 99999 → 123456`) for local dev so you don't burn real SMS.
3. **Authorized domains**: ensure `localhost`, `globalairtravels-9651f.web.app`, `globalairtravels-9651f.firebaseapp.com`, and the production custom domain are listed.
4. **App Check (recommended)**: register reCAPTCHA v3 / Enterprise to protect Phone Auth from abuse (can be phase 2).
5. Confirm SMS region/quota for India (`+91`).

---

## 3. Data Model (Firestore)

### `users/{uid}`
```jsonc
{
  "uid": "firebaseAuthUid",
  "phone": "+919844082581",     // from auth token, source of truth
  "name": "",
  "email": "",
  "address": {
    "line1": "", "line2": "", "city": "", "state": "", "pincode": ""
  },
  "createdAt": <serverTimestamp>,
  "updatedAt": <serverTimestamp>
}
```

### `bookings/{bookingId}` (existing — add fields)
Current record (written in `functions/src/phonepe/createOrder.js`, doc ID = `bookingId`):
`bookingId, paymentStatus, paymentGateway, merchantTransactionId, amount, customerPhone, bookingDetails, createdAt`.
- Add `uid` (nullable — anonymous bookings still allowed).
- `customerPhone` already exists; normalize to E.164 to allow **back-linking** historical bookings to a user by phone.

**Linking strategy for existing bookings:** when a user logs in, optionally claim past bookings where `bookings.customerPhone == user.phone && uid == null` by stamping `uid` (done via a Cloud Function callable to keep rules strict).

---

## 4. Security Rules (`firestore.rules` — NEW)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }

    // User profile: only the owner can read/write their doc.
    match /users/{userId} {
      allow read, update: if isOwner(userId);
      allow create: if isOwner(userId)
                    && request.resource.data.uid == userId;
      allow delete: if false; // deletion via function/support only
    }

    // Bookings: owner can read their own; writes stay server-side (functions/admin).
    match /bookings/{bookingId} {
      allow read: if signedIn() && resource.data.uid == request.auth.uid;
      allow write: if false; // only Admin SDK (Cloud Functions) writes
    }
  }
}
```
- Add a `firestore` block to `firebase.json` pointing at `firestore.rules` (and `firestore.indexes.json`).
- Add a **composite index** for `bookings` query: `where uid == ... orderBy createdAt desc`.

---

## 5. Frontend Implementation

### 5.1 Firebase client init — `src/lib/firebase.js` (NEW)
- `initializeApp` from `NEXT_PUBLIC_FIREBASE_*` env vars.
- Export `auth` (`getAuth`) and `db` (`getFirestore`).
- Guard for SSR/`'use client'` (only init in browser); singleton to avoid re-init on HMR.

### 5.2 Auth context — `src/context/AuthProvider.js` (NEW, client component)
- `onAuthStateChanged` → exposes `{ user, profile, loading }`.
- Helpers: `sendOtp(phone)`, `confirmOtp(code)`, `signOut()`.
- On login, **fetch/create** `users/{uid}` (create with defaults if missing).
- Wrap app in `src/app/layout.js`.

### 5.3 Phone OTP flow — `src/components/auth/LoginModal.js` (NEW)
- Step 1: phone input (default `+91`), invisible **`RecaptchaVerifier`**, `signInWithPhoneNumber` → store `confirmationResult`.
- Step 2: 6-digit OTP input → `confirmationResult.confirm(code)`.
- Reuse existing modal styling/CSS variables from `globals.css` (orange/navy). Mirror the look of the existing "My Bookings" / support modals in `bookings/new/page.js`.
- Error handling: invalid number, expired/incorrect OTP, quota exceeded, resend timer.

### 5.4 Profile page — `src/app/account/page.js` (NEW)
- Protected (redirect to home + open login if not authed).
- View/edit `name`, `email`, `address.*`. Phone shown read-only (it's the auth identity).
- `updateDoc(users/{uid}, { ...fields, updatedAt: serverTimestamp() })`.
- Validation (email format, pincode 6 digits) and success toast (reuse existing toast pattern).

### 5.5 My Bookings — wire to account
- `src/app/account/bookings/page.js` (NEW) **or** upgrade the existing "My Bookings" modal:
  - If signed in: query `bookings where uid == auth.uid orderBy createdAt desc`.
  - Keep the existing **ID + phone** lookup as a fallback for guests.
- Link each booking row to `bookings/status?id=...`.

### 5.6 Booking creation — attach `uid`
- In `src/app/bookings/new/page.js`: if a user is signed in, **prefill** name/email/phone from `profile`, and pass `uid` into the create-booking call so the function stamps it on the record.
- Anonymous booking still works (uid omitted).

### 5.7 Header / nav
- Add a **Login / Account** entry in `src/app/page.js` header (and mobile menu): shows "Login" when signed out, user name/avatar menu (Account, My Bookings, Sign out) when signed in.

---

## 6. Cloud Functions changes (`functions/src/`)

1. **`createPhonePeOrder`** (`phonepe/createOrder.js`): accept optional `uid` in the request body and include it in the `db.collection("bookings").doc(bookingId).set({...})` write; keep `customerPhone` normalized to E.164. (This is where booking records are created — there is no separate `saveBookingRecord`.)
2. **`claimBookings`** (NEW callable, optional phase 2): on login, set `uid` on past `bookings` where `customerPhone == user.phone && uid == null`. Verify `context.auth` and that the token phone matches.
3. CORS allow-list in `createOrder.js` (`ALLOWED_ORIGINS`) already includes `localhost:3000` + production domains — no change needed for existing endpoints.

---

## 7. Env / Config

- Populate `.env.local` from `.env.local.example` with the **web app config** (`NEXT_PUBLIC_FIREBASE_*`) — these are public identifiers, safe to ship.
- No new secrets for phone auth (handled by Firebase Auth + reCAPTCHA).

---

## 8. Build / Deploy considerations

- New routes (`/account`, `/account/bookings`) are client components — confirm they export statically (no server-only APIs). Use `'use client'`; guard `window`/`auth` for build-time.
- Deploy order: `firebase deploy --only firestore:rules,firestore:indexes` then `npm run build` + `firebase deploy --only hosting` (and `functions` if changed).
- Next.js 16: dynamic route params are Promises; avoid `setState` at top of `useEffect` (lint rule). Read `node_modules/next/dist/docs/` before non-trivial Next APIs.

---

## 9. Implementation Order (PR-sized steps)

1. **Foundation**: `src/lib/firebase.js`, `firestore.rules`, `firebase.json` firestore block, `.env.local`. Deploy rules.
2. **Auth provider + login modal**: phone OTP end-to-end with test numbers.
3. **Profile page** (`/account`): view/update `users/{uid}`.
4. **Bookings linkage**: stamp `uid` on new bookings (function + booking form), My Bookings query.
5. **Header/nav integration** + guest fallback polish.
6. *(Optional)* `claimBookings` callable to back-link historical bookings by phone.

---

## 10. Testing checklist

- [ ] OTP login with a **test number** (no SMS) and a **real number** once.
- [ ] New user → `users/{uid}` auto-created with defaults.
- [ ] Profile update persists and re-renders; rules reject editing another uid.
- [ ] Signed-in booking gets `uid`; appears in My Bookings.
- [ ] Guest booking (no uid) still works and is still trackable by ID + phone.
- [ ] Security rules: unauthenticated read of `users`/`bookings` denied (test in console Rules Playground).
- [ ] `npm run build` succeeds (static export) and `npm run lint` is clean.

---

## 11. Open questions / decisions

- **Bookings read path**: client query (rules-gated, needs index) vs. Cloud Function. Plan assumes client query.
- **Email**: collected on profile but **Phone is the identity** — do we ever need email/password or Google as a second method? (Out of scope for now.)
- **Claiming old bookings** by phone: include now (phase 6) or skip?
- **App Check**: enable now or after launch?
