import type { Conversation, Message } from "./types";

export const conversations: Conversation[] = [
  {
    id: "c1",
    name: "Priya Nair",
    isGroup: false,
    online: true,
    unread: 2,
    lastMessageAt: "09:41",
  },
  {
    id: "c2",
    name: "Design Team",
    isGroup: true,
    online: false,
    unread: 0,
    lastMessageAt: "09:12",
    members: ["Priya", "Omar", "Lin", "You"],
  },
  {
    id: "c3",
    name: "Omar Haddad",
    isGroup: false,
    online: false,
    unread: 0,
    lastMessageAt: "Yesterday",
  },
  {
    id: "c4",
    name: "Lin Zhou",
    isGroup: false,
    online: true,
    unread: 0,
    lastMessageAt: "Yesterday",
  },
  {
    id: "c5",
    name: "Dementa Launch",
    isGroup: true,
    online: false,
    unread: 5,
    lastMessageAt: "Mon",
    members: ["Priya", "Omar", "Lin", "Sam", "You"],
  },
  {
    id: "c6",
    name: "Sam Okafor",
    isGroup: false,
    online: false,
    unread: 0,
    lastMessageAt: "Mon",
  },
];

export const messagesByConversation: Record<string, Message[]> = {
  c1: [
    {
      id: "m1",
      conversationId: "c1",
      senderId: "priya",
      senderName: "Priya Nair",
      content: "Hey! Did you get a chance to look at the RLS policies?",
      createdAt: "09:32",
      isOwn: false,
    },
    {
      id: "m2",
      conversationId: "c1",
      senderId: "me",
      senderName: "You",
      content: "Yep, just pushed the select/insert policies for messages.",
      createdAt: "09:35",
      isOwn: true,
    },
    {
      id: "m3",
      conversationId: "c1",
      senderId: "priya",
      senderName: "Priya Nair",
      content: "Nice. Realtime subscription working on your end?",
      createdAt: "09:38",
      isOwn: false,
    },
    {
      id: "m4",
      conversationId: "c1",
      senderId: "me",
      senderName: "You",
      content: "Testing it now, messages are streaming in instantly.",
      createdAt: "09:40",
      isOwn: true,
    },
    {
      id: "m5",
      conversationId: "c1",
      senderId: "priya",
      senderName: "Priya Nair",
      content: "Amazing, that saves us a websocket server.",
      createdAt: "09:41",
      isOwn: false,
    },
  ],
  c2: [
    {
      id: "m6",
      conversationId: "c2",
      senderId: "omar",
      senderName: "Omar Haddad",
      content: "Dropped the new sidebar mockup in Figma.",
      createdAt: "08:55",
      isOwn: false,
    },
    {
      id: "m7",
      conversationId: "c2",
      senderId: "lin",
      senderName: "Lin Zhou",
      content: "Looks clean, love the icon rail.",
      createdAt: "09:02",
      isOwn: false,
    },
    {
      id: "m8",
      conversationId: "c2",
      senderId: "me",
      senderName: "You",
      content: "Agreed, wiring it up to real data now.",
      createdAt: "09:12",
      isOwn: true,
    },
  ],
  c3: [
    {
      id: "m9",
      conversationId: "c3",
      senderId: "omar",
      senderName: "Omar Haddad",
      content: "Can you review my PR when you get a sec?",
      createdAt: "Yesterday",
      isOwn: false,
    },
  ],
  c4: [
    {
      id: "m10",
      conversationId: "c4",
      senderId: "lin",
      senderName: "Lin Zhou",
      content: "Storage bucket policies are live.",
      createdAt: "Yesterday",
      isOwn: false,
    },
  ],
  c5: [
    {
      id: "m11",
      conversationId: "c5",
      senderId: "sam",
      senderName: "Sam Okafor",
      content: "Launch checklist is looking good, five items left.",
      createdAt: "Mon",
      isOwn: false,
    },
  ],
  c6: [
    {
      id: "m12",
      conversationId: "c6",
      senderId: "sam",
      senderName: "Sam Okafor",
      content: "See you at standup.",
      createdAt: "Mon",
      isOwn: false,
    },
  ],
};

export function lastMessagePreview(conversationId: string): string {
  const list = messagesByConversation[conversationId];
  if (!list || list.length === 0) return "";
  return list[list.length - 1].content;
}
