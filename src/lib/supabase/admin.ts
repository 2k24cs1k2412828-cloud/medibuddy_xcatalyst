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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY CONFIGURATION: SUPABASE_SERVICE_ROLE_KEY is required in production.');
  }

  return createClient<any>(supabaseUrl, serviceRoleKey || "placeholder-service-role-key", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
