import type { Metadata } from "next";
import { Banknote, LayoutDashboard, Mail, Store } from "lucide-react";
import { JoinForm } from "@/components/forms/JoinForm";

export const metadata: Metadata = {
  title: "Add your restaurant",
  description: "Run a restaurant in Palia? Ask to join PaliaEats and get your own restaurant page and orders panel.",
};

const POINTS = [
  { icon: Store, title: "Your own restaurant page", sub: "Your menu, photos and hours, with a link to share" },
  { icon: Mail, title: "Orders straight to you", sub: "By email and on your orders panel, no app to install" },
  { icon: LayoutDashboard, title: "You stay in charge", sub: "Mark dishes sold out, pause orders, see your sales" },
  { icon: Banknote, title: "Cash on delivery", sub: "Customers pay at the door" },
];

// Public "Add your restaurant" page: the request goes to the admin for approval.
export default function JoinPage() {
  return (
    <main className="mx-auto grid w-full max-w-[1280px] flex-1 items-start gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-14 lg:px-12 lg:pb-14 lg:pt-10">
      <section className="flex flex-col gap-5">
        <span className="kicker">For restaurants</span>
        <h1 className="font-display text-[38px] leading-[1.05] sm:text-[52px]">Bring your kitchen to PaliaEats</h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-stone-600 sm:text-base">
          Fill in the form and we&apos;ll check your details. Once you&apos;re approved, you get a private link to your
          restaurant panel to add your menu. We put you live when it&apos;s ready.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {POINTS.map(({ icon: Icon, title, sub }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-[13px] text-stone-500">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[22px] bg-surface p-5 shadow-card sm:p-7">
        <h2 className="mb-4 font-display text-[28px] leading-none">Add your restaurant</h2>
        <JoinForm />
      </section>
    </main>
  );
}
