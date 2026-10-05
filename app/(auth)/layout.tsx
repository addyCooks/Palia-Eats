import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" className="text-center text-2xl font-bold">
        Palia<span className="text-brand">Eats</span>
      </Link>
      <Card className="flex flex-col gap-4 p-6">{children}</Card>
    </main>
  );
}
