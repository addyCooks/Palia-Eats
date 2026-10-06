import { ProblemScreen } from "@/components/ui/ProblemScreen";

export default function PanelLockedPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <ProblemScreen glyph="!" tone="dark" title={"This link can’t be used"}>
        Your panel link may have expired or been replaced. Open the link from your most recent new-order email, or
        ask PaliaEats for a new one.
      </ProblemScreen>
    </main>
  );
}
