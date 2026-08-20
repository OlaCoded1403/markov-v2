// Prints the SHAPE of ~/.memwal/credentials.json without revealing the delegate key.
// Run this once after `memwal_login` so run.mjs knows which field names to read.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const path = join(homedir(), ".memwal", "credentials.json");

let raw;
try {
  raw = readFileSync(path, "utf8");
} catch (err) {
  console.error(`Could not read ${path}`);
  console.error(
    err.code === "ENOENT"
      ? "Not signed in yet. Ask the agent to run memwal_login first."
      : err.message,
  );
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  console.error("File exists but is not valid JSON. Try memwal_logout then memwal_login.");
  process.exit(1);
}

const SECRET = /key|secret|private|seed|mnemonic|token/i;

function describe(value, keyName = "") {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(${value.length})`;
  if (typeof value === "object") return "object";
  if (typeof value === "string") {
    if (SECRET.test(keyName)) return `string(len=${value.length}) [REDACTED]`;
    return value.length > 60 ? `string(len=${value.length}) "${value.slice(0, 24)}…"` : `"${value}"`;
  }
  return `${typeof value}(${value})`;
}

function walk(obj, prefix = "") {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      console.log(`  ${path}: object`);
      walk(v, path);
    } else {
      console.log(`  ${path}: ${describe(v, k)}`);
    }
  }
}

console.log(`Credential shape at ${path}:\n`);
walk(parsed);

// Best-effort detection of the fields run.mjs needs.
const flat = {};
(function flatten(o, p = "") {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key);
    else flat[key] = v;
  }
})(parsed);

const findKey = (re) => Object.keys(flat).find((k) => re.test(k) && typeof flat[k] === "string");

const accountField = findKey(/account.?id|accountId|owner/i);
const keyField = findKey(/private.?key|delegate.?key|^key$|secret/i);
const serverField = findKey(/server|relayer|url/i);

console.log("\nDetected fields:");
console.log(`  accountId  -> ${accountField ?? "NOT FOUND"}`);
console.log(`  key        -> ${keyField ?? "NOT FOUND"}`);
console.log(`  serverUrl  -> ${serverField ?? "NOT FOUND"} ${serverField ? `(${flat[serverField]})` : ""}`);

if (serverField && /staging/.test(String(flat[serverField]))) {
  console.log("\n  ⚠  That relayer is STAGING (testnet). The rules require mainnet.");
} else if (serverField) {
  console.log("\n  ✓ Relayer looks like mainnet.");
}

if (!accountField || !keyField) {
  console.log(
    "\nIf either field is NOT FOUND, paste the field names above (not the values) and\n" +
      "the mapping in run.mjs can be adjusted.",
  );
}
