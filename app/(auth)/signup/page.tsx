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
      <div className="flex flex-col gap-1.5 sm:text-center">
        <h1 className="font-display text-[34px] leading-[1.05]">Hungry? Let&apos;s fix that.</h1>
        <p className="text-[15px] text-stone-600">Create your account to order. Pay cash or UPI on delivery.</p>
      </div>
      <GoogleButton next={next ?? undefined} />
      <SignupForm next={next ?? undefined} />
      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href={loginHref} className="font-semibold text-accent hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
