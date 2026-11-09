// What people type is messy ("@yourname", "instagram.com/yourname/", a full URL…).
// These turn it into one clean form, or throw a friendly message that shows
// under the form.

import { cardsConfig } from "./shared.mjs";

export class FieldError extends Error {}

// Which links the form asks for (cards.config.json → "fields"). Name is always on.
const ALL_FIELDS = ["instagram", "tiktok", "linkedin", "website"];
const enabled = new Set((cardsConfig.fields ?? ALL_FIELDS).filter((f) => ALL_FIELDS.includes(f)));

function handleFrom(raw, host, label) {
  let v = raw.trim();
  if (!v) return null;
  // A full or partial link → take the first part after the domain.
  if (host.test(v) || v.includes("/")) {
    try {
      const url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
      v = url.pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      throw new FieldError(`that ${label} doesn't look right`);
    }
  }
  v = v.replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(v)) throw new FieldError(`that ${label} handle doesn't look right`);
  return v;
}

function urlFrom(raw, label, mustHost) {
  const v = raw.trim();
  if (!v) return null;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
  } catch {
    throw new FieldError(`that ${label} link doesn't look right`);
  }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) {
    throw new FieldError(`that ${label} link doesn't look right`);
  }
  if (mustHost && !mustHost.test(url.hostname)) throw new FieldError(`that doesn't look like a ${label} link`);
  url.protocol = "https:";
  return url.toString();
}

/** Optional owner email for the private edit link. Blank = no email. */
export function cleanEmail(raw) {
  const v = typeof raw === "string" ? raw.trim().toLowerCase().slice(0, 200) : "";
  if (!v) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) throw new FieldError("that email doesn't look right");
  return v;
}

export function cleanFields(input) {
  const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
  const name = str(input.name, 60).trim();
  if (!name) throw new FieldError("pop your name in first");

  // LinkedIn: accept a bare username too ("yourname" → linkedin.com/in/yourname).
  const li = str(input.linkedin, 200).trim();
  const liFull = li && !li.includes(".") && !li.includes("/") ? `linkedin.com/in/${li}` : li;

  return {
    name,
    instagram: enabled.has("instagram") ? handleFrom(str(input.instagram, 100), /instagram\.com/i, "instagram") : null,
    tiktok: enabled.has("tiktok") ? handleFrom(str(input.tiktok, 100), /tiktok\.com/i, "tiktok") : null,
    linkedin: enabled.has("linkedin") ? urlFrom(liFull, "linkedin", /(^|\.)linkedin\.com$/i) : null,
    website: enabled.has("website") ? urlFrom(str(input.website, 200), "website") : null,
  };
}
