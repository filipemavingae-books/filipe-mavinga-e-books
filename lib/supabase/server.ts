import { createServerClient } from "@supabase/ssr";
import cookies from "next-cookies";

export function createClient(ctx: any) {
  const cookieStore = cookies(ctx);
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore[name];
        },
      },
    }
  );
}