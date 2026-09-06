import type { Conversation } from "@/lib/types";
import { Avatar } from "./avatar";
import { BackIcon, CallIcon, MoreIcon, SearchIcon, VideoIcon } from "./icons";

export function ChatHeader({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const iconBtn =
    "flex h-9 w-9 items-center justify-center rounded-[10px] text-muted hover:bg-canvas hover:text-forest";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#e9efef] bg-white px-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className={`${iconBtn} shrink-0 md:hidden`}
        >
          <BackIcon className="h-5 w-5" />
        </button>
        <Avatar name={conversation.name} online={conversation.online} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{conversation.name}</p>
          <p className="text-xs text-muted">
            {conversation.isGroup
              ? `${conversation.members?.length ?? 0} members`
              : conversation.online
                ? "Online"
                : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button type="button" aria-label="Search in conversation" className={`${iconBtn} hidden sm:flex`}>
          <SearchIcon className="h-4.5 w-4.5" />
        </button>
        <button type="button" aria-label="Voice call" className={iconBtn}>
          <CallIcon className="h-4.5 w-4.5" />
        </button>
        <button type="button" aria-label="Video call" className={iconBtn}>
          <VideoIcon className="h-4.5 w-4.5" />
        </button>
        <button type="button" aria-label="More options" className={iconBtn}>
          <MoreIcon className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
