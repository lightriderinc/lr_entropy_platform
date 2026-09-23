import { FaDice } from "react-icons/fa6";
import { HiMiniSquare3Stack3D } from "react-icons/hi2";
import { MdHistory, MdRocketLaunch } from "react-icons/md";
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
          name="Get Entropy"
          href="/entropy"
          icon={FaDice}
          onNavigate={onNavigate}
        />
        <SidebarNavItem
          name="Session History"
          href="/history"
          icon={MdHistory}
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
