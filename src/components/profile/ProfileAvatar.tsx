"use client";

import { useState } from "react";
import { MdPhotoCamera } from "react-icons/md";

import EditAvatarModal from "@/components/profile/EditAvatarModal";
import AvatarImage from "@/components/ui/AvatarImage";
import { getAvatarInitials } from "@/lib/avatar";

type Props = {
  src?: string | null;
  fallbackSrc?: string | null;
  name: string;
  size?: number;
  maxFileBytes?: number;
  onUploadAvatar?: (formData: FormData) => Promise<string>;
  onUpdateAvatarUrl?: (url: string) => Promise<void>;
  onRemoveAvatar?: () => Promise<void>;
  className?: string;
};

export default function ProfileAvatar({
  src,
  fallbackSrc,
  name,
  size = 64,
  maxFileBytes,
  onUploadAvatar,
  onUpdateAvatarUrl,
  onRemoveAvatar,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [localSrc, setLocalSrc] = useState<string | null | undefined>(undefined);

  const shownSrc = localSrc !== undefined ? localSrc : (src ?? null);
  const initials = getAvatarInitials(name);
  const canRemove = Boolean(shownSrc);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change avatar"
        title="Change avatar"
        className={`group relative inline-flex flex-shrink-0 cursor-pointer overflow-hidden default-radius focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 ${
          className ?? ""
        }`}
      >
        <AvatarImage src={shownSrc} fallbackSrc={fallbackSrc} initials={initials} alt={`${name} avatar`} size={size} />
        <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-gray-900/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
          <MdPhotoCamera className="text-lg" />
          <span className="text-2xs font-medium tracking-wide uppercase">Change</span>
        </span>
      </button>

      {open && (
        <EditAvatarModal
          fallbackSrc={fallbackSrc}
          initials={initials}
          maxFileBytes={maxFileBytes}
          canRemove={canRemove}
          onUploadAvatar={onUploadAvatar}
          onUpdateAvatarUrl={onUpdateAvatarUrl}
          onRemoveAvatar={onRemoveAvatar}
          onSaved={setLocalSrc}
          onRemoved={() => setLocalSrc(null)}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
