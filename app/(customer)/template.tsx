import type { ReactNode } from "react";

// Every customer page comes in softly, section by section, when you open it.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="cascade flex flex-1 flex-col">{children}</div>;
}
