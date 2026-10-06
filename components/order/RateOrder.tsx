"use client";

import { useState, useTransition } from "react";
import { rateOrder } from "@/lib/actions/ratings";

const WORDS = ["", "Not good", "Could be better", "Okay", "Good", "Loved it"];

// "How was your food?" Five big stars and an optional note, shown on a delivered order.
export function RateOrder({ orderId, restaurantName }: { orderId: string; restaurantName: string }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p role="status" className="text-sm font-medium text-stone-700">
        Thank you! Your rating helps {restaurantName} and other customers.
      </p>
    );
  }

  const shown = hover || stars;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div role="radiogroup" aria-label="Your rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setStars(n)}
              className={`text-[34px] leading-none transition-transform active:scale-90 ${n <= shown ? "text-brand" : "text-stone-300"}`}
            >
              ★
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold text-stone-600">{WORDS[shown]}</span>
      </div>
      {stars > 0 && (
        <>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-stone-600">
            Anything to add? (optional)
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={300}
              rows={2}
              placeholder="Hot and tasty, a bit late, too spicy…"
              className="rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[15px] font-normal text-foreground outline-none focus:border-brand"
            />
          </label>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await rateOrder({ orderId, stars, comment });
                if (result.error) setError(result.error);
                else setDone(true);
              })
            }
            className="h-12 rounded-xl bg-brand font-bold text-on-brand hover:bg-brand-dark disabled:opacity-60"
          >
            {isPending ? "Sending…" : "Send rating"}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
