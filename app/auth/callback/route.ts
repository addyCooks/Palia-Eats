import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { postLoginPath } from "@/lib/auth/redirect";

// Only these kinds of email links are accepted here.
const EMAIL_LINK_TYPES: EmailOtpType[] = ["email", "signup"];

// People arrive here from two kinds of links:
//  1. The "confirm your email" link in our signup email. It carries token_hash + type,
//     and works in ANY browser or device (it doesn't depend on the window that signed up).
//  2. Google sign-in, which returns a one-time `code` that only works in the same browser.
// Either way we turn it into a login session, then send the person on their way.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const supabase = await createClient();
  let userId: string | null = null;

  if (tokenHash && type && EMAIL_LINK_TYPES.includes(type as EmailOtpType)) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (!error && data.user) userId = data.user.id;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) userId = data.user.id;
  }

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    return NextResponse.redirect(
      `${origin}${postLoginPath(next, profile?.role ?? "customer")}`,
    );
  }

  return NextResponse.redirect(`${origin}/login?error=callback`);
}
