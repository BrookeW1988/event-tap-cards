# Event tap cards (instructions for Codex)

Tap-to-share NFC cards for events: plain HTML + JavaScript in `public/`, small server functions in `netlify/functions/`, hosted on Netlify's free plan, cards stored in Netlify Blobs. The full playbook (setup, customising, going live, card lists, writing the cards, email, the day, after) is in `.claude/skills/tap-cards/SKILL.md`. Read it and follow it, whichever AI you are.

The user is usually not technical: do the work, explain in plain English, one step at a time.

## Non-negotiables

- Never print or ask for keys in chat. Keys live in `.env` and in Netlify. Use `bash tools/links.sh` → `my-links.md` for links.
- Never change CARD_SECRET or the site address once cards are written: every card would stop working. Make card lists (`npm run cards -- 1 3`) only once the site is live at its final address.
- Customising = `public/cards.config.json`. Leave the code alone unless asked.
- Every `npm run deploy:live` uses 15 of the 300 free Netlify credits a month. Test with `npm run dev` first and say so before each live deploy.
- Run `npm run check` after changes.
