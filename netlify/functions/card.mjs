// POST /api/card/<number>-<code>: what a tapped card should show.
// POST (not GET) so the owner token travels in the body and nothing gets cached.
//   invalid → not one of your cards (wrong code, or a typo)
//   blank   → nobody's set it up yet → the "make it yours" form
//   mine    → this phone set it up, or opened the emailed edit link →
//             the pass + edit / show my QR / clear (+ their private email)
//   profile → someone else's card → their name + links
//   hidden  → you hid it on the admin page

import { emailOn, getCard, isOwner, json, parseCard, publicFields, secretSet } from "../lib/shared.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
  if (!secretSet()) return json({ state: "setup", error: "CARD_SECRET isn't set: run npm run setup" }, 500);

  const num = parseCard(context.params.code);
  // 200, not 404: a "not found" reply to a POST makes Netlify go looking for a page instead.
  if (!num) return json({ state: "invalid" });

  // token = what this phone saved when it set the card up (or adopted from an
  // edit link); key = an edit key straight off an emailed link (?key=).
  let token = null;
  let key = null;
  try {
    const body = await req.json();
    token = typeof body.token === "string" ? body.token : null;
    key = typeof body.key === "string" ? body.key : null;
  } catch {
    /* no body is fine: a stranger tapping the card */
  }

  try {
    const card = await getCard(num);
    const base = { num, emailOn: emailOn() };
    if (!card) return json({ ...base, state: "blank", keyBad: Boolean(key) });

    const keyOk = Boolean(key) && isOwner(card, key);
    if (keyOk || isOwner(card, token)) {
      // keyOk tells the phone to keep the edit key, so it stays the owner.
      return json({ ...base, state: "mine", card: publicFields(card), hidden: card.hidden, email: card.email, keyOk });
    }
    const keyBad = Boolean(key);
    if (card.hidden) return json({ ...base, state: "hidden", keyBad });
    return json({ ...base, state: "profile", card: publicFields(card), keyBad });
  } catch (err) {
    console.error("[cards/card]", err);
    return json({ error: "couldn't load this card" }, 500);
  }
};

export const config = { path: "/api/card/:code" };
