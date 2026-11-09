// Shared start-up for every page: loads your settings (cards.config.json) and
// applies your colours and fonts.

export async function loadConfig() {
  const res = await fetch("/cards.config.json", { cache: "no-cache" });
  if (!res.ok) throw new Error("Couldn't load cards.config.json");
  return res.json();
}

/** Apply your colours + fonts to the page. Resolves once the fonts are ready (or after 3s). */
export function applyLook(config) {
  const c = config.look?.colours ?? {};
  const f = config.look?.fonts ?? {};
  const root = document.documentElement.style;
  for (const name of ["hot", "soft", "lilac", "mint", "ink", "night"]) {
    if (c[name]) root.setProperty(`--${name}`, c[name]);
  }
  const fontVar = { display: "--font-display", pixel: "--font-pixel", numbers: "--font-numbers", body: "--font-body" };
  for (const [key, cssVar] of Object.entries(fontVar)) {
    if (f[key]) root.setProperty(cssVar, `"${f[key]}", system-ui, sans-serif`);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && c.night) meta.content = c.night;

  const families = [...new Set([f.display, f.pixel, f.numbers, f.body].filter(Boolean))];
  if (families.length === 0) return Promise.resolve();
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?" +
    families.map((name) => `family=${encodeURIComponent(name).replace(/%20/g, "+")}`).join("&") +
    "&display=swap";
  const listLoaded = new Promise((resolve) => {
    link.onload = resolve;
    link.onerror = resolve;
  });
  document.head.appendChild(link);
  const ready = listLoaded.then(() => Promise.all(families.map((name) => document.fonts.load(`24px "${name}"`).catch(() => null))));
  const timeout = new Promise((r) => setTimeout(r, 3000)); // slow venue wi-fi: carry on with a backup font
  return Promise.race([ready, timeout]);
}

/** A line from the config with {event}, {year}, {place} and {date} filled in. */
export function filler(config) {
  const e = config.event ?? {};
  const base = { event: e.name ?? "", year: e.year ?? "", place: e.place ?? "", date: e.date ?? "" };
  return (text, vars = {}) => String(text ?? "").replace(/\{(\w+)\}/g, (_, k) => String({ ...base, ...vars }[k] ?? ""));
}

/** Escape text before it goes into the page. */
export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

/** The admin key from the page link: /admin#key=abc (the part after # never leaves the device). */
export function keyFromLink() {
  return (new URLSearchParams(location.hash.slice(1)).get("key") ?? "").trim();
}
