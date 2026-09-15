import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "staff_session";
const ALG = "HS256";

function getSecretKey() {
  const secret = process.env.STAFF_COOKIE_SECRET;
  if (!secret) throw new Error("Falta STAFF_COOKIE_SECRET en las variables de entorno");
  return new TextEncoder().encode(secret);
}

export type StaffRole = "puerta" | "caja" | "mesero" | "dj";

export type StaffSessionPayload = {
  eventId: string;
  label: string;
  role: StaffRole;
  staffId: string;
};

const STAFF_ROLES: StaffRole[] = ["puerta", "caja", "mesero", "dj"];

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
    if (
      typeof payload.eventId !== "string" ||
      typeof payload.label !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.staffId !== "string" ||
      !STAFF_ROLES.includes(payload.role as StaffRole)
    ) {
      return null;
    }
    return {
      eventId: payload.eventId,
      label: payload.label,
      role: payload.role as StaffRole,
      staffId: payload.staffId,
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME as STAFF_COOKIE_NAME };
