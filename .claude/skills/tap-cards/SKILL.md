---
name: tap-cards
description: Set up, customise, test and run these event tap-to-share NFC cards. Use when the user says "set up my tap cards", "make it mine", "change the colours / words / fonts", "don't ask for TikTok", "test the cards", "go live", "put it on Netlify", "make my card lists", "write my cards", "I lost my place writing cards", "turn on email edit links", "what do I do on the day", "reset a card", "someone wants their details removed", or asks how any part of the cards works.
---

# Tap cards

This folder is a complete tap-to-share card site for events. Each NFC card holds one web address (`/c/<number>-<code>`). A blank card opens a "make it yours" messenger window; a set-up card shows a backstage pass with that person's name and links; the owner's own phone gets edit tools and a flip-to-QR. There's a type-first page (`/cards`), a big-screen QR page (`/screen`) and an admin page. It runs on Netlify's free plan.

The user is usually not technical. Do the work yourself, explain in plain English, and give them one next step at a time. Talk to them as "you". Keep replies short.

## What to change (and what to leave alone)

Customising only ever means `public/cards.config.json`: event name, year, place, date, the words on the pass and messenger window, which links the form asks for, colours, fonts, email subject. See `docs/CUSTOMISE.md` for every setting. `{event}`, `{year}`, `{place}` and `{date}` in any line fill in from the `event` section.

Don't edit `netlify/`, `public/js/` or `public/css/` unless they ask for something the settings can't do (a new kind of link, a different look). If they do, keep it small, tell them what you changed, and run the browser test below.

## Golden rules

1. **Keys stay in files.** ADMIN_KEY, CARD_SECRET and RESEND_API_KEY live in `.env` (and in Netlify). Never print them in chat and never ask the user to paste them in chat. For links, run `bash tools/links.sh` and tell them to open `my-links.md`.
2. **The address and CARD_SECRET are forever once cards are written.** Each card holds `<site address>/c/<n>-<code>`, and the code is made from CARD_SECRET. Never regenerate, rotate or "tidy up" CARD_SECRET, never delete `.env` without checking Netlify has the same CARD_SECRET, and never make card lists before the site is live at its FINAL address. If they mention a custom domain, it must be set up before any cards are written.
3. **Test on the computer first, deploy rarely.** Netlify's free plan has 300 credits a month and every live deploy uses 15. When the credits run out, Netlify pauses the site and every card stops working. Before every `npm run deploy:live`, say so and count it ("that's live deploy number 3 this month, 45 of your 300 credits"). Batch changes into one deploy. Never deploy on the day of the event unless something is broken.
4. **After any change, run `npm run check`** and fix what it reports before you say it's done.
5. **People's details are personal information.** Never post, upload or share what's on the admin page. The edit-link emails are only for edit links: never suggest adding them to a mailing list.

## First-time setup ("set up my tap cards")

1. Run `npm run setup` (installs, makes ADMIN_KEY and CARD_SECRET in `.env`).
2. Ask these in ONE message (offer to keep the defaults for anything they don't know yet):
   - the event name, year, city and date
   - their colours (2–3), or "keep the hot pink"
   - which links people should add: Instagram, TikTok, LinkedIn, website (any mix)
   - the vibe of the words: playful (the starter words) or something calmer
   - do they want email edit links? (Needs a Resend account and their own domain. Fine to skip: then only the phone that set a card up can edit it.)
3. Fill in `public/cards.config.json`: `event`, `fields`, `look.colours` (`hot` is the main colour and re-tints the whole messenger window; keep `ink` and `night` dark), fonts only if they ask, and `words` in their voice. Keep `pass.title` under 12 letters.
4. `npm run check`, then start `npm run dev` in the background and run `bash tools/links.sh`. Tell them to open `my-links.md` and:
   - open **Test card 1** in Chrome and set it up like a guest would
   - open the same link in a private window to see what someone else sees
   - open **Admin** to see the card they just set up, then **Reset** it
   - open the **Big-screen page**
5. When they're happy, go live (below), then card lists.

## Go live ("put it live")

Follow `docs/GO-LIVE.md`:
1. Free Netlify account; `npx -y netlify-cli@27.14.2 login`.
2. Ask about the final address first (Netlify address or their own domain). `npx -y netlify-cli@27.14.2 sites:create --name <event>-cards`.
3. `npx -y netlify-cli@27.14.2 env:import .env` (copies keys without showing them).
4. `npm run check`, then `npm run deploy:live` (count it).
5. `bash tools/links.sh https://<their-site>.netlify.app` (saves SITE_URL; card lists use it).
6. Have them open the live **Test card 1** on their phone, set it up, then reset it on the live admin page.

## Card lists ("make my card lists", "write my cards")

Only once the site is live at its final address (SITE_URL in `.env`). Ask how many cards they have.
- `npm run cards -- 1 3` (always first: the test list), then `npm run cards -- 4 50`, `npm run cards -- 51 100` and so on in 50s. Files land in `card-lists/`.
- Or tell them to open their LIVE admin page on their iPhone, where **Write your cards** downloads the same lists straight into Files.
- Then walk them through `docs/WRITE-THE-CARDS.md`: NFC Tools by wakdev + its Pro upgrade (Import from CSV needs Pro), then Write → More options → Import from CSV, pick the list, **switch OFF "First row is a header"** (it starts on, the lists have no header, so with it on the first card is skipped: the row count shows one short), tick, tap Write, card flat to the top of the back of the iPhone, test 3 first and tap them (NFC Tools closed), never lock the cards.
- **Lost their place:** have them tap the last card they wrote; the number is in the address (`/c/43-…`). Make a list from the NEXT number: `npm run cards -- 44 100`. Skipping numbers is harmless; writing the same number twice means two people share one card, so when unsure, start a few past it.
- `npm run cards -- --show 27` prints one card's address (handy for checking a card).

## Email edit links ("turn on email")

Follow `docs/GO-LIVE.md` → Turn on email. They paste RESEND_API_KEY and EMAIL_FROM into `.env` themselves. Restart `npm run dev`, test with their own email, then `env:import .env` + a live deploy. The email field only appears on the form once email is on.

## On the day

Point them to `docs/ON-THE-DAY.md`. The short version: a 15-minute set-up moment early in the day, `/screen` on the big screen (F = full screen), the 4 lines to say, tapping tips (iPhone top of the back, Android middle, case off), one or two helpers.

## Admin jobs

- **Reset** a card (wrong person set it up, or someone wants their details removed): admin page → Reset. The card goes back to blank.
- **Hide** a card: people who tap it see "taking a break"; the owner still sees theirs.
- Their admin link is in `my-links.md` (never print the key in chat).

## Checking changes to the code

If you changed anything in `public/js/`, `public/css/` or `netlify/`: run `npm run dev`, then in a browser at phone size set up a test card, open it in a second private window, edit it, flip to QR, clear it, and check the admin page. Reset test cards afterwards.

## Troubleshooting

| What they see | What to do |
|---|---|
| "not one of our cards" | the card was written from a test (`--local`) list, or before the address/CARD_SECRET changed. Rewrite it from a live list |
| "almost ready" on a card | CARD_SECRET is missing: locally run `npm run setup` and restart; live, `env:import .env` + deploy |
| Admin "locked" | wrong key in the link. Run `bash tools/links.sh` and use `my-links.md` |
| Tapping does nothing | NFC Tools is open (close it), wrong spot, thick case, or the card never finished writing (check it in NFC Tools' Read tab) |
| Works locally, not live | they forgot `env:import .env` before deploying |
| No email field on the form | email isn't switched on (both RESEND_API_KEY and EMAIL_FROM, then restart / redeploy) |
| Netlify says the site isn't available | out of credits for the month: upgrade or wait. This is why we deploy rarely |
