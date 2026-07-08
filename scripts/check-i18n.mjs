import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const locales = ["ar", "en", "ku", "fr", "hi", "fa", "tr", "ru", "es"];
const localeUnionPath = path.join(root, "src/components/antique-ai/types.ts");
const localeUnion = fs.readFileSync(localeUnionPath, "utf8");
const contentPath = path.join(root, "src/components/antique-ai/antiqueContent.ts");
const content = fs.readFileSync(contentPath, "utf8");

const missingFromLocaleType = locales.filter(
  (locale) => !new RegExp(`["']${locale}["']`).test(localeUnion),
);

if (missingFromLocaleType.length) {
  console.error(`Missing locales in Locale type: ${missingFromLocaleType.join(", ")}`);
  process.exitCode = 1;
}

if (/\bsp\b/.test(localeUnion) || /["']sp["']/.test(content)) {
  console.error("Invalid locale key `sp` found. Use `es` for Spanish.");
  process.exitCode = 1;
}

const missingLocales = locales.filter(
  (locale) => !new RegExp(`\\n\\s*${locale}:\\s*\\{`).test(content),
);

if (missingLocales.length) {
  console.error(`Missing locales in antiqueContent.ts: ${missingLocales.join(", ")}`);
  process.exitCode = 1;
}

const localeBlocks = new Map();
for (const locale of locales) {
  const start = content.search(new RegExp(`\\n\\s*${locale}:\\s*\\{`));
  if (start < 0) continue;
  const rest = content.slice(start + 1);
  const nextStarts = locales
    .filter((other) => other !== locale)
    .map((other) => rest.search(new RegExp(`\\n\\s*${other}:\\s*\\{`)))
    .filter((index) => index >= 0)
    .map((index) => start + 1 + index);
  const end = nextStarts.length ? Math.min(...nextStarts) : content.indexOf("} as const", start);
  localeBlocks.set(locale, content.slice(start, end));
}

const keyPattern = /^\s{4}([a-zA-Z][a-zA-Z0-9]*):\s*(?:"|\[)/gm;
const baseline = [...(localeBlocks.get("en") || "").matchAll(keyPattern)].map((match) => match[1]);

for (const locale of locales) {
  const keys = [...(localeBlocks.get(locale) || "").matchAll(keyPattern)].map((match) => match[1]);
  const missing = baseline.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !baseline.includes(key));
  if (missing.length || extra.length) {
    console.error(`${locale}: missing [${missing.join(", ")}], extra [${extra.join(", ")}]`);
    process.exitCode = 1;
  }
}

const scanTargets = ["src/components/antique-ai", "src/app", "src/lib"].map((folder) =>
  path.join(root, folder),
);
const mojibakePattern = /(?:\u00c3|\u00d0|\u00d1|\u00d8|\u00d9|\u00db|\u00e0\u00a4|\u00e0\u00a5|\ufffd)/;
const intentionalContextPattern =
  /mojibake|looksMojibake|mojibakeScore|repairMojibake|decodeMojibake|cp1252|repairText|cleanDisplayText|TextDecoder|\\u00d8|\\u00d9|\\u00da|\\u00db|\\u00c3|\\u00c2|\\u00e0\\u00a4|\\u00e0\\u00a5/i;
const validUnicodeExceptions = [
  "Âge / Période",
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

const realMojibake = [];
const intentionalMojibake = [];
const reviewMojibake = [];
for (const target of scanTargets) {
  for (const file of walk(target)) {
    const relative = path.normalize(path.relative(root, file));
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

    lines.forEach((line, index) => {
      if (!mojibakePattern.test(line)) return;
      const item = `${relative}:${index + 1}`;
      const context = lines
        .slice(Math.max(0, index - 3), Math.min(lines.length, index + 4))
        .join("\n");

      if (validUnicodeExceptions.some((value) => line.includes(value))) return;
      if (intentionalContextPattern.test(context)) {
        intentionalMojibake.push(item);
        return;
      }

      if (/^\s*(\/\/|\/\*|\*)/.test(line)) {
        reviewMojibake.push(item);
        return;
      }

      realMojibake.push(item);
    });
  }
}

if (intentionalMojibake.length) {
  console.log("Intentional mojibake detection patterns:");
  intentionalMojibake.forEach((item) => console.log(`- ${item}`));
}

if (reviewMojibake.length) {
  console.warn("Mojibake-like text needing manual review:");
  reviewMojibake.forEach((item) => console.warn(`- ${item}`));
}

if (realMojibake.length) {
  console.error("Real mojibake found in user/API text:");
  realMojibake.forEach((item) => console.error(`- ${item}`));
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log("i18n check passed for 9 locales and real mojibake text.");
}
