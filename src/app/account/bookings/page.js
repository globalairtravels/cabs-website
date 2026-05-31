"use client";

import { useEffect } from "react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function AccountBookingsRedirect() {
  useEffect(() => {
    window.location.replace(`${BASE_PATH}/bookings/`);
  }, []);
  return null;
}
