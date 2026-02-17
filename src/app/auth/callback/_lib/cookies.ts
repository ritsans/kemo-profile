import type { NextResponse } from "next/server";
import type { PendingCookie } from "./types";

export function applyPendingCookies(
  response: NextResponse,
  pendingCookies: PendingCookie[],
) {
  for (const cookie of pendingCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
}
