import { Mail, MessageCircle } from "lucide-react";
import { supportLinks, type SupportContext } from "@/lib/utils/support";

const primary =
  "inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-dark";
const secondary =
  "inline-flex h-11 items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold hover:bg-muted";

// The "get in touch" buttons: WhatsApp (once a support number is set) and Email (always). The
// number itself is never shown: WhatsApp opens through /support/whatsapp, with the order (or
// restaurant) already written in the message. Voice calls can be made from inside WhatsApp.
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
      <a href={support.emailHref} className={support.whatsappHref ? secondary : primary}>
        <Mail className="size-[18px]" aria-hidden />
        Email us
      </a>
    </div>
  );
}
