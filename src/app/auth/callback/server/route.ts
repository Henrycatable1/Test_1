import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { resolveTrustedRequestOrigin, toSafeNextPath } from "@/lib/auth-redirect";
import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = requestUrl.searchParams.get("type");
  const nextPath = toSafeNextPath(requestUrl.searchParams.get("next"));
  const headerStore = await headers();
  const requestHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const requestProtocol = headerStore.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  const requestOrigin = resolveTrustedRequestOrigin({
    requestOrigin: requestUrl.origin,
    headerOrigin: requestHost ? `${requestProtocol}://${requestHost}` : null,
    canonicalAppUrl: process.env.NEXT_PUBLIC_APP_URL,
  });
  const redirectUrl = new URL(nextPath, requestOrigin);
  const response = NextResponse.redirect(redirectUrl);
  const authErrorBaseUrl = new URL("/signin?auth_error=1", requestOrigin);

  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const supportedOtpTypes = new Set<EmailOtpType>([
    "signup",
    "magiclink",
    "invite",
    "recovery",
    "email_change",
    "email",
  ]);

  try {
    let finalized = false;

    // ### support OAuth/PKCE callback links that return an auth code
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        throw error;
      }

      finalized = true;
    }

    // ### support confirmation links that return token_hash + type instead of code
    if (!finalized && tokenHash && otpType && supportedOtpTypes.has(otpType as EmailOtpType)) {
      const { error } = await supabase.auth.verifyOtp({
        type: otpType as EmailOtpType,
        token_hash: tokenHash,
      });

      if (error) {
        throw error;
      }

      finalized = true;
    }

    if (!finalized) {
      const missingTokenUrl = new URL(authErrorBaseUrl);
      missingTokenUrl.searchParams.set("reason", "missing_token");
      return NextResponse.redirect(missingTokenUrl);
    }
    return response;
  } catch {
    const invalidTokenUrl = new URL(authErrorBaseUrl);
    invalidTokenUrl.searchParams.set("reason", "invalid_or_expired");

    // ### route callback failures to sign-in with explicit feedback instead of silently landing without a session
    return NextResponse.redirect(invalidTokenUrl);
  }
}
