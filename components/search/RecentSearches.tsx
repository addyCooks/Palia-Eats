"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "paliaeats-recent-searches";

function read(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

// Remembers the last few searches on this phone (v2 8b "RECENT"). Only in this browser.
export function RecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is only readable after mount
    setRecent(read());
  }, []);
  if (recent.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[13px] font-semibold tracking-[.5px] text-stone-500">RECENT</h2>
      <div className="flex flex-wrap gap-2">
        {recent.map((term) => (
          <Link
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            className="flex h-[34px] items-center rounded-[10px] bg-surface px-3.5 text-[13px] shadow-card"
          >
            {term}
          </Link>
        ))}
      </div>
    </section>
  );
}

// Saves the current search into the recent list (rendered on the results page).
export function RememberSearch({ q }: { q: string }) {
  useEffect(() => {
    if (!q) return;
    try {
      const next = [q, ...read().filter((term) => term.toLowerCase() !== q.toLowerCase())].slice(0, 6);
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage blocked: nothing to remember
    }
  }, [q]);
  return null;
}
