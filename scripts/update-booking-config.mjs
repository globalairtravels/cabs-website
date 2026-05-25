import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const DEFAULT_CONFIG_PATH = "firestore/booking-config.sample.json";
const DEFAULT_DOC_PATH = "configs/booking";

function parseArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG_PATH,
    doc: DEFAULT_DOC_PATH,
    serviceAccount: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
    dryRun: false,
    merge: false,
    stampUpdatedAt: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const nextValue = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      i += 1;
      return value;
    };

    if (arg === "--config") args.config = nextValue();
    else if (arg === "--doc") args.doc = nextValue();
    else if (arg === "--service-account") args.serviceAccount = nextValue();
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--merge") args.merge = true;
    else if (arg === "--preserve-updated-at") args.stampUpdatedAt = false;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm run firestore:update-booking-config -- --service-account ./service-account.json

Options:
  --service-account <path>   Firebase service account JSON path.
                             Defaults to GOOGLE_APPLICATION_CREDENTIALS.
  --config <path>            Config JSON path. Default: ${DEFAULT_CONFIG_PATH}
  --doc <path>               Firestore document path. Default: ${DEFAULT_DOC_PATH}
  --merge                    Merge into the existing document instead of replacing it.
  --dry-run                  Validate and print the target without writing.
  --preserve-updated-at      Keep updatedAt from the JSON instead of stamping current time.
`);
}

async function readJson(filePath, label) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  try {
    return JSON.parse(await readFile(absolutePath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read ${label} at ${absolutePath}: ${error.message}`);
  }
}

function assertPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (!args.serviceAccount) {
    throw new Error("Pass --service-account <path> or set GOOGLE_APPLICATION_CREDENTIALS.");
  }

  if (!args.doc.includes("/") || args.doc.split("/").length % 2 !== 0) {
    throw new Error(`Firestore document path must point to a document, received: ${args.doc}`);
  }

  const [serviceAccount, bookingConfig] = await Promise.all([
    readJson(args.serviceAccount, "service account JSON"),
    readJson(args.config, "booking config JSON"),
  ]);

  assertPlainObject(serviceAccount, "Service account JSON");
  assertPlainObject(bookingConfig, "Booking config JSON");

  if (serviceAccount.type !== "service_account") {
    throw new Error("Service account JSON must have type: service_account.");
  }

  const payload = {
    ...bookingConfig,
    ...(args.stampUpdatedAt ? { updatedAt: new Date().toISOString() } : {}),
  };

  if (args.dryRun) {
    console.log("Dry run only. No Firestore write was made.");
    console.log(`Project: ${serviceAccount.project_id}`);
    console.log(`Document: ${args.doc}`);
    console.log(`Mode: ${args.merge ? "merge" : "replace"}`);
    console.log(`Top-level keys: ${Object.keys(payload).join(", ")}`);
    return;
  }

  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });

  await getFirestore().doc(args.doc).set(payload, { merge: args.merge });

  console.log(`Updated Firestore document: ${args.doc}`);
  console.log(`Project: ${serviceAccount.project_id}`);
  console.log(`Mode: ${args.merge ? "merge" : "replace"}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
