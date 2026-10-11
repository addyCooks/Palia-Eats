"use client";

import { useState, useTransition } from "react";
import { rateOrder } from "@/lib/actions/ratings";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/messages";

const WORDS: (MessageKey | "")[] = ["", "rate.w1", "rate.w2", "rate.w3", "rate.w4", "rate.w5"];

// "How was your food?" Five big stars and an optional note, shown on a delivered order.
export function RateOrder({
  orderId,
  restaurantName,
  onDone,
}: {
  orderId: string;
  restaurantName: string;
  onDone?: () => void;
}) {
  const t = useT();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p role="status" className="anim-pop-in text-sm font-medium text-stone-700">
        {t("rate.thanks", { name: restaurantName })}
      </p>
    );
  }

  const shown = hover || stars;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div role="radiogroup" aria-label={t("rate.your_rating")} className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={n === 1 ? t("rate.star_one") : t("rate.stars", { n })}
              onMouseEnter={() => setHover(n)}
              onClick={() => setStars(n)}
              className={`text-[38px] leading-none transition-[color,transform] duration-200 hover:scale-110 active:scale-90 ${n <= shown ? "text-brand" : "text-stone-300"}`}
            >
              <span key={n <= stars ? `on-${stars}` : "off"} className={`inline-block ${n <= stars ? "anim-bump" : ""}`} style={{ animationDelay: `${(n - 1) * 40}ms` }}>
                ★
              </span>
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold text-stone-600">{WORDS[shown] ? t(WORDS[shown] as MessageKey) : ""}</span>
      </div>
      {stars > 0 && (
        <div className="anim-fade-up flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-stone-600">
            {t("rate.add")}
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={300}
              rows={2}
              placeholder={t("rate.placeholder")}
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
                else {
                  setDone(true);
                  onDone?.();
                }
              })
            }
            className="press h-12 rounded-xl bg-brand font-bold text-on-brand hover:bg-brand-dark disabled:opacity-60"
          >
            {isPending ? t("rate.sending") : t("rate.send")}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
