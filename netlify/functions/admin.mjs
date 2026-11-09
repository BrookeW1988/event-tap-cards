// /api/admin: everything the admin page does. Needs ADMIN_KEY.
//
//   GET  ?action=list                 every set-up card (with emails), lowest number first
//   GET  ?action=cardlist&from=1&to=3 the card list for NFC Tools: one address per row, no header
//   POST {action:"hide"|"unhide", num}   stop / start showing a card to people who tap it
//   POST {action:"reset", num}           wipe a card back to blank (wrong person set it up,
//                                        or someone asks for their details to be removed)

import {
  adminKeyOk,
  cardAddress,
  clearCard,
  emailOn,
  getCard,
  json,
  listCards,
  MAX_NUMBER,
  passNo,
  saveCard,
  secretSet,
} from "../lib/shared.mjs";

export default async (req) => {
  // 401, not 403: Netlify treats a 403 reply to a POST as "not handled" and looks for a page instead.
  if (!adminKeyOk(req)) return json({ error: "admin key invalid" }, 401);
  if (!secretSet()) return json({ error: "CARD_SECRET isn't set: run npm run setup, then restart" }, 500);
  const url = new URL(req.url);

  if (req.method === "GET") {
    const action = url.searchParams.get("action") ?? "list";

    if (action === "cardlist") {
      const from = Number(url.searchParams.get("from"));
      const to = Number(url.searchParams.get("to"));
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from || to > MAX_NUMBER || to - from >= 500) {
        return json({ error: "pick a range like 1 to 3, or 4 to 50 (up to 500 cards per list)" }, 400);
      }
      const rows = [];
      for (let n = from; n <= to; n++) rows.push(cardAddress(url.origin, n));
      return new Response(rows.join("\n") + "\n", {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="cards-${passNo(from)}-${passNo(to)}.csv"`,
          "cache-control": "no-store",
        },
      });
    }

    const cards = await listCards();
    return json({
      emailOn: emailOn(),
      cards: cards.map((c) => ({
        num: c.num,
        address: cardAddress(url.origin, c.num),
        name: c.name,
        instagram: c.instagram,
        tiktok: c.tiktok,
        linkedin: c.linkedin,
        website: c.website,
        email: c.email,
        hidden: c.hidden,
        claimedAt: c.claimedAt,
      })),
    });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad request" }, 400);
    }
    const num = Number(body.num);
    if (!Number.isInteger(num) || num < 1) return json({ error: "not a card number" }, 400);
    if (body.action === "reset") {
      await clearCard(num);
      return json({ ok: true });
    }
    if (body.action === "hide" || body.action === "unhide") {
      const card = await getCard(num);
      if (!card) return json({ error: "that card isn't set up" }, 400);
      await saveCard({ ...card, hidden: body.action === "hide" });
      return json({ ok: true });
    }
    return json({ error: "unknown action" }, 400);
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/admin" };
