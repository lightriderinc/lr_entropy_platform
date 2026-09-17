import AvatarImage from "@/components/ui/AvatarImage";
import { getAvatarInitials } from "@/lib/avatar";
import Link from "next/link";

type Props = {
  name: string;
  /** The user's own picture, if any. Resolved by the caller via resolveAvatarSources. */
  avatarUrl?: string | null;
  /** Generated placeholder used when `avatarUrl` is missing or won't load. */
  fallbackAvatarUrl?: string | null;
};

/** Signed-in indicator in the header (and mobile drawer). Mirrors the cloud
 *  platform's UserCard in its non-dropdown form, class for class. */
export default function AccountBadge({ name, avatarUrl, fallbackAvatarUrl }: Props) {
  return (
    <Link
      href="/settings/account"
      className="flex items-center gap-3 default-radius pl-2 pr-5 py-1.5 transition-colors hover:bg-gray-100 cursor-pointer"
    >
      <AvatarImage
        src={avatarUrl}
        fallbackSrc={fallbackAvatarUrl}
        initials={getAvatarInitials(name)}
        // Decorative: the user's name is rendered right beside it.
        alt=""
        size={32}
        className="flex-shrink-0"
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-gray-700">
          {name}
        </span>
      </span>
    </Link>
  );
}
