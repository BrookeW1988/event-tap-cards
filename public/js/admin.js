// Your admin page (/admin#key=YOUR_ADMIN_KEY): who's set up a card, hide and
// reset buttons, the card lists for writing your cards, and the big-screen QR.

import { esc, filler, keyFromLink, loadConfig } from "./look.js";
import { profileLinks, qrSvg } from "./ui.js";

const app = document.getElementById("app");
const key = keyFromLink();
const api = (path, opts = {}) => fetch(path, { ...opts, headers: { ...(opts.headers ?? {}), "x-admin-key": key } });
const isTestSite = ["localhost", "127.0.0.1"].includes(location.hostname);

let config;
let howMany = 300;

// The lists NFC Tools imports: a 3-card test list, then batches of 50 (4–50, 51–100, …).
function batches(total) {
  const lists = [[1, Math.min(3, total)]];
  if (total >= 4) lists.push([4, Math.min(50, total)]);
  for (let from = 51; from <= total; from += 50) lists.push([from, Math.min(from + 49, total)]);
  return lists;
}

async function download(from, to, button) {
  button.disabled = true;
  try {
    const res = await api(`/api/admin?action=cardlist&from=${from}&to=${to}`);
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cards-${String(from).padStart(3, "0")}-${String(to).padStart(3, "0")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  } catch (err) {
    alertBox(`Couldn't make that list: ${err.message}`);
  } finally {
    button.disabled = false;
  }
}

function alertBox(message) {
  const el = document.getElementById("note");
  if (el) {
    el.textContent = message;
    el.hidden = false;
  }
}

async function render() {
  const res = await api("/api/admin?action=list");
  if (res.status === 401) {
    app.innerHTML = `
      <h1>Admin locked</h1>
      <p class="muted" style="margin-top:12px;max-width:560px">The key in this link isn't right. Your admin link is
      <code>/admin#key=</code> followed by your ADMIN_KEY. It's in the <code>.env</code> file in your cards folder,
      or in Netlify under Project configuration → Environment variables. Or just ask Claude: "what's my admin link?"</p>`;
    return;
  }
  if (!res.ok) {
    const msg = (await res.json().catch(() => ({}))).error ?? `error ${res.status}`;
    app.innerHTML = `<h1>Something's not set up</h1><p class="muted" style="margin-top:12px">${esc(msg)}</p>`;
    return;
  }
  const { cards, emailOn } = await res.json();
  const fill = filler(config);
  const hidden = cards.filter((c) => c.hidden).length;
  const startUrl = `${location.origin}/cards`;

  app.innerHTML = `
    <h1>${esc(fill("{event}"))} · tap cards</h1>
    <p class="muted">${cards.length} set up · ${hidden} hidden · edit-link emails are <strong>${emailOn ? "ON" : "OFF"}</strong></p>
    <p class="warn" id="note" hidden></p>

    <section class="grid">
      <div class="box">
        <h2>Write your cards</h2>
        ${
          isTestSite
            ? `<p class="warn"><strong>This is your test site.</strong> Card lists made here point at your computer, so cards
               written from them won't work at the event. Make your lists on your <strong>live</strong> admin page.</p>`
            : ""
        }
        <ol>
          <li>On an iPhone, install <strong>NFC Tools</strong> (by wakdev) and buy the <strong>Pro</strong> upgrade in the app ($5.99, once). The CSV import needs Pro.</li>
          <li>Open this admin page <strong>on that iPhone</strong> and tap a list below. Save it to Files.</li>
          <li>In NFC Tools: <strong>Write</strong> → <strong>More options</strong> → <strong>Import from CSV</strong>, and pick the list. Switch <strong>off</strong> "First row is a header" (the lists have no header, so with it on your first card is skipped). Tick, tap <strong>Write</strong>, then hold each blank card flat to the top of the back of the iPhone: it writes the next address onto each card. Don't lock the cards.</li>
          <li>Do the <strong>test list (cards 1–3)</strong> first. Tap each one on your phone: you should see the blank set-up window. Don't save on a test card (or reset it below after).</li>
          <li>Then batches of 50, so you always know where you're up to. Lost your place? Tap the last card you wrote to see its number, then start a new list from the next one. Skipping numbers is fine. <strong>Never write the same number twice</strong>: two people would share one card.</li>
        </ol>
        <div class="row">
          <label class="small">How many cards? <input type="number" id="howMany" min="3" max="5000" value="${howMany}"></label>
        </div>
        <div class="row" id="lists">
          ${batches(howMany)
            .map(([from, to]) => `<button class="btn ghost" type="button" data-from="${from}" data-to="${to}">${from === 1 ? "test 1–3" : `${from}–${to}`}</button>`)
            .join("")}
        </div>
        <div class="row small">
          Or any range: from <input type="number" id="from" min="1" value="1"> to <input type="number" id="to" min="1" value="3">
          <button class="btn quiet" type="button" id="custom">Make list</button>
        </div>
      </div>

      <div class="box center">
        <h2>Big-screen QR</h2>
        <p class="muted small">For your card set-up moment. It opens <code>${esc(startUrl)}</code>, where people type their details, then tap their card.</p>
        <div class="qr">${qrSvg(startUrl)}</div>
        <div class="row" style="justify-content:center">
          <a class="btn" href="/screen" target="_blank">Open the big-screen page</a>
          <button class="btn ghost" type="button" id="qrDownload">Download QR</button>
        </div>
        <p class="muted small" style="margin-top:8px">On the big screen, press F for full screen.</p>
      </div>
    </section>

    <h2>Cards that are set up</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Name</th><th>Links</th><th>Edit-link email</th><th>Set up</th><th></th></tr></thead>
        <tbody>
          ${
            cards.length
              ? cards
                  .map(
                    (c) => `<tr class="${c.hidden ? "hidden" : ""}">
              <td><a href="${esc(c.address)}" target="_blank">${c.num}</a></td>
              <td>${esc(c.name)}${c.hidden ? `<span class="tag">hidden</span>` : ""}</td>
              <td class="small">${esc(profileLinks(c).map((l) => `${l.kind}: ${l.text}`).join(" · ") || "none")}</td>
              <td class="small">${esc(c.email ?? "none")}</td>
              <td class="small">${esc(new Date(c.claimedAt).toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" }))}</td>
              <td class="actions">
                <button class="btn quiet" type="button" data-act="${c.hidden ? "unhide" : "hide"}" data-num="${c.num}">${c.hidden ? "Unhide" : "Hide"}</button>
                <button class="btn quiet" type="button" data-act="reset" data-num="${c.num}">Reset</button>
              </td>
            </tr>`,
                  )
                  .join("")
              : `<tr><td colspan="6" class="muted">No cards set up yet. Tap a test card on your phone to try it.</td></tr>`
          }
        </tbody>
      </table>
    </div>
    <p class="muted small" style="margin-top:10px"><strong>Hide</strong> = people who tap that card see "taking a break" (the owner still sees it).
    <strong>Reset</strong> = wipes it back to blank, for a wrong set-up or when someone asks for their details to be removed.</p>
    <div class="row"><button class="btn ghost" type="button" id="refresh">Refresh</button></div>`;

  // Wire it up
  app.querySelectorAll("#lists [data-from]").forEach((b) => b.addEventListener("click", () => download(Number(b.dataset.from), Number(b.dataset.to), b)));
  app.querySelector("#custom").addEventListener("click", (e) => download(Number(app.querySelector("#from").value), Number(app.querySelector("#to").value), e.target));
  app.querySelector("#howMany").addEventListener("change", (e) => {
    howMany = Math.max(3, Math.min(5000, Number(e.target.value) || 300));
    render();
  });
  app.querySelector("#qrDownload").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([qrSvg(startUrl)], { type: "image/svg+xml" }));
    a.download = "cards-qr.svg";
    a.click();
  });
  app.querySelector("#refresh").addEventListener("click", render);
  app.querySelectorAll("[data-act]").forEach((b) =>
    b.addEventListener("click", async () => {
      const act = b.dataset.act;
      if (act === "reset" && !confirm(`Reset card ${b.dataset.num}? Their details are wiped and the card goes back to blank.`)) return;
      b.disabled = true;
      const r = await api("/api/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: act, num: Number(b.dataset.num) }),
      });
      if (!r.ok) alertBox(`Couldn't do that (${r.status}).`);
      render();
    }),
  );
}

(async () => {
  try {
    config = await loadConfig();
  } catch {
    config = {};
  }
  document.title = filler(config)("{event} · tap cards admin");
  await render();
})();
