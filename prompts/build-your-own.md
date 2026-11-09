# Build your own tap cards (the outcome prompt)

Rather build tap cards around the tools you already use (your own website, your CRM, your brand system) than install this kit as it is? Paste this into Claude Code, fill in the brackets, and let it build.

---

I want tap-to-share NFC cards for my event, [EVENT NAME] on [DATE], for about [NUMBER] guests.

How it works:
- Each guest gets a blank NFC card. Each card holds one web address on my site, with a number (so I know where I'm up to when I write them) and a secret code made from a key only my site knows (so nobody can browse other people's cards by changing the number).
- The first time someone taps a blank card, they get a short form: name, plus [Instagram / TikTok / LinkedIn / website / other]. The first save owns the card.
- After that, tapping the card on anyone's phone shows a profile page with their name and links as buttons. Make it look like [describe the look, or: my brand].
- The phone that set the card up can edit or clear it, and can flip the profile to a big QR code for phones that won't tap. [Optional: owners can add a private email and get a link to edit their card from any phone.]
- A page for my big screen with a QR to a "type your details first" page, so people can fill it in while I explain, then one tap of their card and they're done.
- An admin page only I can open: every set-up card, hide and reset buttons, and downloadable card lists (one address per row, no header) for the NFC Tools app's CSV import on iPhone: a test list of 3, then batches of 50.
- Profile pages stay out of Google. Never show anyone's private email on a profile.

My setup:
- Hosting: [Netlify / Vercel / my own host]. Check its free plan allows business use, and what happens if I go over the limits mid-event.
- Email: [none / Resend / my email platform's transactional email].
- [Optional: when someone sets up a card, also add them to [my CRM / a Google Sheet] with a tag.]
- My brand: [colours, fonts, logo file].

Remind me that the cards hold my site's address forever: set up my final domain before I write any cards, and never change the secret key after. Keep all my settings (words, colours, fonts) in one file I can edit. Keep my keys in a .env file, never in the chat. Explain each step in plain English, and test it with two pretend phones before you tell me it's done.
