import { FaDice } from "react-icons/fa6";
import { HiMiniSquare3Stack3D } from "react-icons/hi2";
import { MdRocketLaunch } from "react-icons/md";
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
          icon={HiMiniSquare3Stack3D}
          onNavigate={onNavigate}
        />
      </SidebarNavGroup>
    </>
  );
}
