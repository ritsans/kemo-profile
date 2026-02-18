import type { SupabaseCookieOptions } from "@/lib/supabase/cookies";

export type PendingCookie = {
  name: string;
  value: string;
  options: SupabaseCookieOptions;
};

export type CallbackParams = {
  code: string | null;
  error: string | null;
  errorDescription: string | null;
  next: string | null;
};

export type ProfileResult = {
  profileId: string;
  isNewUser: boolean;
};
