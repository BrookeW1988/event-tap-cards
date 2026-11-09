// Shared helpers for the cards site's server functions (netlify/functions/*).
//
// Each physical card holds ONE web address: https://<your-site>/c/<number>-<code>,
// e.g. /c/27-k3x9qm. The number is so you know where you're up to when you
// write the cards. The code is made from the number + your CARD_SECRET, so
// nobody can flick through other people's cards by changing the number (and
// nothing has to be stored to check it: the server just works it out again).
//
// Storage is Netlify Blobs: it comes free with every Netlify site, so there's
// no database to set up. Everything lives in one store called "tap-cards":
//   cards/<number>.json   one file per card that's been set up. No file = a
//                         blank card. Holds the name + links shown on the pass,
//                         plus private bits that never leave the server: a
//                         hash of the owner's phone token, and their email.

import { getStore } from "@netlify/blobs";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import cardsConfig from "../../public/cards.config.json" with { type: "json" };

export { cardsConfig };

// "strong" = a card works the moment it's saved, not up to 60s later.
export const store = () => getStore({ name: "tap-cards", consistency: "strong" });

/** Read a setting from Netlify's environment variables (or .env when testing locally). */
export function env(name) {
  const fromNetlify = globalThis.Netlify?.env?.get?.(name);
  return String(fromNetlify ?? process.env[name] ?? "").trim();
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/** Same-length, same-time comparison, so the check doesn't leak how close a guess was. */
function sameText(a, b) {
  const x = createHash("sha256").update(String(a)).digest();
  const y = createHash("sha256").update(String(b)).digest();
  return timingSafeEqual(x, y);
}

/** Does the key sent by the admin page match ADMIN_KEY? */
export function adminKeyOk(req) {
  const expected = env("ADMIN_KEY");
  const given = req.headers.get("x-admin-key");
  // A missing or too-short key in the environment locks the admin page, on purpose.
  if (expected.length < 8 || !given) return false;
  return sameText(given.trim(), expected);
}

// ---------- card addresses ----------

// No 0/o, 1/l/i, so a code read off a phone screen can't be misread.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 6;
export const MAX_NUMBER = 99999;

function secret() {
  const s = env("CARD_SECRET");
  return s.length >= 16 ? s : null;
}

export const secretSet = () => Boolean(secret());

/** The secret code for card number n (always the same for the same number + secret). */
export function codeFor(num) {
  const s = secret();
  if (!s) return null;
  const bytes = createHmac("sha256", s).update(`tap-card:v1:${num}`).digest();
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return code;
}

/** "27-k3x9qm" → 27, or null if it isn't one of your cards. */
export function parseCard(raw) {
  const m = /^(\d{1,5})-([a-z0-9]{6})$/i.exec(String(raw ?? "").trim());
  if (!m) return null;
  const num = Number(m[1]);
  const expected = codeFor(num);
  if (num < 1 || !expected) return null;
  return sameText(m[2].toLowerCase(), expected) ? num : null;
}

/** The full address written onto card n. `origin` = https://your-site.netlify.app */
export const cardAddress = (origin, num) => `${origin}/c/${num}-${codeFor(num)}`;

/** Pass numbers show with at least 3 digits: 7 → "007". */
export const passNo = (num) => String(num).padStart(3, "0");

// ---------- the cards themselves ----------

const cardKey = (num) => `cards/${num}.json`;

/** The saved card, or null if it's still blank. */
export const getCard = (num) => store().get(cardKey(num), { type: "json" });

/** Only these ever go to someone tapping the card (never the email or owner hash). */
export function publicFields(card) {
  const { name, instagram, tiktok, linkedin, website } = card;
  return { name, instagram, tiktok, linkedin, website };
}

/**
 * Set up a blank card. Returns the new owner token, or null if another phone
 * set it up first (first save wins: `onlyIfNew` makes that a single step).
 */
export async function claimCard(num, fields, email) {
  const token = randomBytes(24).toString("base64url");
  const now = new Date().toISOString();
  const card = {
    num,
    ...fields,
    email,
    ownerHash: sha256(token),
    hidden: false,
    claimedAt: now,
    updatedAt: now,
    linkSentAt: null,
  };
  const result = await store().setJSON(cardKey(num), card, { onlyIfNew: true });
  if (result?.modified === false) return null;
  // Belt and braces: read it back and make sure it's ours. (The live store
  // already refuses a second "new" save; the local test store doesn't.)
  const saved = await getCard(num);
  return saved?.ownerHash === card.ownerHash ? token : null;
}

export const saveCard = (card) => store().setJSON(cardKey(card.num), { ...card, updatedAt: new Date().toISOString() });
export const clearCard = (num) => store().delete(cardKey(num));

/** Every set-up card, lowest number first. */
export async function listCards() {
  const { blobs } = await store().list({ prefix: "cards/" });
  const cards = [];
  for (let i = 0; i < blobs.length; i += 20) {
    const batch = await Promise.all(blobs.slice(i, i + 20).map((b) => store().get(b.key, { type: "json" })));
    cards.push(...batch.filter(Boolean));
  }
  return cards.sort((a, b) => a.num - b.num);
}

// ---------- who owns a card ----------

// The phone that set the card up keeps a random token (in its browser
// storage); the card stores only a hash of it. Anyone who opens the emailed
// edit link holds the edit key instead. Either one counts as the owner.

/** The private edit key for a card: tied to the card, its email and when it was set up. */
export function editKey(card) {
  const s = secret();
  if (!s || !card?.email) return null;
  return createHmac("sha256", s)
    .update(`tap-card-edit:v1:${card.num}:${card.email.toLowerCase()}:${card.claimedAt}`)
    .digest("base64url");
}

export const isOriginalOwner = (card, token) => Boolean(token) && sameText(sha256(token), card.ownerHash);

export function isOwner(card, token) {
  if (!card || !token) return false;
  if (isOriginalOwner(card, token)) return true;
  const key = editKey(card);
  return Boolean(key) && sameText(token, key);
}

// ---------- email (optional) ----------

export const emailOn = () => Boolean(env("RESEND_API_KEY") && env("EMAIL_FROM") && secret());

const fill = (text, vars) => String(text ?? "").replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/**
 * At most one edit-link email per card every 2 minutes, so the "get an edit
 * link" button can't be used to flood someone's inbox. `force` = the owner
 * just changed their email, so always send to the new one.
 */
function canSendLink(card, force) {
  if (force || !card.linkSentAt) return true;
  return Date.now() - new Date(card.linkSentAt).getTime() > 2 * 60 * 1000;
}

/**
 * Emails the owner their private edit link. Returns true if it went.
 * Never throws: a failed email must never fail a save.
 */
export async function sendEditLink(card, origin, { force = false } = {}) {
  try {
    if (!emailOn() || !card?.email || !canSendLink(card, force)) return false;
    await saveCard({ ...card, linkSentAt: new Date().toISOString() });

    const ev = cardsConfig.event?.name ?? "event";
    const no = passNo(card.num);
    const cardUrl = cardAddress(origin, card.num);
    const editUrl = `${cardUrl}?key=${editKey(card)}`;
    const first = esc(card.name.split(/\s+/)[0] || "there");
    const hot = cardsConfig.look?.colours?.hot ?? "#ff1493";
    const html = `<!doctype html><html><body style="margin:0;background:#f6f1f4;font-family:Arial,Helvetica,sans-serif;color:#1f1f1f">
<div style="max-width:520px;margin:0 auto;padding:28px 22px">
  <p style="font-size:24px;font-weight:bold;margin:0 0 14px">hey ${first} ✦</p>
  <p style="font-size:16px;line-height:1.6;margin:0 0 22px">here's your private link to edit ${esc(ev)} card no. ${no}. use it any time, from any phone: change your socials, add new ones, or clear the card completely.</p>
  <p style="text-align:center;margin:0 0 24px"><a href="${esc(editUrl)}" style="display:inline-block;background:${esc(hot)};color:#ffffff;text-decoration:none;font-weight:bold;font-size:17px;padding:14px 26px;border-radius:999px">edit my card</a></p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 18px">keep this email somewhere safe. anyone with this link can change your card, so don't forward it. lost it? tap your card, then "is this your card? get an edit link" and a fresh one comes.</p>
  <p style="font-size:13px;margin:0 0 26px">your card: <a href="${esc(cardUrl)}" style="color:${esc(hot)}">${esc(cardUrl.replace(/^https?:\/\//, ""))}</a></p>
  <p style="font-size:12px;line-height:1.5;color:#6b7280;margin:0">you're getting this because this email was added to ${esc(ev)} card no. ${no}. it's only used for edit links. wasn't you? just reply and say so.</p>
</div></body></html>`;

    const replyTo = cardsConfig.email?.replyTo;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env("RESEND_API_KEY")}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: env("EMAIL_FROM"),
        to: [card.email],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: fill(cardsConfig.email?.subject ?? "edit your {event} card (no. {passNo})", { event: ev, passNo: no }),
        html,
      }),
    });
    if (!res.ok) {
      console.error("[cards] edit-link email rejected:", res.status, await res.text());
      await saveCard({ ...card, linkSentAt: null }); // let them try again straight away
      return false;
    }
    return true;
  } catch (err) {
    console.error("[cards] edit-link email failed:", err);
    return false;
  }
}
