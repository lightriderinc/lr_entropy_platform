import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(
  url || "http://localhost:54321",
  serviceRoleKey || "service_role_placeholder",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export const AVATAR_BUCKET = process.env.SUPABASE_AVATAR_BUCKET || "avatars";
