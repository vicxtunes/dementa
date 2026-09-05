# Building a Chat App with Next.js + Supabase

Next.js + Supabase is a strong combo for this — Supabase provides Postgres, realtime, auth, and file storage in one platform, so you can skip building a lot of custom backend plumbing.

## Architecture Overview

- **Next.js** — frontend (App Router recommended) + API routes/server actions for anything needing service-role privileges
- **Supabase Postgres** — stores users, conversations, messages
- **Supabase Realtime** — pushes new messages to subscribed clients over websockets (built on Postgres logical replication, so no separate socket server needed)
- **Supabase Auth** — handles login/signup (email, OAuth, magic links)
- **Supabase Storage** — for image/file attachments

## Data Model

```sql
-- profiles (extends auth.users)
create table profiles (
  id uuid references auth.users primary key,
  username text unique,
  avatar_url text,
  created_at timestamptz default now()
);

-- conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean default false,
  name text, -- for group chats
  created_at timestamptz default now()
);

-- who's in each conversation
create table conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

-- messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references profiles(id),
  content text,
  created_at timestamptz default now()
);
```

## Row Level Security (critical — don't skip this)

Supabase's realtime and client-side queries rely on RLS to enforce who sees what.

```sql
alter table messages enable row level security;

create policy "Users can read messages in their conversations"
on messages for select
using (
  conversation_id in (
    select conversation_id from conversation_participants
    where user_id = auth.uid()
  )
);

create policy "Users can insert messages in their conversations"
on messages for insert
with check (
  conversation_id in (
    select conversation_id from conversation_participants
    where user_id = auth.uid()
  )
);
```

## Realtime Subscription (client-side)

```javascript
useEffect(() => {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [conversationId]);
```

## Sending a Message

```javascript
async function sendMessage(conversationId, content) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content,
  });
}
```

No need to manually push to other clients — the realtime subscription picks up the insert automatically.

## Extra Features Supabase Makes Easy

- **Presence** (online/offline, typing indicators) — use Supabase's Presence API on a channel, separate from `postgres_changes`
- **File attachments** — Supabase Storage buckets with RLS policies on who can upload/read
- **Read receipts** — a `message_reads` join table, or a `last_read_message_id` column per participant

## Structure in Next.js

- Use **Server Components** for initial data fetch (conversation list, message history) — faster first paint, no loading spinner
- Use **Client Components** for the live message view, since you need the websocket subscription
- Use **Server Actions or Route Handlers** for anything requiring the service-role key (e.g., admin moderation)

## Suggested Next Steps

- Scaffold folder structure for the Next.js app
- Set up Supabase clients for both server and client components
- Build a working message thread component