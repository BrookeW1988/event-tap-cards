// npm run check: looks over your settings and keys and tells you, in plain
// English, anything that's missing or broken. Run it before you go live.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath (not .pathname) so folders with spaces in their names work.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
let problems = 0;
let warnings = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => (problems++, console.log(`  ✗ ${msg}`));
const warn = (msg) => (warnings++, console.log(`  ! ${msg}`));
const isColour = (c) => typeof c === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c);

console.log("\nYour settings (public/cards.config.json)");
let cfg = null;
try {
  cfg = JSON.parse(readFileSync(join(ROOT, "public", "cards.config.json"), "utf8"));
} catch (err) {
  bad(`cards.config.json isn't valid JSON (usually a missing comma or quote): ${err.message}`);
}
if (cfg) {
  const name = cfg.event?.name ?? "";
  if (!name) bad("event.name is empty");
  else if (name === "Your Event") warn('event.name is still "Your Event": say "set up my tap cards" to make it yours');
  else ok(`event name: "${name}"`);

  // Starter details left in: they'd show on every pass.
  if (cfg.event?.place === "Your City") warn('event.place is still "Your City" (it shows on every pass)');
  if (cfg.event?.date === "01.03") warn('event.date is still the starter "01.03" (it shows on the pass seal): put in your date');
  const leftovers = JSON.stringify({ pass: cfg.pass, messenger: cfg.messenger, words: cfg.words }).match(/YOUR EVENT|Your City|YOUR CITY/g);
  if (leftovers) warn(`"${leftovers[0]}" is typed into your pass or messenger words: swap in your event's details (or use {event} / {place})`);

  for (const [key, value] of Object.entries(cfg.look?.colours ?? {})) {
    if (!isColour(value)) bad(`colour "${key}" should look like #ff1493, but it's ${JSON.stringify(value)}`);
  }
  for (const key of ["hot", "soft", "lilac", "mint", "ink", "night"]) {
    if (!cfg.look?.colours?.[key]) warn(`colour "${key}" is missing, so the default is used`);
  }
  const allowed = ["instagram", "tiktok", "linkedin", "website"];
  const fields = cfg.fields ?? [];
  const wrong = fields.filter((f) => !allowed.includes(f));
  if (wrong.length) bad(`fields can only be ${allowed.join(", ")} (found ${wrong.join(", ")})`);
  else if (!fields.length) warn("fields is empty, so cards only show a name");
  else ok(`the form asks for: name, ${fields.join(", ")}`);
  if (!Array.isArray(cfg.pass?.seal)) warn("pass.seal should be a list of 1-3 short lines, e.g. [\"✦ 01.03 ✦\", \"BESTIE\", \"VERIFIED\"]");
  if ((cfg.pass?.title ?? "").length > 12) warn(`pass.title "${cfg.pass.title}" is long: keep it under 12 letters so it fits on one line`);
}

console.log("\nYour secret keys (.env, for testing on this computer)");
const envFile = join(ROOT, ".env");
if (!existsSync(envFile)) {
  warn("no .env file yet: run `npm run setup` to make your keys");
} else {
  const env = Object.fromEntries(
    readFileSync(envFile, "utf8")
      .split("\n")
      .filter((l) => /^\w+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
  );
  (env.ADMIN_KEY?.length ?? 0) >= 8 ? ok("ADMIN_KEY is set") : bad("ADMIN_KEY is missing: run `npm run setup`");
  (env.CARD_SECRET?.length ?? 0) >= 16 ? ok("CARD_SECRET is set (never change it once cards are written)") : bad("CARD_SECRET is missing or too short: run `npm run setup`");
  if (env.RESEND_API_KEY && env.EMAIL_FROM) ok("edit-link emails are set up");
  else if (env.RESEND_API_KEY || env.EMAIL_FROM) bad("edit-link emails need BOTH RESEND_API_KEY and EMAIL_FROM");
  else ok("edit-link emails are off (only the phone that set a card up can edit it)");
  if (env.SITE_URL) {
    if (!/^https:\/\/[^/]+$/.test(env.SITE_URL)) bad(`SITE_URL should look like https://your-cards.netlify.app (no slash at the end), but it's ${env.SITE_URL}`);
    else ok(`live address: ${env.SITE_URL} (your cards are written with this)`);
  } else {
    ok("not live yet (no SITE_URL): that's fine until you go live");
  }
  console.log("  (Remember: the live site uses the keys saved in Netlify, not this file.)");
}

console.log(
  problems
    ? `\n${problems} thing${problems === 1 ? "" : "s"} to fix${warnings ? `, ${warnings} to look at` : ""}.\n`
    : warnings
      ? `\nNothing broken. ${warnings} thing${warnings === 1 ? "" : "s"} to look at.\n`
      : "\nAll good ✦\n",
);
process.exit(problems ? 1 : 0);
