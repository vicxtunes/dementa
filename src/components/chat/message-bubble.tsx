import type { Message } from "@/lib/types";
import { Avatar } from "./avatar";

export function MessageBubble({ message, showAvatar }: { message: Message; showAvatar: boolean }) {
  if (message.isOwn) {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[70%]">
          <div className="rounded-2xl rounded-tr-sm bg-sky-600 px-3.5 py-2 text-sm text-white">
            {message.content}
          </div>
          <p className="mt-1 text-right text-[11px] text-zinc-400">{message.createdAt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2">
      <div className="w-8 shrink-0">{showAvatar && <Avatar name={message.senderName} size="sm" />}</div>
      <div className="max-w-[70%]">
        <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-3.5 py-2 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
          {message.content}
        </div>
        <p className="mt-1 text-[11px] text-zinc-400">{message.createdAt}</p>
      </div>
    </div>
  );
}
