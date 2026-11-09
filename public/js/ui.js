// The building blocks every card screen is made from:
//   messenger window (the SETUP look): blank-card form, editing, /cards, messages
//   backstage pass (the PROFILE look): what people see when they tap a set-up card
// Each function returns HTML; card.js / start.js put it on the page and wire up the buttons.

import { esc } from "./look.js";
import qrcode from "./vendor/qrcode.mjs";

// ---------- links on a pass ----------

/** The buttons on a pass: `kind` is the small label, `text` is what's on the button. */
export function profileLinks(card) {
  const links = [];
  if (card.instagram) links.push({ kind: "instagram", text: `@${card.instagram}`, href: `https://www.instagram.com/${card.instagram}/` });
  if (card.tiktok) links.push({ kind: "tiktok", text: `@${card.tiktok}`, href: `https://www.tiktok.com/@${card.tiktok}` });
  if (card.linkedin) {
    let text = "linkedin";
    try { text = new URL(card.linkedin).pathname.split("/").filter(Boolean).pop() ?? text; } catch { /* keep default */ }
    links.push({ kind: "linkedin", text, href: card.linkedin });
  }
  if (card.website) {
    let text = card.website;
    try { text = new URL(card.website).hostname.replace(/^www\./, ""); } catch { /* show as typed */ }
    links.push({ kind: "website", text, href: card.website });
  }
  return links;
}

// ---------- messenger window ----------

/** Two little buddies, in the spirit of the old messenger contact icons (our own drawing). */
export function buddyIcon(size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="15.5" cy="7" r="3.6" fill="var(--lilac)" stroke="#fff" stroke-width="1.2"/>
    <path d="M9.5 20c0-4 2.7-6.6 6-6.6s6 2.6 6 6.6z" fill="var(--lilac)" stroke="#fff" stroke-width="1.2"/>
    <circle cx="8.5" cy="8.5" r="3.8" fill="var(--hot)" stroke="#fff" stroke-width="1.2"/>
    <path d="M2 21.5c0-4.2 2.9-7 6.5-7s6.5 2.8 6.5 7z" fill="var(--hot)" stroke="#fff" stroke-width="1.2"/>
  </svg>`;
}

export function msnScreen(config, fill, inner, nudge = "") {
  return `<main class="msn-page xp">
    <span aria-hidden="true" class="spark" style="top:10px;left:22px;font-size:16px">✦</span>
    <span aria-hidden="true" class="spark" style="top:140px;right:6px;font-size:20px;animation-delay:.8s">✦</span>
    <span aria-hidden="true" class="spark" style="bottom:40px;left:26px;font-size:14px;animation-delay:1.6s">✦</span>
    <div class="msn-inner">
      <div class="msn-window">
        <div class="msn-bar">
          ${buddyIcon()}
          <span class="msn-bar-title">${esc(fill(config.messenger?.title ?? "{event} Messenger"))}</span>
          <span aria-hidden="true" class="msn-btns"><span>_</span><span>□</span><span>✕</span></span>
        </div>
        <div aria-hidden="true" class="msn-menu"><span>File</span><span>Contacts</span><span>Actions</span><span>Tools</span><span>Help</span></div>
        ${inner}
        <p aria-hidden="true" class="msn-banner pixel">${esc(fill(config.messenger?.banner ?? ""))}</p>
      </div>
      ${nudge ? `<p class="msn-nudge">${esc(nudge)}</p>` : ""}
    </div>
  </main>`;
}

/** Display picture + name + (Online) + italic personal message. Name + initial fill in as they type. */
export function msnWho(name, message) {
  const shown = String(name ?? "").trim();
  return `<div class="msn-who">
    <div class="msn-avatar"><span class="display" data-avatar>${esc(shown ? shown[0].toUpperCase() : "?")}</span></div>
    <div class="msn-who-text">
      <p class="msn-name" data-who>${esc(shown || "Your name")}</p>
      <p class="msn-status"><span class="msn-dot"></span>(Online) ▾</p>
      <p class="msn-psm">${esc(message)}</p>
    </div>
  </div>`;
}

/** A "something's not right" screen, in the messenger window. `extra` = optional button HTML. */
export function messageScreen(config, fill, title, body, extra = "") {
  return msnScreen(
    config,
    fill,
    `<div class="msn-content">
      <h1 class="msn-heading">${esc(title)}</h1>
      <p class="msn-text">${esc(body)}</p>
      ${extra}
    </div>`,
  );
}

// ---------- the "make it yours" form ----------

const FIELD_INFO = {
  name: { label: "Your name", placeholder: "first name is fine", auto: "given-name", mode: "text" },
  instagram: { label: "Instagram", placeholder: "@yourhandle", auto: "off", mode: "text" },
  tiktok: { label: "TikTok", placeholder: "@yourhandle", auto: "off", mode: "text" },
  linkedin: { label: "LinkedIn", placeholder: "linkedin.com/in/you", auto: "off", mode: "url" },
  website: { label: "Website", placeholder: "yourbusiness.com", auto: "off", mode: "url" },
  email: { label: "Email (private, optional)", placeholder: "you@yourbusiness.com", auto: "email", mode: "email" },
};

function formFields(config, emailOn) {
  const links = (config.fields ?? ["instagram", "tiktok", "linkedin", "website"]).filter((f) => FIELD_INFO[f] && f !== "email" && f !== "name");
  return ["name", ...links, ...(emailOn ? ["email"] : [])];
}

/**
 * The form, shared by a blank card, editing, and the /cards page. It only
 * collects; the page decides what saving means. Wire it with wireForm().
 */
export function formHtml(config, { initial, intro, group, notice, submitLabel, emailOn, privacy }) {
  const fields = formFields(config, emailOn)
    .map((key) => {
      const f = FIELD_INFO[key];
      return `<label>
        <span class="msn-label">${esc(f.label)}${key === "name" ? " *" : ""}</span>
        <input class="msn-input" name="${key}" value="${esc(initial[key] ?? "")}" placeholder="${esc(f.placeholder)}"
          type="${key === "email" ? "email" : "text"}" inputmode="${f.mode}" autocomplete="${f.auto}"
          autocapitalize="${key === "name" ? "words" : "none"}" autocorrect="off" spellcheck="false"
          maxlength="${key === "name" ? 60 : 200}">
        ${
          key === "email"
            ? `<span class="msn-small under">We'll email you a private link so you can edit your card later from any phone. That's all it's used for, and it never shows on your pass.</span>`
            : ""
        }
      </label>`;
    })
    .join("");
  return `${msnWho(initial.name, intro)}
    <div class="msn-content">
      ${notice ? `<p class="msn-notice">${esc(notice)}</p>` : ""}
      <p class="msn-group">▾ ${esc(group)}</p>
      <form class="msn-form" novalidate>
        ${fields}
        <p class="msn-small">${esc(privacy)}</p>
        <p class="msn-error" data-error hidden></p>
        <button type="submit" class="msn-button" data-submit>${esc(submitLabel)}</button>
      </form>
    </div>`;
}

/** Live name preview + submit. onSubmit(input) returns an error message, or null when it worked. */
export function wireForm(root, submitLabel, onSubmit) {
  const form = root.querySelector("form.msn-form");
  const who = root.querySelector("[data-who]");
  const avatar = root.querySelector("[data-avatar]");
  const errorEl = root.querySelector("[data-error]");
  const button = root.querySelector("[data-submit]");
  const read = () => Object.fromEntries([...form.querySelectorAll("input")].map((i) => [i.name, i.value]));

  form.querySelector('input[name="name"]').addEventListener("input", (e) => {
    const shown = e.target.value.trim();
    who.textContent = shown || "Your name";
    avatar.textContent = shown ? shown[0].toUpperCase() : "?";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = read();
    const showError = (msg) => {
      errorEl.textContent = msg ?? "";
      errorEl.hidden = !msg;
    };
    if (!input.name.trim()) return showError("pop your name in first");
    showError(null);
    button.disabled = true;
    button.textContent = "Saving…";
    const err = await onSubmit(input);
    // The page may have moved on to a new screen; only touch the form if it's still here.
    if (form.isConnected) {
      button.disabled = false;
      button.textContent = submitLabel;
      showError(err);
    }
  });
}

// ---------- the backstage pass ----------

// Long event names on the lanyard drop a size (and the strap grows to fit).
function strapStyle(text) {
  if (text.length <= 11) return "";
  if (text.length <= 18) return "font-size:10px;letter-spacing:0.12em";
  return "font-size:9px;letter-spacing:0.08em";
}

// Long names drop a size so they stay on one or two lines.
function nameSize(name) {
  if (name.length <= 8) return 52;
  if (name.length <= 12) return 42;
  if (name.length <= 18) return 34;
  return 28;
}

const FLIP_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>`;

export function qrSvg(url) {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  return qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true });
}

/**
 * The pass. `qr` (owners only) = { url, flipped }: the pass flips over to a
 * big QR on its back, for phones that won't tap. `below` = HTML under the pass
 * (owner tools, or the edit-link request).
 */
export function passHtml(config, fill, { num, card, under = "", qr = null, below = "", overlay = "" }) {
  const p = config.pass ?? {};
  const links = profileLinks(card);
  const passNo = `PASS NO. ${String(num).padStart(3, "0")}`;
  const seal = (p.seal ?? []).map((line) => esc(fill(line))).join("<br>");
  const front = `<div class="pass${qr ? " face" : ""}">
    <div class="pass-in">
      <div class="pass-head">
        <div aria-hidden="true" class="pass-hole"></div>
        <p class="pass-access display">${esc(fill(p.title ?? "ALL ACCESS"))}</p>
        <p class="pass-sub pixel">${esc(fill(p.subtitle ?? ""))}</p>
      </div>
      <div class="pass-main">
        ${seal ? `<div aria-hidden="true" class="pass-seal pixel">${seal}</div>` : ""}
        <p class="pass-label pixel">NAME</p>
        <h1 class="pass-name display" style="font-size:${nameSize(card.name)}px">${esc(card.name)}</h1>
        ${p.role ? `<span class="pass-role pixel">${esc(fill(p.role))}</span>` : ""}
        ${
          links.length
            ? `<div class="pass-links">${links
                .map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener noreferrer" class="pass-pill"><b>${esc(l.text)}</b><i class="pixel">${l.kind.toUpperCase()}</i></a>`)
                .join("")}</div>`
            : `<p class="pass-empty body">no links added yet.</p>`
        }
        <div aria-hidden="true" class="pass-barcode"></div>
        <div class="pass-num numbers"><span>${passNo}</span><span>${esc(fill(p.tapLine ?? "TAP TO SWAP ✦"))}</span></div>
      </div>
    </div>
  </div>`;

  // The back is always in the page (just turned away), so it's ready the moment the pass flips.
  const back = qr
    ? `<div class="pass face face-back">
        <div class="pass-in">
          <div class="pass-head">
            <div aria-hidden="true" class="pass-hole"></div>
            <p class="pass-access display">${esc(fill(p.backTitle ?? "SCAN TO SWAP"))}</p>
            <p class="pass-sub pixel">${esc(fill(p.subtitle ?? ""))}</p>
          </div>
          <div class="back-main">
            <div class="back-qr" role="img" aria-label="QR code for ${esc(card.name)}'s card">${qrSvg(qr.url)}</div>
            <p class="back-name display">${esc(card.name)}</p>
            <p class="back-hint">phone won't tap? open your camera and scan ✦</p>
            <div class="pass-num numbers back-num"><span>${passNo}</span><span>${esc(fill(p.title ?? "ALL ACCESS"))} ✦</span></div>
          </div>
        </div>
      </div>`
    : "";

  return `<main class="pass-page body">
    <span aria-hidden="true" class="spark" style="top:60px;left:36px;font-size:14px">✦</span>
    <span aria-hidden="true" class="spark" style="top:96px;right:44px;font-size:20px;animation-delay:.9s">✦</span>
    <span aria-hidden="true" class="spark" style="top:520px;left:14px;font-size:12px;animation-delay:1.7s">✦</span>
    <span aria-hidden="true" class="spark" style="top:640px;right:20px;font-size:10px;animation-delay:.4s">✦</span>
    <div class="pass-inner">
      <div aria-hidden="true" class="strap"><span class="pixel" style="${strapStyle(fill(p.strap ?? ""))}">${esc(fill(p.strap ?? ""))}</span></div>
      <div aria-hidden="true" class="clip"></div>
      <div class="pass-swing${qr?.flipped ? " steady" : ""}" data-swing>
        ${qr ? `<div class="flip"><div class="flip-card${qr.flipped ? " flipped" : ""}" data-flip>${front}${back}</div></div>` : front}
      </div>
      ${under ? `<p class="pass-under">${esc(fill(under))}</p>` : ""}
      ${below}
    </div>
    ${
      qr
        ? `<button type="button" class="flip-btn display" data-flip-btn aria-pressed="${qr.flipped}">${FLIP_ICON}<span>${qr.flipped ? "back to my pass" : "show my QR"}</span></button>`
        : ""
    }
    ${overlay}
  </main>`;
}

/** The "<name> has just signed in." pop-up. Tapping it closes it. */
export function toastHtml(config, fill, name) {
  return `<div role="status" class="toast xp" data-toast>
    <div class="toast-bar">${esc(fill(config.messenger?.title ?? "{event} Messenger"))}</div>
    <div class="toast-body">${buddyIcon(30)}<span><b>${esc(name)}</b> ${esc(config.words?.signedIn ?? "has just signed in.")}</span></div>
  </div>`;
}

/** "br***@gmail.com": enough to recognise your own email, not enough to read someone else's. */
export function maskEmail(email) {
  const [user, domain = ""] = String(email).split("@");
  return `${user.slice(0, 2)}***@${domain}`;
}
