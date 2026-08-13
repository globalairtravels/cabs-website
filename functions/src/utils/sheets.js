const { google } = require("googleapis");
const { defineSecret, defineString } = require("firebase-functions/params");

const SPREADSHEET_ID = defineSecret("GOOGLE_SHEETS_SPREADSHEET_ID");
const SHEET_TAB = defineString("GOOGLE_SHEETS_TAB", { default: "CabBookings" });

const HEADERS = [
  "bookingId",
  "status",
  "name",
  "phone",
  "date",
  "time",
  "pickup",
  "drop",
  "tripType",
  "cab",
  "paymentOption",
  "advanceAmount",
  "balanceToDriver",
  "amountPaid",
  "finalTotal",
  "address",
  "flightNumber",
  "days",
  "estKm",
  "email",
  "fare",
  "promo",
  "discount",
  "seats",
  "cabId",
  "gateway",
  "uid",
  "notes",
  "createdAt",
  "updatedAt",
];

function lastCol() {
  let n = HEADERS.length;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

function headersMatch(row) {
  return Array.isArray(row) && HEADERS.length === row.length && HEADERS.every((name, i) => row[i] === name);
}

function nowIst() {
  return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false });
}

function rupees(paise) {
  if (typeof paise !== "number" || !Number.isFinite(paise)) return "";
  return String(Math.round(paise / 100));
}

function sheetsSecrets() {
  // Spreadsheet id is required. JSON credentials are optional — when omitted
  // the function uses Application Default Credentials (the Cloud Functions
  // service account). Share the sheet with that account as Editor.
  return [SPREADSHEET_ID];
}

function spreadsheetId() {
  try {
    const fromSecret = SPREADSHEET_ID.value();
    if (fromSecret) return String(fromSecret).trim();
  } catch {
    // Secret not bound (emulator). Fall through to env.
  }
  return (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "").trim();
}

function tabName() {
  return (SHEET_TAB.value() || process.env.GOOGLE_SHEETS_TAB || "CabBookings").trim();
}

async function getSheetsClient() {
  let credentials = null;
  const raw = process.env.GOOGLE_SHEETS_CREDENTIALS || "";
  try {
    if (raw) credentials = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (err) {
    throw new Error(`GOOGLE_SHEETS_CREDENTIALS is not valid JSON: ${err.message}`);
  }

  const auth = credentials
    ? new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      })
    : new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

  return google.sheets({ version: "v4", auth });
}

function quoteTab(tab) {
  return `'${String(tab).replace(/'/g, "''")}'`;
}

async function ensureTabAndHeader(sheets, id, tab) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
  const exists = (meta.data.sheets || []).some((sheet) => sheet.properties?.title === tab);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
    });
  }

  const header = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${quoteTab(tab)}!1:1`,
  });
  if (headersMatch(header.data.values?.[0] || [])) return;

  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `${quoteTab(tab)}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADERS] },
  });
}

function fieldMap(record, { createdAt, updatedAt, amountPaid } = {}) {
  const details = record.bookingDetails || {};
  return {
    bookingId: record.bookingId || "",
    status: record.paymentStatus || "",
    name: details.name || "",
    phone: record.customerPhone || details.phone || "",
    date: details.date || "",
    time: details.time || "",
    pickup: details.pickup || "",
    drop: details.drop || "",
    tripType: details.tripType || "",
    cab: details.cab || "",
    paymentOption: details.paymentMethod || "",
    advanceAmount: details.onlinePaymentAmount ?? "",
    balanceToDriver: details.payToDriverAmount ?? "",
    amountPaid: amountPaid ?? rupees(record.amount),
    finalTotal: details.finalTotal ?? details.totalPrice ?? "",
    address: details.address || "",
    flightNumber: details.flightNumber || "",
    days: details.cityDays || details.tempoDays || details.days || "",
    estKm: details.tempoEstKm || details.estKm || "",
    email: details.email || "",
    fare: details.totalPrice ?? "",
    promo: details.promoCode || "",
    discount: details.promoDiscount ?? "",
    seats: details.seats || "",
    cabId: details.cabId || "",
    gateway: record.paymentGateway || "none",
    uid: record.uid || "",
    notes: details.notes || "",
    createdAt: createdAt || nowIst(),
    updatedAt: updatedAt || nowIst(),
  };
}

function rowFromRecord(record, extras = {}) {
  const fields = fieldMap(record, extras);
  return HEADERS.map((name) => {
    const value = fields[name];
    return value == null ? "" : String(value);
  });
}

async function appendBookingRow(record) {
  const id = spreadsheetId();
  if (!id) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");

  const sheets = await getSheetsClient();
  const tab = tabName();
  await ensureTabAndHeader(sheets, id, tab);

  const stamp = nowIst();
  await sheets.spreadsheets.values.append({
    spreadsheetId: id,
    range: `${quoteTab(tab)}!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [rowFromRecord(record, { createdAt: stamp, updatedAt: stamp })] },
  });
}

async function findRowNumber(sheets, id, tab, bookingId) {
  const col = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${quoteTab(tab)}!A:A`,
  });
  const values = col.data.values || [];
  for (let i = 1; i < values.length; i += 1) {
    if (values[i][0] === bookingId) return i + 1;
  }
  return null;
}

async function updateBookingRow(bookingId, patch) {
  const id = spreadsheetId();
  if (!id) {
    console.warn("[sheets] skip update — GOOGLE_SHEETS_SPREADSHEET_ID is not set");
    return;
  }

  const sheets = await getSheetsClient();
  const tab = tabName();
  await ensureTabAndHeader(sheets, id, tab);

  const rowNumber = await findRowNumber(sheets, id, tab, bookingId);
  if (!rowNumber) {
    console.warn(`[sheets] no row for ${bookingId} — appending`);
    await sheets.spreadsheets.values.append({
      spreadsheetId: id,
      range: `${quoteTab(tab)}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [
          rowFromRecord(
            { bookingId, ...patch, bookingDetails: patch.bookingDetails || {} },
            { amountPaid: patch.amountPaid }
          ),
        ],
      },
    });
    return;
  }

  const current = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${quoteTab(tab)}!A${rowNumber}:${lastCol()}${rowNumber}`,
  });
  const existing = current.data.values?.[0] || [];
  while (existing.length < HEADERS.length) existing.push("");

  const index = Object.fromEntries(HEADERS.map((name, i) => [name, i]));
  if (patch.paymentStatus != null) existing[index.status] = String(patch.paymentStatus);
  if (patch.paymentGateway != null) existing[index.gateway] = String(patch.paymentGateway);
  if (patch.amountPaid != null) existing[index.amountPaid] = String(patch.amountPaid);
  existing[index.updatedAt] = nowIst();

  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `${quoteTab(tab)}!A${rowNumber}:${lastCol()}${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [existing] },
  });
}

module.exports = {
  sheetsSecrets,
  spreadsheetId,
  appendBookingRow,
  updateBookingRow,
};
