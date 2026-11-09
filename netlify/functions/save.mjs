// POST /api/card/<number>-<code>/save: set up, edit or clear a card.
//   blank card          → anyone holding it can set it up (first save wins)
//   already set-up card → only the owner (the phone that set it up, or
//                         someone with the emailed edit link) can change or
//                         clear it; everyone else gets a polite no
// The owner token comes back on first save and lives in that phone's browser.
// If they add (or change) an email, the private edit link goes to it straight away.

import { cleanEmail, cleanFields, FieldError } from "../lib/fields.mjs";
import {
  claimCard,
  clearCard,
  editKey,
  emailOn,
  getCard,
  isOriginalOwner,
  isOwner,
  json,
  parseCard,
  saveCard,
  sendEditLink,
} from "../lib/shared.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const num = parseCard(context.params.code);
  if (!num) return json({ error: "that's not one of our cards" }, 400);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad request" }, 400);
  }
  const token = typeof body.token === "string" ? body.token : null;
  const origin = new URL(req.url).origin;

  try {
    const card = await getCard(num);

    if (body.action === "clear") {
      if (!card || !isOwner(card, token)) return json({ error: "only the owner of this card can clear it" }, 409);
      await clearCard(num);
      return json({ ok: true });
    }

    const fields = cleanFields(body);
    // No email sending set up = don't keep emails at all.
    const email = emailOn() ? cleanEmail(body.email) : null;

    if (!card) {
      const newToken = await claimCard(num, fields, email);
      if (!newToken) return json({ error: "someone just set this card up. is it definitely yours?" }, 409);
      const emailed = email ? await sendEditLink(await getCard(num), origin) : false;
      return json({ ok: true, token: newToken, emailed });
    }

    if (!isOwner(card, token)) {
      return json({ error: "this card's already set up. only its owner can change it." }, 409);
    }
    // A phone that got in through an emailed link has no other way back in,
    // so its card has to keep an email.
    const viaEmailLink = !isOriginalOwner(card, token);
    if (viaEmailLink && !email) {
      return json({ error: "you opened this card from an email link, so keep an email on it. it's how you get back in." }, 400);
    }

    const updated = { ...card, ...fields, email };
    await saveCard(updated);
    // The edit key is tied to the email, so changing the email retires the old
    // link. Hand an email-link phone its new key so it stays the owner.
    const newToken = viaEmailLink ? editKey(updated) : token;
    // New or changed email → send a link there.
    const emailed = email && email !== card.email ? await sendEditLink(updated, origin, { force: true }) : false;
    return json({ ok: true, token: newToken, emailed });
  } catch (err) {
    if (err instanceof FieldError) return json({ error: err.message }, 400);
    console.error("[cards/save]", err);
    return json({ error: "couldn't save that, try again?" }, 500);
  }
};

export const config = { path: "/api/card/:code/save" };
