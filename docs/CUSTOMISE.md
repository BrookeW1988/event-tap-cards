# Customise it

Everything lives in one file: `public/cards.config.json`. Change a value, save, refresh the page. The easiest way is to tell Claude what you want ("make it green and gold", "call it the Bloom Breakfast", "don't ask for TikTok").

## Your event (start here)

Fill these four in and the pass, lanyard, seal and messenger window all update, because their words use `{event}`, `{year}`, `{place}` and `{date}`.

| Setting | What it is | Example |
|---|---|---|
| `event.name` | your event's name: page titles, the pass, the lanyard, the messenger window, emails | `Bloom Breakfast` |
| `event.year` | shows on the pass | `2027` |
| `event.place` | the city, shows on the pass | `Perth` |
| `event.date` | short date on the pass's seal | `14.03` |

## The backstage pass

The pass shows these in capitals, however you type them.

| Setting | Where it shows | Starts as |
|---|---|---|
| `pass.title` | the big words at the top (keep it under 12 letters) | `ALL ACCESS` |
| `pass.subtitle` | the small line under the title | `{event} {year} · {place}` |
| `pass.role` | the black pill under the name | `{event} bestie` |
| `pass.seal` | the silver seal, 1–3 short lines | `["✦ {date} ✦", "BESTIE", "VERIFIED"]` |
| `pass.strap` | the words down the lanyard | `{event}` |
| `pass.tapLine` | bottom right of the pass, next to the pass number | `TAP TO SWAP ✦` |
| `pass.backTitle` | the big words on the QR side the owner flips to | `SCAN TO SWAP` |
| `pass.under` | the hint under someone else's pass | `got a card? tap it on their phone to swap back` |

## The messenger window (setting a card up)

| Setting | Where it shows |
|---|---|
| `messenger.title` | the title bar: `{event} Messenger` |
| `messenger.banner` | the strip along the bottom: `{event} ✦ TAP · SWAP · SLAY` |

## Which links people can add

`fields` lists what the form asks for, in order. Name is always asked. Pick from `instagram`, `tiktok`, `linkedin`, `website`.

- A corporate breakfast: `["linkedin", "website"]`
- A creators' meetup: `["instagram", "tiktok", "website"]`

Want something that isn't on the list (Facebook, a podcast, a phone number)? Ask Claude to add a field. It's a small change in `netlify/lib/fields.mjs` and `public/js/ui.js`.

## Colours

Hex codes (`#rrggbb`). Every shade of pink in the messenger window is mixed from `hot`, so changing that one colour re-tints the lot.

| Setting | What it colours |
|---|---|
| `hot` | the main colour: buttons, the messenger window, the name on the pass, the lanyard |
| `soft` | lighter accents: link labels, the lanyard stripes, sparkles |
| `lilac` | the second colour in the pass's shimmer and the display picture |
| `mint` | the third colour in the pass's shimmer |
| `ink` | near-black: the link buttons and text on the pass |
| `night` | the dark background behind the pass |

Tip: keep `ink` and `night` dark. The pass is white with dark text, which is what reads best in a dim room.

## Fonts

Any font from [fonts.google.com](https://fonts.google.com), typed exactly as Google spells it.

| Setting | Used for | Starts as |
|---|---|---|
| `display` | big chunky words (ALL ACCESS, the name) | `Bagel Fat One` |
| `pixel` | small techy labels | `Pixelify Sans` |
| `numbers` | the pass number | `VT323` |
| `body` | link buttons and small print | `Space Grotesk` |

The messenger window itself uses Tahoma or Verdana on purpose, like the real thing.

## The words

`words` holds the main sentences people read while setting a card up:

| Setting | Where |
|---|---|
| `blankIntro` | the italic message at the top of a blank card |
| `blankGroup` | the heading above the form (`New bestie added! (1)`) |
| `blankNudge` | the line under the window |
| `saveButton` | the save button on a blank card |
| `privacy` | the small print above the save button |
| `startIntro`, `startGroup`, `startButton` | the same three on the `/cards` page |
| `signedIn` | the pop-up after saving: "<name> has just signed in." |
| `notACard` | what a wrong address shows |
| `screenTitle` | (optional) the big heading on `/screen` |

Change the tone to suit your event. The starter words are playful and lowercase, which matches the Y2K look.

## Email

| Setting | What it is |
|---|---|
| `email.subject` | the subject of the edit-link email. `{passNo}` = the card number |
| `email.replyTo` | where replies go (blank = the sending address) |

The sending address itself (`EMAIL_FROM`) lives in `.env`, see [Go live](GO-LIVE.md).

## Bigger changes

Want a different look altogether (not a messenger window, not a backstage pass)? That means changing `public/css/cards.css` and `public/js/ui.js`. Ask Claude, test it on your computer, and check it on a real phone before you go live.
