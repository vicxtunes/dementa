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
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-2 sm:px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <BackIcon className="h-5 w-5" />
        </button>
        <Avatar name={conversation.name} online={conversation.online} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {conversation.name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {conversation.isGroup
              ? `${conversation.members?.length ?? 0} members`
              : conversation.online
                ? "Online"
                : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label="Search in conversation"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 sm:flex dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <SearchIcon className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          aria-label="Voice call"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <CallIcon className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          aria-label="Video call"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <VideoIcon className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          aria-label="More options"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <MoreIcon className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
