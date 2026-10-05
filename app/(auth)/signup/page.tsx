import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { postLoginPath, safeNextPath } from "@/lib/auth/redirect";
import { SignupForm } from "@/components/forms/SignupForm";
import { GoogleButton } from "@/components/forms/GoogleButton";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);

  const profile = await getProfile();
  if (profile) redirect(postLoginPath(next, profile.role));

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <>
      <h1 className="text-xl font-semibold">Create your account</h1>
      <GoogleButton next={next ?? undefined} />
      <SignupForm next={next ?? undefined} />
      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
