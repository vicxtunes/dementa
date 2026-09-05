import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Only the quick-solution (chemistry revision) feature has auth — the chat
// app is unauthenticated mock data for now, so it's left alone here.
const PROTECTED_PREFIXES = [
  "/quick-solution/v1/dashboard",
  "/quick-solution/v1/day",
  "/quick-solution/v1/quiz",
  "/quick-solution/v1/teacher",
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/quick-solution/v1/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/quick-solution/v1/:path*"],
};
