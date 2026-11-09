// POST /api/card/<number>-<code>/link: "is this your card? get an edit link".
// Someone types an email under a pass; if it's the email on this card, a fresh
// private edit link goes to it. The reply is ALWAYS the same, so it never
// gives away whether an email is on a card. One send per card every 2 minutes.

import { cleanEmail } from "../lib/fields.mjs";
import { getCard, json, parseCard, sendEditLink } from "../lib/shared.mjs";

const SAME_REPLY = { ok: true };

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  const num = parseCard(context.params.code);
  if (!num) return json({ error: "that's not one of our cards" }, 400);

  let email = null;
  try {
    email = cleanEmail((await req.json()).email);
  } catch {
    return json(SAME_REPLY);
  }
  if (!email) return json(SAME_REPLY);

  try {
    const card = await getCard(num);
    if (card?.email && card.email === email) await sendEditLink(card, new URL(req.url).origin);
  } catch (err) {
    console.error("[cards/link]", err);
  }
  return json(SAME_REPLY);
};

export const config = { path: "/api/card/:code/link" };
