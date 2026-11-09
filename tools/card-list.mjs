// Makes the card lists NFC Tools imports: one card address per row, no header.
// (You can also download these from your live admin page, straight onto your iPhone.)
//
//   npm run cards -- 1 3           cards 1 to 3 → card-lists/cards-001-003.csv
//   npm run cards -- 4 50          cards 4 to 50
//   npm run cards -- 1 3 --local   test lists that point at your computer (npm run dev)
//   npm run cards -- --show 27     just print card 27's address
//
// Uses SITE_URL (your live address) and CARD_SECRET from .env, the same way
// the live site does, so the lists match your cards exactly.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const envFile = join(ROOT, ".env");
if (!existsSync(envFile)) {
  console.error("No .env yet: run `npm run setup` first.");
  process.exit(1);
}
for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const m = /^(\w+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

// Same code as the live site uses (netlify/lib/shared.mjs), so the two can never disagree.
const { cardAddress, MAX_NUMBER, passNo, secretSet } = await import("../netlify/lib/shared.mjs");
if (!secretSet()) {
  console.error("CARD_SECRET is missing from .env: run `npm run setup` first.");
  process.exit(1);
}

const args = process.argv.slice(2);
const local = args.includes("--local");
const origin = local ? "http://localhost:8888" : (process.env.SITE_URL ?? "").replace(/\/+$/, "");
if (!origin) {
  console.error(
    "Your live address isn't saved yet. Put the site live first, then run\n" +
      "  bash tools/links.sh https://your-site.netlify.app\n" +
      "(Cards hold the address forever, so they need your FINAL address. For a test, add --local.)",
  );
  process.exit(1);
}

const show = args.indexOf("--show");
if (show !== -1) {
  const n = Number(args[show + 1]);
  if (!Number.isInteger(n) || n < 1 || n > MAX_NUMBER) {
    console.error("Say which card, e.g. `npm run cards -- --show 27`.");
    process.exit(1);
  }
  console.log(cardAddress(origin, n));
  process.exit(0);
}

const [from, to] = args.filter((a) => !a.startsWith("--")).map(Number);
if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > MAX_NUMBER) {
  console.error("Say which cards, e.g. `npm run cards -- 1 3` or `npm run cards -- 4 50`.");
  process.exit(1);
}
const rows = [];
for (let n = from; n <= to; n++) rows.push(cardAddress(origin, n));
mkdirSync(join(ROOT, "card-lists"), { recursive: true });
const file = join("card-lists", `${local ? "TEST-LOCAL-" : ""}cards-${passNo(from)}-${passNo(to)}.csv`);
writeFileSync(join(ROOT, file), rows.join("\n") + "\n");
console.log(`Saved ${rows.length} card addresses in ${file}`);
console.log(`First: ${rows[0]}`);
if (local) console.log("⚠ These point at your computer: they only work for testing, never write them onto real event cards.");
