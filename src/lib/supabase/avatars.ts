import { AVATAR_BUCKET, supabase } from "@/lib/supabase/client";

export async function uploadAvatar(logtoUserId: string, file: File): Promise<string> {
  const path = `${logtoUserId}/avatar.webp`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

  if (error) {
    console.error("[avatars] upload failed:", error);
    throw new Error("Could not upload that image. Try again.");
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function deleteAvatar(logtoUserId: string): Promise<void> {
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([`${logtoUserId}/avatar.webp`, `${logtoUserId}/avatar.png`]);

  if (error) {
    console.error("[avatars] delete failed:", error);
    throw new Error("Could not remove the stored avatar.");
  }
}
