"use client";

import { useState } from "react";
import { conversations as initialConversations, messagesByConversation } from "@/lib/mock-data";
import type { Message } from "@/lib/types";
import { IconRail } from "./icon-rail";
import { ConversationList } from "./conversation-list";
import { ChatHeader } from "./chat-header";
import { MessageThread } from "./message-thread";
import { Composer } from "./composer";
import { ChatIcon } from "./icons";

export function ChatApp() {
  const [conversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [messages, setMessages] = useState<Record<string, Message[]>>(messagesByConversation);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const thread = selectedId ? messages[selectedId] ?? [] : [];

  function handleSelect(id: string) {
    setSelectedId(id);
    setMobileView("thread");
  }

  function handleBack() {
    setMobileView("list");
  }

  function handleSend(content: string) {
    if (!selectedId) return;
    const newMessage: Message = {
      id: `local-${Date.now()}`,
      conversationId: selectedId,
      senderId: "me",
      senderName: "You",
      content,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
    };
    setMessages((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), newMessage],
    }));
  }

  return (
    <div className="flex h-full w-full">
      <IconRail />

      <div className={`${mobileView === "thread" ? "hidden" : "flex"} min-w-0 md:flex`}>
        <ConversationList
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      <div
        className={`${mobileView === "list" ? "hidden" : "flex"} min-w-0 flex-1 flex-col md:flex`}
      >
        {selected ? (
          <>
            <ChatHeader conversation={selected} onBack={handleBack} />
            <MessageThread messages={thread} />
            <Composer onSend={handleSend} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-canvas px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#eef4f1] text-forest">
              <ChatIcon className="h-7 w-7" />
            </div>
            <p className="text-sm text-muted">Pick a conversation from the left to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
