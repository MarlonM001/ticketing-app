import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "staff_session";
const ALG = "HS256";

function getSecretKey() {
  const secret = process.env.STAFF_COOKIE_SECRET;
  if (!secret) throw new Error("Falta STAFF_COOKIE_SECRET en las variables de entorno");
  return new TextEncoder().encode(secret);
}

export type StaffSessionPayload = {
  eventId: string;
  label: string;
};

export async function signStaffSession(payload: StaffSessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());
}

export async function verifyStaffSession(
  token: string,
): Promise<StaffSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.eventId !== "string" || typeof payload.label !== "string") {
      return null;
    }
    return { eventId: payload.eventId, label: payload.label };
  } catch {
    return null;
  }
}

export { COOKIE_NAME as STAFF_COOKIE_NAME };
