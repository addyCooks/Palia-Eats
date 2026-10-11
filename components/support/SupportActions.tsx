import Link from "next/link";
import { Mail, MessageCircle, MessageSquareText } from "lucide-react";
import { supportLinks, type SupportContext } from "@/lib/utils/support";

const primary =
  "inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-dark";
const secondary =
  "inline-flex h-11 items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold hover:bg-muted";

type Labels = { whatsapp: string; email: string; message: string };
const ENGLISH: Labels = { whatsapp: "WhatsApp us", email: "Email us", message: "Send a message" };

// The "get in touch" buttons: Send a message (our own form, when a link is given), WhatsApp (once
// a support number is set) and Email (always). The number itself is never shown: WhatsApp opens
// through /support/whatsapp, with the order (or restaurant) already written in the message.
// Voice calls can be made from inside WhatsApp.
export function SupportActions({
  context,
  labels = ENGLISH,
  messageHref,
}: {
  context?: SupportContext;
  labels?: Labels;
  // Where the in-app help form lives for this person (customers: /help?order=1058#message)
  messageHref?: string;
}) {
  const support = supportLinks(context);
  const firstIsMessage = Boolean(messageHref);
  return (
    <div className="flex flex-wrap gap-2.5">
      {messageHref && (
        <Link href={messageHref} className={primary}>
          <MessageSquareText className="size-[18px]" aria-hidden />
          {labels.message}
        </Link>
      )}
      {support.whatsappHref && (
        <a
          href={support.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={firstIsMessage ? secondary : primary}
        >
          <MessageCircle className="size-[18px]" aria-hidden />
          {labels.whatsapp}
        </a>
      )}
      <a href={support.emailHref} className={firstIsMessage || support.whatsappHref ? secondary : primary}>
        <Mail className="size-[18px]" aria-hidden />
        {labels.email}
      </a>
    </div>
  );
}
