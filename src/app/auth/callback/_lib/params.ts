import type { CallbackParams } from "./types";

export function parseCallbackParams(requestUrl: string): CallbackParams {
  const { searchParams } = new URL(requestUrl);

  return {
    code: searchParams.get("code"),
    error: searchParams.get("error"),
    errorDescription: searchParams.get("error_description"),
    next: searchParams.get("next"),
  };
}
