"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// "Look at the menu" on the closed screen: opens the restaurant page anyway (?menu=1),
// keeping a #dish-… link so the dish someone tapped in search still opens.
export function SeeMenuLink() {
  const pathname = usePathname();
  const router = useRouter();
  const href = `${pathname}?menu=1`;
  return (
    <Link
      href={href}
      onClick={(event) => {
        const hash = window.location.hash;
        if (!hash) return;
        event.preventDefault();
        router.push(href + hash);
      }}
    >
      Look at the menu
    </Link>
  );
}
