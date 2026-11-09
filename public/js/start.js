// /cards: where the big-screen QR goes during your card set-up moment.
// People type their details here while you (or the MC) explain, then tap
// their card: the card's page (same phone, same browser) finds what they
// typed and fills the form in, so it's one tap of "save". Anyone who taps
// their card first never needs this page.

import { applyLook, filler, loadConfig } from "./look.js";
import { cardStorage, EMPTY_INPUT } from "./storage.js";
import { formHtml, msnScreen, wireForm } from "./ui.js";

const app = document.getElementById("app");
let config;
let fill;
let emailOn = false;
let initial = EMPTY_INPUT;

function formStep() {
  const w = config.words ?? {};
  const submitLabel = fill(w.startButton ?? "Next: tap my card");
  const mine = cardStorage.myCard();
  app.innerHTML = msnScreen(
    config,
    fill,
    formHtml(config, {
      initial,
      intro: fill(w.startIntro),
      group: fill(w.startGroup ?? "Sign in to {event}"),
      notice: mine ? "You've already set up a card on this phone. Tap it to see your pass." : null,
      submitLabel,
      emailOn,
      privacy: fill(w.privacy),
    }),
  );
  wireForm(app, submitLabel, async (input) => {
    cardStorage.setDraft(input);
    initial = input; // so "back to my details" shows what they typed
    tapStep();
    return null;
  });
}

function tapStep() {
  window.scrollTo(0, 0);
  app.innerHTML = msnScreen(
    config,
    fill,
    `<div class="msn-content">
      <p class="msn-group">▾ Almost there</p>
      <h1 class="msn-heading">Now tap your card</h1>
      <ol class="msn-steps">
        <li><b>iPhone:</b> hold your card flat against the <b>top of the back</b> of your phone, near the camera. A pop-up appears at the top of the screen: tap it.</li>
        <li><b>Android:</b> hold it against the <b>middle of the back</b>. If nothing happens, NFC might be off (Settings, then search "NFC").</li>
        <li>Your card opens with your details filled in. Hit save and your backstage pass appears ✦</li>
      </ol>
      <p class="msn-small">Thick case or a wallet on the back? Take it off for a sec. Still nothing? Put your hand up, someone will help.</p>
      <button type="button" class="msn-link" data-back>Back to my details</button>
    </div>`,
  );
  app.querySelector("[data-back]").addEventListener("click", formStep);
}

(async () => {
  try {
    config = await loadConfig();
  } catch {
    config = {};
  }
  fill = filler(config);
  document.title = fill("Set up your {event} card");
  initial = cardStorage.draft() ?? EMPTY_INPUT;
  emailOn = Boolean((await fetch("/api/info").then((r) => r.json()).catch(() => ({}))).emailOn);
  await applyLook(config);
  formStep();
})();
