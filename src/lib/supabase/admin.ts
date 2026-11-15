import { createClient } from "@supabase/supabase-js";

/**
 * Creates a privileged administrative Supabase client using the Service Role Key.
 * STRICT SECURITY WARNING:
 * - This client BYPASSES Row Level Security (RLS).
 * - MUST ONLY be invoked in trusted server-side execution environments (Server Actions, Route Handlers, RPC dispatchers).
 * - NEVER import or reference in client components or client bundles.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

  return createClient<any>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
