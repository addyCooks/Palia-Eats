import Link from "next/link";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <ProblemScreen
        glyph="?"
        title="Nothing here"
        action={
          <Link href="/" className={problemActionClass}>
            Back to PaliaEats
          </Link>
        }
      >
        That page doesn&apos;t exist, or it has moved.
      </ProblemScreen>
    </main>
  );
}
