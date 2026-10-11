import { getFunnel } from "@/lib/queries/funnel";
import { Panel } from "@/components/ui/page";

// "Where visitors drop off": how many visits reached each step in the last 7 days.
export async function FunnelPanel() {
  const steps = await getFunnel(7);
  const top = Math.max(1, steps[0]?.count ?? 0);

  return (
    <Panel title="Where visitors drop off (last 7 days)">
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const previous = i === 0 ? null : steps[i - 1].count;
          const share = previous ? Math.min(100, Math.round((step.count / previous) * 100)) : null;
          return (
            <li key={step.key} className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{step.label}</span>
                <span className="tabular-nums text-stone-600">
                  {step.count.toLocaleString("en-IN")}
                  {share !== null && <span className="ml-2 text-xs text-stone-500">{share}% of the step before</span>}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.max(step.count > 0 ? 2 : 0, Math.round((step.count / top) * 100))}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-stone-500">
        Each count is a visit (one browser tab session), not a person. Nothing about the visitor is stored. The first
        four steps start counting from the day this was switched on; orders are real website orders.
      </p>
    </Panel>
  );
}
