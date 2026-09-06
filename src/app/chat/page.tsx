import Link from "next/link";
import { ChatApp } from "@/components/chat/chat-app";

export default function ChatPage() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-canvas">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e9efef] bg-white px-4">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <i className="bi bi-asterisk text-forest" /> Dementa
        </span>
        <Link
          href="/home"
          className="flex items-center gap-1.5 text-xs font-bold text-muted transition-colors hover:text-forest"
        >
          <i className="bi bi-arrow-left" /> Back to Dementa
        </Link>
      </header>
      <div className="flex min-h-0 flex-1">
        <ChatApp />
      </div>
    </div>
  );
}
