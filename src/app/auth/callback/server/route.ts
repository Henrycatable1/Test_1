import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { resolveSignedInHomePath } from "@/features/onboarding/lib/onboarding-cat";
import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

function toSafeNextPath(input: string | null) {
  const normalizedInput = input?.trim() ?? null;

  if (!normalizedInput || !normalizedInput.startsWith("/")) {
    return "/dashboard";
  }

  return normalizedInput;
}

async function resolvePostAuthPath(
  supabase: ReturnType<typeof createServerClient<Database>>,
  requestedNextPath: string,
) {
  // ### magic-link next=/onboarding must not force returning owners onto a recreate form
  if (requestedNextPath !== "/onboarding") {
    return requestedNextPath;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return requestedNextPath;
  }

  const { data: existingCats } = await supabase
    .from("cats")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1);

  return resolveSignedInHomePath(Boolean(existingCats?.[0]?.id));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = requestUrl.searchParams.get("type");
  const requestedNextPath = toSafeNextPath(requestUrl.searchParams.get("next"));
  const headerStore = await headers();
  const requestHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const requestProtocol = headerStore.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  const requestOrigin = requestHost ? `${requestProtocol}://${requestHost}` : requestUrl.origin;
  const authErrorBaseUrl = new URL("/signin?auth_error=1", requestOrigin);
  // ### defer the final Location until after session exchange so we can route by owned-cat state
  const response = NextResponse.redirect(new URL(requestedNextPath, requestOrigin));

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

    const nextPath = await resolvePostAuthPath(supabase, requestedNextPath);
    response.headers.set("Location", new URL(nextPath, requestOrigin).toString());
    return response;
  } catch {
    const invalidTokenUrl = new URL(authErrorBaseUrl);
    invalidTokenUrl.searchParams.set("reason", "invalid_or_expired");

    // ### route callback failures to sign-in with explicit feedback instead of silently landing without a session
    return NextResponse.redirect(invalidTokenUrl);
  }
}
