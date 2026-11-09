// GET /api/info: tells the setup page whether email edit links are switched on,
// so it only asks for an email when it can actually send one.

import { emailOn, json } from "../lib/shared.mjs";

export default async () => json({ emailOn: emailOn() });

export const config = { path: "/api/info" };
