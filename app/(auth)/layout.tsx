import { Wordmark } from "@/components/layout/Wordmark";
import { Photo } from "@/components/ui/Photo";

// Log in / sign up (v2 5f and 6g): a white card on the paper background with food plates
// peeking in from the edges (laptops) or one big plate at the top (phones).
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex flex-1 flex-col items-center overflow-hidden px-4 pb-10 sm:justify-center sm:py-16">
      {/* Phones: one plate at the top, shown whole (it shrinks a little on very narrow screens) */}
      <div className="anim-fade-in pointer-events-none relative mb-3 mt-8 size-[min(240px,62vw)] shrink-0 overflow-hidden rounded-full shadow-[0_24px_48px_rgba(0,0,0,.22)] sm:hidden">
        <Photo src="/placeholders/butter-chicken.jpg" alt="" sizes="240px" priority />
      </div>
      {/* Laptops: plates around the card */}
      <div aria-hidden className="pointer-events-none absolute -left-8 top-[120px] hidden size-[200px] -rotate-[14deg] overflow-hidden rounded-full shadow-plate sm:block">
        <Photo src="/placeholders/chinese-platter.jpg" alt="" sizes="200px" />
      </div>
      <div aria-hidden className="pointer-events-none absolute -right-10 bottom-[90px] hidden size-[240px] overflow-hidden rounded-full shadow-plate sm:block">
        <Photo src="/placeholders/gulab-jamun.jpg" alt="" sizes="240px" />
      </div>

      <div className="anim-pop-in relative flex w-full max-w-[440px] flex-col gap-5 sm:rounded-[24px] sm:bg-surface sm:p-10 sm:shadow-[0_30px_70px_rgba(120,70,0,.14)] dark:sm:shadow-none">
        <div className="self-start sm:self-center">
          <Wordmark />
        </div>
        {children}
      </div>
    </main>
  );
}
