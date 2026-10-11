import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { postLoginPath, safeNextPath } from "@/lib/auth/redirect";
import { getT } from "@/lib/i18n/server";
import { LoginForm } from "@/components/forms/LoginForm";
import { GoogleButton } from "@/components/forms/GoogleButton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.title.login") };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = await getT();
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const error = typeof params.error === "string" ? params.error : null;

  const errorMessages: Record<string, string> = {
    google: t("auth.error_google"),
    callback: t("auth.error_callback"),
  };

  // Already logged in? Skip the form.
  const profile = await getProfile();
  if (profile) redirect(postLoginPath(next, profile.role));

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <>
      <div className="flex flex-col gap-1.5 sm:text-center">
        <h1 className="font-display text-[34px] leading-[1.05]">{t("auth.login.title")}</h1>
        <p className="text-[15px] text-stone-600">{t("auth.login.subtitle")}</p>
      </div>
      {error && errorMessages[error] && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errorMessages[error]}
        </p>
      )}
      <GoogleButton next={next ?? undefined} />
      <LoginForm next={next ?? undefined} />
      <p className="text-center text-sm text-stone-600">
        {t("auth.login.new_here")}{" "}
        <Link href={signupHref} className="font-semibold text-accent hover:underline">
          {t("auth.login.create")}
        </Link>
      </p>
    </>
  );
}
