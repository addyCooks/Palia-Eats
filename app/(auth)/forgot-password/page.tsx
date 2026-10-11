import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.title.forgot"), robots: { index: false } };
}

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const t = await getT();
  const params = await searchParams;
  const linkProblem = params.error === "link";

  return (
    <>
      <div className="flex flex-col gap-1.5 sm:text-center">
        <h1 className="font-display text-[34px] leading-[1.05]">
          {linkProblem ? t("auth.reset.expired_title") : t("auth.forgot.title")}
        </h1>
        <p className="text-[15px] text-stone-600">
          {linkProblem ? t("auth.reset.expired_body") : t("auth.forgot.subtitle")}
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
