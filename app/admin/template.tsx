import type { ReactNode } from "react";

// Each admin page rises in gently (same spacing as the admin's main area).
export default function Template({ children }: { children: ReactNode }) {
  return <div className="anim-page flex flex-1 flex-col gap-5 lg:gap-6">{children}</div>;
}
