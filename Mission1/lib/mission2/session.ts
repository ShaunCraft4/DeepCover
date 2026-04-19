import type { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

import type { Mission2Secrets } from "./types";

export type Mission2SessionData = {
  secrets?: Mission2Secrets;
};

const cookieName = "dossier_m2_session";

function sessionPassword(): string {
  const p = (process.env.SESSION_SECRET || "").trim();
  if (p.length >= 32) return p;
  return "0123456789abcdef0123456789abcdef";
}

export const mission2SessionOptions: SessionOptions = {
  cookieName,
  password: sessionPassword(),
  ttl: 60 * 60 * 4,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export async function getMission2IronSession() {
  const store = await cookies();
  return getIronSession<Mission2SessionData>(store, mission2SessionOptions);
}

export async function saveMission2Secrets(secrets: Mission2Secrets) {
  const session = await getMission2IronSession();
  session.secrets = secrets;
  await session.save();
}

export async function readMission2Secrets(): Promise<Mission2Secrets | null> {
  const session = await getMission2IronSession();
  const s = session.secrets;
  if (!s?.hidden_truth || !s?.launch_code) return null;
  return s;
}
