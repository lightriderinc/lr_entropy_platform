"use client";

import { useEffect, useRef, useState } from "react";
import { MdDeleteOutline, MdLink, MdUploadFile } from "react-icons/md";

import { beginProtectedWork } from "@/lib/auth/protected-work";

import AvatarEditor, { type AvatarEditorHandle } from "@/components/profile/AvatarEditor";
import AvatarImage from "@/components/ui/AvatarImage";
import FileDropzone from "@/components/ui/FileDropzone";
import LRButton from "@/components/ui/LRButton";
import ModalShell from "@/components/ui/ModalShell";
import { AVATAR_FORM_FIELD, AVATAR_OUTPUT_TYPE } from "@/lib/avatar";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024;

type Tab = "upload" | "url";

type Props = {
  fallbackSrc?: string | null;
  initials: string;
  maxFileBytes?: number;
  canRemove?: boolean;
  onUploadAvatar?: (formData: FormData) => Promise<string>;
  onUpdateAvatarUrl?: (url: string) => Promise<void>;
  onRemoveAvatar?: () => Promise<void>;
  onSaved?: (url: string) => void;
  onRemoved?: () => void;
  onClose: () => void;
};

export default function EditAvatarModal({
  fallbackSrc,
  initials,
  maxFileBytes = DEFAULT_MAX_FILE_BYTES,
  canRemove = false,
  onUploadAvatar,
  onUpdateAvatarUrl,
  onRemoveAvatar,
  onSaved,
  onRemoved,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>("upload");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const editorRef = useRef<AvatarEditorHandle>(null);

  useEffect(() => beginProtectedWork(), []);

  const [url, setUrl] = useState("");

  function switchTab(next: Tab) {
    setTab(next);
    setError("");
    setConfirmRemove(false);
  }

  async function handleSaveUpload() {
    setError("");
    setLoading(true);
    try {
      const blob = await editorRef.current?.getCroppedBlob();
      if (!blob) throw new Error("Could not read the cropped image. Try again.");

      if (!onUploadAvatar) {
        setSavedUrl(await blobToDataUrl(blob));
        setPreviewOnly(true);
        return;
      }

      const formData = new FormData();
      formData.append(AVATAR_FORM_FIELD, new File([blob], "avatar.webp", { type: AVATAR_OUTPUT_TYPE }));
      const nextUrl = await onUploadAvatar(formData);
      setSavedUrl(nextUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update avatar");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveUrl() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setError("");
    setLoading(true);
    try {
      if (!onUpdateAvatarUrl) {
        setSavedUrl(trimmed);
        setPreviewOnly(true);
        return;
      }
      await onUpdateAvatarUrl(trimmed);
      setSavedUrl(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update avatar");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    if (!onRemoveAvatar) return;
    setError("");
    setLoading(true);
    try {
      await onRemoveAvatar();
      onRemoved?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove avatar");
      setLoading(false);
    }
  }

  function finish() {
    if (savedUrl) onSaved?.(savedUrl);
    onClose();
  }

  const showRemove = canRemove && Boolean(onRemoveAvatar);

  return (
    <ModalShell title="Update avatar" onClose={onClose} maxWidth="max-w-md">
      {savedUrl ? (
        <div className="pt-6 text-center">
          <div className="mb-4 flex justify-center">
            <AvatarImage src={savedUrl} fallbackSrc={fallbackSrc} initials={initials} alt="Updated avatar" size={96} />
          </div>
          <p className="mb-5 text-sm text-gray-700">
            {previewOnly
              ? "Looks good. This is a local preview — it isn't saved to your account yet."
              : "Your avatar has been updated."}
          </p>
          <LRButton variant="secondary" onClick={finish}>Done</LRButton>
        </div>
      ) : (
        <div className="pt-5">
          <div role="tablist" aria-label="Avatar source" className="mb-5 flex gap-1 default-radius bg-gray-50 p-1">
            <TabButton active={tab === "upload"} onClick={() => switchTab("upload")} icon={<MdUploadFile />} label="Upload" />
            <TabButton active={tab === "url"} onClick={() => switchTab("url")} icon={<MdLink />} label="Image URL" />
          </div>

          {tab === "upload" && (
            <>
              {file ? (
                <>
                  <AvatarEditor
                    ref={editorRef}
                    image={file}
                    outputType={AVATAR_OUTPUT_TYPE}
                    onLoadFailure={() => setError("That image could not be opened. Try another file.")}
                  />
                  {error && <p className="mt-4 text-xs text-red-500">{error}</p>}
                  <div className="mt-5 flex gap-2">
                    <LRButton variant="secondary-outline" onClick={() => { setFile(null); setError(""); }} disabled={loading} className="flex-1">
                      Choose another
                    </LRButton>
                    <LRButton variant="primary" onClick={handleSaveUpload} disabled={loading} className="flex-1">
                      {loading ? "Saving…" : "Save avatar"}
                    </LRButton>
                  </div>
                </>
              ) : (
                <>
                  <FileDropzone
                    accept={ACCEPTED_TYPES}
                    maxBytes={maxFileBytes}
                    hint={`PNG, JPG, WEBP or GIF — up to ${Math.round(maxFileBytes / (1024 * 1024))}MB`}
                    onError={setError}
                    onFile={(picked) => { setError(""); setFile(picked); }}
                  />
                  {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
                </>
              )}
            </>
          )}

          {tab === "url" && (
            <>
              <div className="mb-4 flex justify-center">
                <AvatarImage src={url.trim()} fallbackSrc={fallbackSrc} initials={initials} alt="Avatar preview" size={80} />
              </div>

              <label htmlFor="avatar-url" className="mb-1 block text-xs text-gray-500">Avatar URL</label>
              <input
                id="avatar-url"
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !loading) handleSaveUrl(); }}
                autoFocus
                className="mb-1 w-full default-radius px-3 py-2 text-sm"
                placeholder="https://example.com/photo.jpg"
              />
              <p className="mb-4 text-xs text-gray-400">Paste a direct link to a publicly accessible image.</p>

              {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

              <LRButton variant="primary" onClick={handleSaveUrl} disabled={loading || !url.trim()} className="w-full">
                {loading ? "Saving…" : "Save avatar"}
              </LRButton>
            </>
          )}

          {showRemove && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              {confirmRemove ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">Remove your current photo?</p>
                  <div className="flex flex-shrink-0 gap-2">
                    <LRButton variant="secondary-outline" onClick={() => setConfirmRemove(false)} disabled={loading}>Cancel</LRButton>
                    <LRButton variant="danger-outline" onClick={handleRemove} disabled={loading}>{loading ? "Removing…" : "Remove"}</LRButton>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => { setError(""); setConfirmRemove(true); }} className="mx-auto flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors duration-200 hover:text-red-600 cursor-pointer">
                  <MdDeleteOutline className="text-base" />
                  Remove current photo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 default-radius px-3 py-2 text-sm font-medium transition-colors duration-200 ${active ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-700"}`}>
      {icon}
      {label}
    </button>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the cropped image."));
    reader.readAsDataURL(blob);
  });
}
