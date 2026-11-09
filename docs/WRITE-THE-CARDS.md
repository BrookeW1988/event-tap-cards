# Write the cards

Each card holds one web address. You write a whole batch from a list on your iPhone: the app writes row 1 onto the first card you hold up, row 2 onto the next, and so on.

## Before you start

⚠ **Your site must be live, at its final address.** The address goes onto the card for good. If you want your own domain (like `cards.yourbrand.com`), set it up in Netlify first and tell Claude, so your card lists use it. A `your-site.netlify.app` address is fine too: it lasts as long as the site does.

⚠ **Never change `CARD_SECRET` after this.** The secret code on every card is made from it. Change it and every card you've written stops working.

## 1. Get the cards

- **NFC cards, NTAG215.** NTAG213 and NTAG216 work too. Rewritable is best: if you make a mistake, you write over it.
- **How many:** one per guest, plus 10–20% spare for duds, double-ups and walk-ins.
- **Colour:** anything. Plain black or white looks smart. You can add a sticker with your logo, or leave them plain (the setup moment tells people what they're for).
- Tip: tap one card from the pack on your phone before you buy 300. A blank card does nothing, which is normal. You're checking it's NFC at all.

## 2. Get the app

1. On your iPhone (iPhone 7 or newer), install **NFC Tools** by wakdev from the App Store. It's free.
2. In the app, buy the **Pro** upgrade (A$5.99 one-off in Australia). You need it for **Import from CSV**, the feature that writes a list of addresses one card at a time.

NFC Tools is on Android too. These steps describe the iPhone.

## 3. Get your card lists

Card lists are plain files with one address per row and no heading. Each row becomes one card.

**Easiest: straight onto your iPhone.** Open your **live** admin page on the iPhone (the link is in `my-links.md`), find **Write your cards**, set how many cards you have, then tap a list. Save it to Files.

**Or from Claude.** Say **"make my card lists for 300 cards"**. They land in the `card-lists` folder. AirDrop them to your iPhone, or save them to iCloud Drive and open them in the Files app.

The lists come in:
- **test 1–3**: always first
- **4–50, 51–100, 101–150 …**: batches of 50, so you always know where you're up to

## 4. Write the test cards first

1. In NFC Tools, tap **Write**, then **More options**, then **Import from CSV**, and pick the **test 1–3** list.
   - ⚠ Switch **off** "First row is a header". It starts switched on, and the lists have no header row, so with it on your first card gets skipped. You'll see the count go up by one (46 rows becomes 47 on a 4–50 list).
   - Tick, and the Write screen shows row 1 ("1 / 3" on the test list).
   - Tap **Write** to start each card.
2. Hold a blank card flat against the **top of the back** of the iPhone, near the camera. Hold still for a second or two until it says it's written. The app moves on to the next row.
3. Write all 3.
4. Close NFC Tools, then tap card 1 on your phone again. You should see the pink "New bestie added!" window. That means it worked.
5. **Don't save** on a test card. (If you do, reset it on the admin page.)

Nothing happens when you tap? Check the card in NFC Tools' **Read** tab. Empty = the write didn't finish: write it again and hold still longer. Take the phone case off if it's thick or has a wallet on the back.

## 5. Write the rest, in batches

Pick the **4–50** list, write those, then **51–100**, and so on. Keep each batch in its own pile or box with the numbers on a sticky note.

**Never tick "lock" or "make read-only".** A locked card can never be changed again.

## When the app loses your place

It happens: the app closes, the phone locks, or the import is gone when you come back.

1. Tap the **last card you wrote** on your phone (or read it in NFC Tools). The number is in the address: `/c/43-…` = card 43.
2. Make a new list that starts **after** it: on the admin page use **Or any range** (from 44 to 100), or ask Claude: **"make a card list from 44 to 100"**.
3. Carry on from there.

**Skipping numbers is fine. Repeating a number is not:** two cards with the same number are the same card, so two people would end up sharing one pass. When you're not sure, start a few numbers past where you think you were.

## Checking a card

Tap it on your phone. Blank cards show the set-up window, set-up cards show a pass. "Not one of our cards" means the address on it is wrong (usually a card written from a test list, or before your address changed): write it again from the right list.
