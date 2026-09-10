import { MdPerson } from "react-icons/md";

/** Placeholder account/auth control. Swap the button body for a real menu or
 *  auth trigger later — it is intentionally a shared component so the header and
 *  the mobile drawer render the exact same control. */
export default function AccountControl() {
  return (
    <button
      type="button"
      className="flex items-center gap-2 default-radius px-2 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
    >
      <span className="flex h-7 w-7 items-center justify-center default-radius bg-gray-100 text-gray-700">
        <MdPerson />
      </span>
      <span className="hidden sm:inline">Account</span>
    </button>
  );
}
