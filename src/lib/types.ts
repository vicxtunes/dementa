export type Conversation = {
  id: string;
  name: string;
  isGroup: boolean;
  online: boolean;
  unread: number;
  lastMessageAt: string;
  members?: string[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isOwn: boolean;
};
