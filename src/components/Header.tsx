import Link from "next/link";
import Logo from "./Logo";
import AccountControl from "./AccountControl";
import MobileMenu from "./MobileMenu";

export default function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-4">
      <div className="flex items-center gap-2">
        <Link href="/" aria-label="Light Rider Entropy home">
          <Logo />
        </Link>
      </div>

      <div className="flex items-center gap-1 mr-2">
        <div className="hidden lg:block">
          <AccountControl />
        </div>
        <MobileMenu>
          <AccountControl />
        </MobileMenu>
      </div>
    </header>
  );
}
