// What this phone remembers about the cards, in its browser storage. Every
// read/write is wrapped: private browsing or blocked storage just means the
// phone forgets, never a crash.

const ownerKey = (num) => `tap-card:${num}`;
const DRAFT_KEY = "tap-card-draft"; // typed on /cards before tapping
const MINE_KEY = "tap-card-mine"; // the card number this phone set up

function read(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: nothing to do */
  }
}

export const EMPTY_INPUT = { name: "", instagram: "", tiktok: "", linkedin: "", website: "", email: "" };

export const cardStorage = {
  ownerToken: (num) => read(ownerKey(num)),
  setOwner(num, token) {
    write(ownerKey(num), token);
    write(MINE_KEY, String(num));
  },
  forgetOwner(num) {
    write(ownerKey(num), null);
    if (read(MINE_KEY) === String(num)) write(MINE_KEY, null);
  },
  myCard() {
    const n = Number(read(MINE_KEY));
    return Number.isInteger(n) && n > 0 ? n : null;
  },
  draft() {
    try {
      const d = JSON.parse(read(DRAFT_KEY) ?? "null");
      return d?.name ? { ...EMPTY_INPUT, ...d } : null;
    } catch {
      return null;
    }
  },
  setDraft: (d) => write(DRAFT_KEY, d ? JSON.stringify(d) : null),
};
