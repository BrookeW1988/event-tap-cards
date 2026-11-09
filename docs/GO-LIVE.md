# Go live

The easy way: say **"put it live"** to Claude. Here's what that does, so you know what to expect.

## Before you start

- Try it on your computer first (`npm run dev`, then open a test card link from `my-links.md`). Set a card up, open it in a second browser, edit it, clear it.
- Decide on your **final address**. Cards hold the address forever, so it can't change after you write them.
  - **Easiest:** a Netlify address like `bloom-cards.netlify.app`. Free, and it lasts as long as the site does.
  - **Your own domain** (like `cards.yourbrand.com`): add it in Netlify (Domain management) and point your domain at it *before* you write any cards.

## Netlify, step by step

1. Make a free account at [netlify.com](https://www.netlify.com) (sign up with email or Google).
2. Log the folder in: `npx -y netlify-cli@27.14.2 login` (your browser opens to say yes).
3. Make the site: `npx -y netlify-cli@27.14.2 sites:create --name <your-event>-cards` (lowercase, dashes. If the name's taken, add a number).
4. Copy your secret keys to Netlify without showing them: `npx -y netlify-cli@27.14.2 env:import .env`
5. Check, then put it live: `npm run check`, then `npm run deploy:live`. It prints your live address.
6. Save the live address: `bash tools/links.sh https://<your-site>.netlify.app`. Your live links are now in `my-links.md`, and card lists use this address.
7. Test on your phone: open the live **Test card 1** link from `my-links.md`, set it up, then reset it on the live admin page.

Now [write the cards](WRITE-THE-CARDS.md).

## What the free plans allow

- **Netlify free:** 300 credits a month. Each live deploy uses 15. Card taps for a normal event use a small slice. If the credits run out, Netlify pauses the site until next month, and every card stops working until then. So: test on your computer, batch your changes, deploy rarely, and don't redeploy on the day.
- Changing a setting after you're live needs another deploy. Changing keys needs `env:import .env` **and** a deploy.

## Turn on email edit links (optional)

Without email, only the phone that set a card up can edit it. That's fine for most events. With email, owners get a private link that works from any phone, which helps if your cards will be used long after the event.

1. Make a free account at [resend.com](https://resend.com). The free plan sends up to 100 emails a day: plenty, since people only get one when they set up or ask for a fresh link.
2. In Resend, add your domain and add the DNS records it shows wherever your domain lives. Wait for "Verified".
3. Make an API key with sending access. Paste it into `.env` yourself (not in a chat) as `RESEND_API_KEY=`, and add `EMAIL_FROM=Your Event Cards <cards@yourdomain.com>`.
4. Restart `npm run dev` and set up a test card with your own email. The email field only appears once email is switched on.
5. Live: `npx -y netlify-cli@27.14.2 env:import .env`, then `npm run deploy:live`.

## Never change these once cards are written

- **Your site address** (or domain). Every card holds it.
- **`CARD_SECRET`** in `.env` and Netlify. Every card's secret code is made from it.

Lost your `.env`? The keys are still in Netlify: Project configuration → Environment variables. Copy `CARD_SECRET` back into a new `.env` before making any more card lists.
