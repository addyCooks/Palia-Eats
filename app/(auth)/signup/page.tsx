import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { postLoginPath, safeNextPath } from "@/lib/auth/redirect";
import { getT } from "@/lib/i18n/server";
import { SignupForm } from "@/components/forms/SignupForm";
import { GoogleButton } from "@/components/forms/GoogleButton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.title.signup") };
}

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const t = await getT();
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);

  const profile = await getProfile();
  if (profile) redirect(postLoginPath(next, profile.role));

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <>
      <div className="flex flex-col gap-1.5 sm:text-center">
        <h1 className="font-display text-[34px] leading-[1.05]">{t("auth.signup.title")}</h1>
        <p className="text-[15px] text-stone-600">{t("auth.signup.subtitle")}</p>
      </div>
      <GoogleButton next={next ?? undefined} />
      <SignupForm next={next ?? undefined} />
      <p className="text-center text-sm text-stone-600">
        {t("auth.signup.have_account")}{" "}
        <Link href={loginHref} className="font-semibold text-accent hover:underline">
          {t("auth.login.submit")}
        </Link>
      </p>
    </>
  );
}
