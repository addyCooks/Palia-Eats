import { supportLinks } from "@/lib/utils/support";
import { SupportActions } from "@/components/support/SupportActions";
import { Panel } from "@/components/ui/page";

// Help for restaurants: a card on the panel's Settings page (phones and laptops) ...
export function PanelHelpCard({ restaurantName }: { restaurantName: string }) {
  const { hours } = supportLinks();
  return (
    <Panel title="Need help?">
      <p className="-mt-2 text-sm text-stone-600">
        Questions about your orders screen, menu or timings? Write to us and we&apos;ll help. We reply {hours}.
      </p>
      <SupportActions context={{ panel: true, restaurantName }} />
    </Panel>
  );
}

// ... and a small block in the laptop sidebar.
export function SidebarHelp({ restaurantName }: { restaurantName: string }) {
  const support = supportLinks({ panel: true, restaurantName });
  return (
    <div className="flex flex-col gap-1 rounded-[14px] bg-[#2A241C] p-3.5 text-[13px]">
      <span className="font-semibold text-white">Need help?</span>
      <span className="text-[#A39B90]">We reply {support.hours}</span>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
        {support.whatsappHref && (
          <a href={support.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
            WhatsApp us
          </a>
        )}
        <a href={support.emailHref} className="text-brand hover:underline">
          Email us
        </a>
      </div>
    </div>
  );
}
