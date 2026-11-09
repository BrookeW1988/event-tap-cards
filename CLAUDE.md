# Event tap cards

Tap-to-share NFC cards for events: plain HTML + JavaScript in `public/`, a few small server functions in `netlify/functions/`, hosted on Netlify's free plan. No database: cards are stored in Netlify Blobs.

**For anything to do with these cards, use the `tap-cards` skill** (`.claude/skills/tap-cards/SKILL.md`). It covers setup, customising, going live, card lists, writing the cards, email edit links, the day itself and after.

The user is usually not technical: do the work, explain in plain English, one step at a time.

Non-negotiables:
- Never print or ask for keys in chat. Keys live in `.env` and in Netlify. Use `bash tools/links.sh` → `my-links.md` for links.
- Never change CARD_SECRET or the site address once cards are written: every card would stop working. Card lists only once the site is live at its final address.
- Customising = `public/cards.config.json`. Leave the code alone unless asked.
- Every `npm run deploy:live` uses 15 of the 300 free Netlify credits a month. Test with `npm run dev` first and say so before each live deploy.
- Run `npm run check` after changes.
