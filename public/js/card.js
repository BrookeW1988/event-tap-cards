// What opens when someone taps a card (/c/<number>-<code>). One page for every
// case: see the list of states in netlify/functions/card.mjs.
// Setting a card up looks like a messenger window; a set-up card shows as a
// backstage pass. The phone that set a card up (or opened its emailed edit
// link) gets owner tools under the pass, and the pass flips over to a QR.

import { applyLook, esc, filler, loadConfig } from "./look.js";
import { cardStorage, EMPTY_INPUT } from "./storage.js";
import { formHtml, maskEmail, messageScreen, msnScreen, passHtml, toastHtml, wireForm } from "./ui.js";

const app = document.getElementById("app");
const code = decodeURIComponent(location.pathname.replace(/^\/c\//, "").replace(/\/+$/, ""));
const num = Number(/^(\d{1,5})-[a-z0-9]{6}$/i.exec(code)?.[1] ?? 0);

// Emailed edit links arrive as /c/<card>?key=…: read once, then wiped from the
// address bar so it isn't left on screen or in screenshots.
let urlKey = new URLSearchParams(location.search).get("key");
if (urlKey) history.replaceState(null, "", `/c/${code}`);

let config;
let fill;
const ui = {
  view: { state: "loading" },
  editing: false,
  showQr: false,
  confirmClear: false,
  draft: null,
  signedIn: false,
  keyBad: false,
  linkSent: false,
  emailOn: false,
  recoverOpen: false,
  recoverSent: false,
};
let lastScreen = "";
let toastTimer = null;

const toInput = (c, email) => ({
  name: c.name,
  instagram: c.instagram ? `@${c.instagram}` : "",
  tiktok: c.tiktok ? `@${c.tiktok}` : "",
  linkedin: c.linkedin ?? "",
  website: c.website ?? "",
  email: email ?? "",
});

async function post(path, body) {
  try {
    const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return await res.json();
  } catch {
    return { error: "no signal? try again in a sec" };
  }
}

const api = (suffix = "") => `/api/card/${encodeURIComponent(code)}${suffix}`;

async function load() {
  if (!num) {
    ui.view = { state: "invalid" };
    return render();
  }
  const key = urlKey;
  urlKey = null; // only ever sent once
  const data = await post(api(), { token: cardStorage.ownerToken(num), key });
  // A good edit link makes this phone an owner from now on.
  if (key && data.keyOk) cardStorage.setOwner(num, key);
  if (data.keyBad) {
    ui.keyBad = true;
    ui.recoverOpen = true;
  }
  ui.emailOn = Boolean(data.emailOn);
  if (data.state === "mine" && data.card) ui.view = { state: "mine", card: data.card, hidden: Boolean(data.hidden), email: data.email ?? null };
  else if (data.state === "profile" && data.card) ui.view = { state: "profile", card: data.card };
  else if (data.state === "blank") {
    ui.draft = cardStorage.draft();
    ui.view = { state: "blank" };
  } else if (["invalid", "hidden", "setup"].includes(data.state)) ui.view = { state: data.state };
  else ui.view = { state: "error" };
  render();
}

async function submit(input) {
  const res = await post(api("/save"), { ...input, token: cardStorage.ownerToken(num) });
  if (!res.ok) return res.error ?? "couldn't save that, try again?";
  if (res.token) cardStorage.setOwner(num, res.token);
  cardStorage.setDraft(null);
  ui.editing = false;
  ui.signedIn = true;
  ui.linkSent = Boolean(res.emailed);
  await load();
  return null;
}

async function clearMyCard() {
  const res = await post(api("/save"), { action: "clear", token: cardStorage.ownerToken(num) });
  if (res.ok) {
    cardStorage.forgetOwner(num);
    Object.assign(ui, { confirmClear: false, showQr: false, signedIn: false });
    await load();
  }
}

// ---------- screens ----------

function formScreen() {
  const isNew = ui.view.state === "blank";
  const w = config.words ?? {};
  const submitLabel = isNew ? w.saveButton ?? "Save my card" : "Save changes";
  const notice =
    isNew && ui.keyBad
      ? "That edit link is from before this card was reset, so it's blank again. Set it up fresh."
      : isNew && ui.draft
        ? "We kept what you typed earlier. Check it, then hit save."
        : null;
  const form = formHtml(config, {
    initial: isNew ? ui.draft ?? EMPTY_INPUT : toInput(ui.view.card, ui.view.email),
    intro: isNew ? fill(w.blankIntro) : "♪ change anything you like, then save.",
    group: isNew ? fill(w.blankGroup) : "Edit your details",
    notice,
    submitLabel,
    emailOn: ui.emailOn,
    privacy: fill(w.privacy),
  });
  const cancel = isNew ? "" : `<button type="button" class="msn-link cancel" data-cancel>Cancel</button>`;
  app.innerHTML = msnScreen(config, fill, form + cancel, isNew ? fill(w.blankNudge) : "");
  wireForm(app, submitLabel, submit);
  app.querySelector("[data-cancel]")?.addEventListener("click", () => {
    ui.editing = false;
    render();
  });
}

function recoverHtml() {
  if (!ui.emailOn) return "";
  if (!ui.recoverOpen) return `<button type="button" class="text-link pixel gap" data-recover-open>is this your card? get an edit link</button>`;
  return `<section class="recover">
    ${ui.keyBad ? `<p class="owner-note">that edit link has expired. pop your email in for a fresh one.</p>` : ""}
    ${
      ui.recoverSent
        ? `<p class="recover-msg">if that's the email on this card, a fresh edit link is on its way. check your inbox (and junk).</p>`
        : `<form class="recover-form" data-recover-form>
            <label class="recover-msg" for="edit-email">the email you used when you set this card up:</label>
            <input id="edit-email" type="email" inputmode="email" autocomplete="email" placeholder="you@yourbusiness.com" class="recover-input">
            <button type="submit" class="btn-hot display">email me a link</button>
          </form>`
    }
  </section>`;
}

function ownerHtml() {
  const v = ui.view;
  let emailLine;
  if (!ui.emailOn) emailLine = `✦ only this phone can edit your card.`;
  else if (v.email && ui.linkSent) emailLine = `✦ edit link sent to ${esc(maskEmail(v.email))}. keep that email: it gets you back in from any phone.`;
  else if (v.email) emailLine = `✦ your edit link goes to ${esc(maskEmail(v.email))}. <button type="button" class="inline-link" data-resend>send it again</button>`;
  else
    emailLine = `✦ no email on this card yet, so only this phone can edit it. <button type="button" class="inline-link" data-edit>add your email</button> to get a private edit link for any phone.`;

  return `<section class="owner">
    <p class="owner-title pixel">✦ this is your pass</p>
    ${v.hidden ? `<p class="owner-note">heads up: the event team has hidden this card, so other people can't see it right now.</p>` : ""}
    <div class="owner-buttons">
      <button type="button" class="btn-outline display" data-edit>edit</button>
      <p class="owner-email">${emailLine}</p>
      ${
        ui.confirmClear
          ? `<div class="confirm"><p>this wipes your details and makes the card blank again. sure?</p>
              <div><button type="button" class="text-link pixel hot" data-clear-yes>yes, clear it</button>
              <button type="button" class="text-link pixel" data-clear-no>keep it</button></div></div>`
          : `<button type="button" class="text-link pixel" data-clear>clear my card</button>`
      }
    </div>
  </section>`;
}

function passScreen() {
  const v = ui.view;
  const mine = v.state === "mine";
  app.innerHTML = passHtml(config, fill, {
    num,
    card: v.card,
    under: mine ? "" : config.pass?.under ?? "",
    qr: mine ? { url: `${location.origin}/c/${code}`, flipped: ui.showQr } : null,
    below: mine ? ownerHtml() : recoverHtml(),
    overlay: mine && ui.signedIn ? toastHtml(config, fill, v.card.name) : "",
  });
  wirePass();
}

function wirePass() {
  const $ = (sel) => app.querySelector(sel);
  // Owner tools
  app.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => {
      ui.editing = true;
      render();
    }),
  );
  $("[data-clear]")?.addEventListener("click", () => {
    ui.confirmClear = true;
    passScreen();
  });
  $("[data-clear-no]")?.addEventListener("click", () => {
    ui.confirmClear = false;
    passScreen();
  });
  $("[data-clear-yes]")?.addEventListener("click", () => void clearMyCard());
  $("[data-resend]")?.addEventListener("click", async () => {
    await post(api("/link"), { email: ui.view.email });
    ui.linkSent = true;
    passScreen();
  });

  // The flip: toggled in place (not re-drawn), so the turn animates.
  $("[data-flip-btn]")?.addEventListener("click", () => {
    ui.showQr = !ui.showQr;
    if (ui.showQr) window.scrollTo({ top: 0, behavior: "smooth" }); // the QR sits near the top
    hideToast(); // the pop-up would sit over the QR side
    $("[data-flip]").classList.toggle("flipped", ui.showQr);
    $("[data-swing]").classList.toggle("steady", ui.showQr); // held still while the QR shows, easy to scan
    const btn = $("[data-flip-btn]");
    btn.setAttribute("aria-pressed", String(ui.showQr));
    btn.querySelector("span").textContent = ui.showQr ? "back to my pass" : "show my QR";
  });

  // "<name> has just signed in." closes itself after 6s, or on tap.
  const toast = $("[data-toast]");
  if (toast) {
    toast.addEventListener("click", hideToast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 6000);
  }

  // Someone else's card: "is this your card? get an edit link"
  $("[data-recover-open]")?.addEventListener("click", () => {
    ui.recoverOpen = true;
    passScreen();
    app.querySelector("#edit-email")?.focus();
  });
  $("[data-recover-form]")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = app.querySelector("#edit-email").value.trim();
    if (!email) return;
    e.target.querySelector("button").disabled = true;
    await post(api("/link"), { email });
    ui.recoverSent = true;
    passScreen();
  });
}

function hideToast() {
  ui.signedIn = false;
  app.querySelector("[data-toast]")?.remove();
}

function render() {
  const s = ui.view.state;
  // Swapping between the form and the pass starts at the top, so you see the pass.
  const screen = `${s}:${ui.editing}`;
  if (screen !== lastScreen) window.scrollTo(0, 0);
  lastScreen = screen;

  if (s === "loading") {
    app.innerHTML = `<main class="loading"><p>✦ loading ✦</p></main>`;
  } else if (s === "error") {
    app.innerHTML = messageScreen(config, fill, "couldn't load", "probably the signal. give it another go.", `<button type="button" class="msn-button top" data-retry>try again</button>`);
    app.querySelector("[data-retry]").addEventListener("click", () => {
      ui.view = { state: "loading" };
      render();
      void load();
    });
  } else if (s === "invalid") {
    app.innerHTML = messageScreen(config, fill, "not one of our cards", fill(config.words?.notACard));
  } else if (s === "hidden") {
    app.innerHTML = messageScreen(config, fill, "taking a break", "this card isn't sharing anything right now.");
  } else if (s === "setup") {
    app.innerHTML = messageScreen(config, fill, "almost ready", "this cards site needs its secret key first. (if this is your site: run npm run setup, then restart.)");
  } else if (s === "blank" || (s === "mine" && ui.editing)) {
    formScreen();
  } else {
    passScreen();
  }
}

// ---------- start ----------

(async () => {
  try {
    config = await loadConfig();
  } catch {
    config = {};
  }
  fill = filler(config);
  document.title = fill("{event} card");
  render();
  await applyLook(config);
  await load();
})();
