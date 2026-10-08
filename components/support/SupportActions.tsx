import { Mail, MessageCircle, Phone } from "lucide-react";
import { supportLinks, type SupportContext } from "@/lib/utils/support";

const primary =
  "inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-dark";
const secondary =
  "inline-flex h-11 items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold hover:bg-muted";

// The "get in touch" buttons: WhatsApp and Call (once a support number is set) and Email
// (always). With an order, each one opens with the order already written in the message.
export function SupportActions({ context }: { context?: SupportContext }) {
  const support = supportLinks(context);
  return (
    <div className="flex flex-wrap gap-2.5">
      {support.whatsappHref && (
        <a href={support.whatsappHref} target="_blank" rel="noopener noreferrer" className={primary}>
          <MessageCircle className="size-[18px]" aria-hidden />
          WhatsApp us
        </a>
      )}
      {support.callHref && (
        <a href={support.callHref} className={secondary}>
          <Phone className="size-[18px]" aria-hidden />
          Call us
        </a>
      )}
      <a href={support.emailHref} className={support.whatsappHref ? secondary : primary}>
        <Mail className="size-[18px]" aria-hidden />
        Email us
      </a>
    </div>
  );
}
