import { CallIcon, ChatIcon, ContactsIcon } from "./icons";

export const NAV_ITEMS = [
  { id: "chats", label: "Chats", icon: ChatIcon },
  { id: "calls", label: "Calls", icon: CallIcon },
  { id: "contacts", label: "Contacts", icon: ContactsIcon },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]["id"];
