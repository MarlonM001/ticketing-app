import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { verifyStaffSession, STAFF_COOKIE_NAME } from "@/lib/staff-session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const staffMatch = pathname.match(/^\/(scan|caja)\/([^/]+)/);
  if (staffMatch) {
    const eventId = staffMatch[2];
    const token = request.cookies.get(STAFF_COOKIE_NAME)?.value;
    const session = token ? await verifyStaffSession(token) : null;

    if (!session || session.eventId !== eventId) {
      const accessUrl = request.nextUrl.clone();
      accessUrl.pathname = `/scan/${eventId}/acceso`;
      if (pathname !== accessUrl.pathname) {
        return NextResponse.redirect(accessUrl);
      }
    }
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/scan/:path*", "/caja/:path*"],
};
