import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const expectedSupabaseHost = "hvjwjbomfsuwaauolgyh.supabase.co";
const stagingEnvPath = resolve(process.cwd(), ".env.staging.local");
const competingEnvFiles = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
];

function parseEnvFile(path) {
  if (!existsSync(path)) return new Map();

  const values = new Map();
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);
    if (!match) continue;

    let value = match[2].trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values.set(match[1], value);
  }
  return values;
}

if (!existsSync(stagingEnvPath)) {
  console.error("Missing .env.staging.local. Staging was not started.");
  process.exit(1);
}

const stagingValues = parseEnvFile(stagingEnvPath);
const requiredKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const missingKeys = requiredKeys.filter((key) => !stagingValues.get(key));

if (missingKeys.length > 0) {
  console.error(`Missing required Staging variables: ${missingKeys.join(", ")}`);
  process.exit(1);
}

let supabaseUrl;
try {
  supabaseUrl = new URL(stagingValues.get("NEXT_PUBLIC_SUPABASE_URL"));
} catch {
  console.error("NEXT_PUBLIC_SUPABASE_URL in .env.staging.local is not a valid URL.");
  process.exit(1);
}

if (supabaseUrl.protocol !== "https:" || supabaseUrl.hostname !== expectedSupabaseHost) {
  console.error(`Refusing to start: Staging Supabase host must be ${expectedSupabaseHost}.`);
  process.exit(1);
}

// Keep only operating-system variables required to launch Node, then inject Staging values.
// Every key found in Next.js env files is pre-set to an empty value unless Staging defines it;
// pre-set process values take precedence over Next.js automatic .env.local loading.
const inheritedKeys = [
  "PATH",
  "Path",
  "PATHEXT",
  "SystemRoot",
  "WINDIR",
  "COMSPEC",
  "TEMP",
  "TMP",
  "USERPROFILE",
  "APPDATA",
  "LOCALAPPDATA",
  "PROGRAMDATA",
  "HOME",
  "HOMEDRIVE",
  "HOMEPATH",
];
const childEnv = {};
for (const key of inheritedKeys) {
  if (process.env[key] !== undefined) childEnv[key] = process.env[key];
}

for (const filename of competingEnvFiles) {
  for (const key of parseEnvFile(resolve(process.cwd(), filename)).keys()) {
    childEnv[key] = "";
  }
}
for (const [key, value] of stagingValues) childEnv[key] = value;
childEnv.KISHIB_ENV = "staging";

const args = process.argv.slice(2);
const command = args[0] === "--build" ? "build" : "dev";
if (command === "build") args.shift();
childEnv.NODE_ENV = command === "build" ? "production" : "development";

console.log(`KISHIB Staging: ${supabaseUrl.hostname} (${command})`);
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, command, ...args], {
  cwd: process.cwd(),
  env: childEnv,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Unable to start Next.js: ${error.message}`);
  process.exit(1);
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
