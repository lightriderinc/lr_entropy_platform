"use client";

import ModalShell from "./ModalShell";
import LRButton from "./LRButton";

export default function ConfirmDeleteModal({
  title = "Delete this entry?",
  description = "This action is irreversible. The entropy value and its receipt will be permanently removed.",
  onCancel,
  onConfirm,
}: {
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell title={title} onClose={onCancel} maxWidth="max-w-sm">
      <p className="mt-3 text-sm text-gray-600">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <LRButton type="button" variant="secondary-outline" onClick={onCancel}>
          Cancel
        </LRButton>
        <LRButton type="button" variant="danger" onClick={onConfirm}>
          Delete
        </LRButton>
      </div>
    </ModalShell>
  );
}
