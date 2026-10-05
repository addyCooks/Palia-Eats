import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { postLoginPath, safeNextPath } from "@/lib/auth/redirect";
import { LoginForm } from "@/components/forms/LoginForm";
import { GoogleButton } from "@/components/forms/GoogleButton";

export const metadata: Metadata = { title: "Log in" };

const ERROR_MESSAGES: Record<string, string> = {
  google: "Google sign-in isn't available right now. Please use email instead.",
  callback:
    "We couldn't log you in from that link. If you were confirming your email, that part probably worked: just log in below with your email and password.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const error = typeof params.error === "string" ? params.error : null;

  // Already logged in? Skip the form.
  const profile = await getProfile();
  if (profile) redirect(postLoginPath(next, profile.role));

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <>
      <h1 className="text-xl font-semibold">Log in</h1>
      {error && ERROR_MESSAGES[error] && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      <GoogleButton next={next ?? undefined} />
      <LoginForm next={next ?? undefined} />
      <p className="text-center text-sm text-stone-600">
        New here?{" "}
        <Link href={signupHref} className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
