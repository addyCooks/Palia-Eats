"use client";

import { useState } from "react";
import { LocateFixed, MapPin, X } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { mapsLink } from "@/lib/utils/maps";

type Pin = { lat: number; lng: number; accuracy?: number };

// Optional "use my current location" for an address. The pin travels with the form as
// two hidden fields; the rider gets a "Open in Maps" link with the order.
export function LocationField({ initial }: { initial?: { lat: number; lng: number } | null }) {
  const t = useT();
  const [pin, setPin] = useState<Pin | null>(initial ?? null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function locate() {
    if (!("geolocation" in navigator)) {
      setError(t("loc.no_geo"));
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPin({
          lat: Math.round(position.coords.latitude * 1e6) / 1e6,
          lng: Math.round(position.coords.longitude * 1e6) / 1e6,
          accuracy: Math.round(position.coords.accuracy),
        });
        setLocating(false);
      },
      (failure) => {
        setLocating(false);
        setError(
          failure.code === failure.PERMISSION_DENIED
            ? t("loc.blocked")
            : t("loc.failed"),
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="latitude" value={pin?.lat ?? ""} />
      <input type="hidden" name="longitude" value={pin?.lng ?? ""} />

      <span className="text-[13px] font-semibold text-stone-600">
        {t("loc.title")} <span className="font-normal text-stone-500">{t("loc.optional")}</span>
      </span>

      {pin ? (
        <div className="anim-pop-in flex flex-col overflow-hidden rounded-xl bg-surface shadow-card">
          <iframe
            title={t("loc.map_title")}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${pin.lng - 0.002},${pin.lat - 0.0012},${pin.lng + 0.002},${pin.lat + 0.0012}&layer=mapnik&marker=${pin.lat},${pin.lng}`}
            className="pointer-events-none h-44 w-full border-0"
            loading="lazy"
          />
          <div className="flex items-center gap-3 px-3.5 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800">
              <MapPin className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <b className="block">{t("loc.added")}</b>
              <a href={mapsLink(pin.lat, pin.lng)} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                {pin.accuracy ? `${t("loc.accuracy", { m: pin.accuracy })} · ` : ""}{t("loc.view")}
              </a>
            </span>
            <button
              type="button"
              onClick={() => setPin(null)}
              aria-label={t("loc.remove")}
              className="grid size-9 shrink-0 place-items-center rounded-lg text-stone-500 hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="flex h-[50px] items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-dashed border-brand/70 bg-amber-50 text-[15px] font-semibold text-amber-900 hover:bg-amber-100 disabled:cursor-wait"
        >
          {locating ? <span className="pe-spinner text-brand" aria-hidden /> : <LocateFixed className="size-[18px] text-accent" aria-hidden />}
          {locating ? t("loc.finding") : t("loc.use")}
        </button>
      )}

      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-stone-500">
          {t("loc.hint")}
        </p>
      )}
    </div>
  );
}
