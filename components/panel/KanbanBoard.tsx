"use client";

import { useRef, useState, useTransition, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import type { PanelOrder } from "@/lib/queries/panel";
import type { OrderStatus } from "@/types/app";
import { updateOrderStatus } from "@/lib/actions/panel";
import { KanbanOrderCard } from "@/components/panel/KanbanOrderCard";

const COLUMNS = [
  { key: "new", name: "New", dot: "bg-[#C2410C]", statuses: ["pending", "accepted"], drop: "pending", empty: "New orders appear here." },
  { key: "cooking", name: "Cooking", dot: "bg-brand", statuses: ["preparing"], drop: "preparing", empty: "Nothing cooking." },
  { key: "way", name: "On the way", dot: "bg-[#2563EB]", statuses: ["out_for_delivery"], drop: "out_for_delivery", empty: "Nothing out for delivery." },
  { key: "done", name: "Delivered today", dot: "bg-[#15803D]", statuses: ["delivered"], drop: "delivered", empty: "Delivered orders show here for the day." },
] as const;

const columnOf = (status: OrderStatus) => COLUMNS.findIndex((c) => (c.statuses as readonly string[]).includes(status));

// The live orders board (restaurant panel). Four columns: New → Cooking → On the way →
// Delivered today. Each card has its next-step button and a "Back" link; on a laptop
// cards can also be dragged one column forward or back. Phones swipe between columns.
export function KanbanBoard({ orders }: { orders: PanelOrder[] }) {
  const router = useRouter();
  const [moved, setMoved] = useState<Record<string, OrderStatus>>({});
  const [dragging, setDragging] = useState<{ id: string; from: number } | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);

  const statusOf = (order: PanelOrder) => moved[order.id] ?? order.status;

  function move(order: PanelOrder, to: number) {
    const from = columnOf(statusOf(order));
    if (to === from) return;
    if (Math.abs(to - from) !== 1) {
      setMessage("Move an order one step at a time.");
      return;
    }
    const status = COLUMNS[to].drop as OrderStatus;
    const undo = to < from;
    setMessage(null);
    setMoved((current) => ({ ...current, [order.id]: status }));
    startTransition(async () => {
      const result = await updateOrderStatus({ orderId: order.id, status, undo }).catch(() => ({ error: "Could not update the order." }));
      if (result.error) {
        setMoved((current) => {
          const next = { ...current };
          delete next[order.id];
          return next;
        });
        setMessage(result.error);
      }
      router.refresh();
    });
  }

  function onDragStart(event: DragEvent, order: PanelOrder) {
    event.dataTransfer.setData("text/plain", order.id);
    event.dataTransfer.effectAllowed = "move";
    setDragging({ id: order.id, from: columnOf(statusOf(order)) });
  }

  const canDrop = (index: number) => dragging !== null && Math.abs(index - dragging.from) === 1;

  const jumpTo = (index: number) =>
    scroller.current?.querySelectorAll("section")[index]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });

  const grouped = COLUMNS.map((column) => orders.filter((order) => (column.statuses as readonly string[]).includes(statusOf(order))));

  return (
    <div className="flex flex-col gap-3">
      {/* Phones: one tap to jump to a column */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden" role="tablist" aria-label="Columns">
        {COLUMNS.map((column, index) => (
          <button
            key={column.key}
            type="button"
            onClick={() => jumpTo(index)}
            className="press flex h-9 shrink-0 items-center gap-2 rounded-[10px] bg-surface px-3 text-[13px] font-semibold shadow-card"
          >
            <span className={`size-2 rounded-full ${column.dot}`} aria-hidden />
            {column.name}
            <span className="tabular-nums text-stone-500">{grouped[index].length}</span>
          </button>
        ))}
      </div>

      {message && (
        <p role="alert" className="anim-fade-up rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {message}
        </p>
      )}

      <div
        ref={scroller}
        className="stagger scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:items-start lg:gap-[18px] lg:overflow-visible lg:px-0"
      >
        {COLUMNS.map((column, index) => {
          const list = grouped[index];
          const target = canDrop(index);
          return (
            <section
              key={column.key}
              aria-label={column.name}
              onDragOver={(event) => {
                if (!target) return;
                event.preventDefault();
                setOver(index);
              }}
              onDragLeave={() => setOver((current) => (current === index ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                const order = orders.find((o) => o.id === dragging?.id);
                setOver(null);
                setDragging(null);
                if (order) move(order, index);
              }}
              className={`flex w-[86%] shrink-0 snap-start flex-col gap-3 rounded-[18px] bg-muted p-3.5 transition-[box-shadow,background-color] duration-300 sm:w-[60%] lg:w-auto ${
                target ? "outline-2 outline-dashed outline-brand/60" : ""
              } ${over === index ? "bg-amber-50 outline-brand" : ""}`}
            >
              <div className="flex items-center justify-between px-1.5 py-1">
                <h2 className="flex items-center gap-2 font-semibold">
                  <span className={`size-2.5 rounded-full ${column.dot}`} aria-hidden />
                  {column.name}
                </h2>
                <span className="grid h-6 min-w-6 place-items-center rounded-[7px] bg-surface px-2 text-xs font-bold tabular-nums">
                  {list.length}
                </span>
              </div>
              {list.length === 0 ? (
                <p className="px-1.5 pb-2 text-sm text-stone-500">{column.empty}</p>
              ) : (
                list.map((order) => (
                  <div
                    key={`${order.id}-${statusOf(order)}`}
                    draggable
                    onDragStart={(event) => onDragStart(event, order)}
                    onDragEnd={() => {
                      setDragging(null);
                      setOver(null);
                    }}
                    className={`anim-pop-in cursor-grab active:cursor-grabbing ${dragging?.id === order.id ? "opacity-50" : ""}`}
                  >
                    <KanbanOrderCard order={{ ...order, status: statusOf(order) }} updateStatus={updateOrderStatus} />
                  </div>
                ))
              )}
            </section>
          );
        })}
      </div>
      <p className="hidden text-xs text-stone-500 lg:block">Tip: drag a card one column forward or back.</p>
    </div>
  );
}
