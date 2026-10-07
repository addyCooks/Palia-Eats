import type { ReactNode } from "react";

// The restaurant page rises in gently when you open it.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="anim-page flex flex-1 flex-col">{children}</div>;
}
