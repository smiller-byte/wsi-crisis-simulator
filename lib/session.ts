import "server-only";
import { SignJWT, jwtVerify } from "jose";

function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export const STAFF_COOKIE = "wsi_staff_session";
export const SUPERVISOR_COOKIE = "wsi_supervisor_session";

export interface StaffSessionPayload {
  role: "staff";
  staffName: string;
}

export interface SupervisorSessionPayload {
  role: "supervisor";
}

async function encrypt(payload: Record<string, unknown>, expiresIn: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getEncodedKey());
}

async function decrypt<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), { algorithms: ["HS256"] });
    return payload as unknown as T;
  } catch {
    return null;
  }
}

export function createStaffToken(staffName: string) {
  return encrypt({ role: "staff", staffName }, "12h");
}

export function createSupervisorToken() {
  return encrypt({ role: "supervisor" }, "12h");
}

export function verifyStaffToken(token: string | undefined) {
  return decrypt<StaffSessionPayload>(token);
}

export function verifySupervisorToken(token: string | undefined) {
  return decrypt<SupervisorSessionPayload>(token);
}
