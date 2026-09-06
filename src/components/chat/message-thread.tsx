"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/lib/types";
import { MessageBubble } from "./message-bubble";

export function MessageThread({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-canvas px-4 py-4">
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        {messages.map((message, i) => {
          const prev = messages[i - 1];
          const showAvatar = !message.isOwn && (!prev || prev.senderId !== message.senderId || prev.isOwn);
          return <MessageBubble key={message.id} message={message} showAvatar={showAvatar} />;
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
