import Link from "next/link";

// "PALIA" over "Eats" with the saffron dot (v2 wordmark).
export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <Link href="/" aria-label="PaliaEats home" className="flex flex-col items-center leading-none">
      <span className="text-[9px] font-semibold tracking-[3px] text-accent">PALIA</span>
      <span className={`flex items-center gap-[3px] font-display ${size === "md" ? "text-[30px]" : "text-[26px]"}`}>
        Eats
        <span className="size-[9px] rounded-full bg-brand shadow-[0_0_0_3px_#FDE7BC] dark:shadow-[0_0_0_3px_#3A2C14]" aria-hidden />
      </span>
    </Link>
  );
}
