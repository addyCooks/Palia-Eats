import type { ReactNode } from "react";

// Each admin page comes in section by section, softly (same spacing as the admin's main area).
export default function Template({ children }: { children: ReactNode }) {
  return <div className="cascade flex flex-1 flex-col gap-5 lg:gap-6">{children}</div>;
}
