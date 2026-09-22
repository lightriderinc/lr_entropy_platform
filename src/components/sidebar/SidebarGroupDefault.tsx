import { FaDice } from "react-icons/fa6";
import { MdMenuBook, MdRocketLaunch } from "react-icons/md";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarNavItem from "./SidebarNavItem";

export default function SidebarGroupDefault({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <>
      <SidebarNavGroup label="Entropy">
        <SidebarNavItem
          name="Getting Started"
          href="/"
          icon={MdRocketLaunch}
          onNavigate={onNavigate}
        />
        <SidebarNavItem
          name="Get entropy"
          href="/entropy"
          icon={FaDice}
          onNavigate={onNavigate}
        />
      </SidebarNavGroup>

      <SidebarNavGroup label="Explore">
        <SidebarNavItem
          name="Sources"
          href="/sources"
          icon={MdMenuBook}
          onNavigate={onNavigate}
        />
      </SidebarNavGroup>
    </>
  );
}
