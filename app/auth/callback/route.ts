import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postLoginPath } from "@/lib/auth/redirect";

// Supabase sends people here after Google sign-in and after clicking the
// "confirm your email" link. We swap the one-time code for a login session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      return NextResponse.redirect(
        `${origin}${postLoginPath(next, profile?.role ?? "customer")}`,
      );
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback`);
}
