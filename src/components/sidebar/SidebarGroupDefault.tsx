import { FaDice } from "react-icons/fa";
import { HiMiniSquare3Stack3D } from "react-icons/hi2";
import { MdCode, MdDashboard, MdHistory } from "react-icons/md";
import { PiReceiptFill } from "react-icons/pi";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarNavItem from "./SidebarNavItem";

export default function SidebarGroupDefault({
  onNavigate,
  isAuthenticated,
}: {
  onNavigate?: () => void;
  isAuthenticated: boolean;
}) {
  return (
    <>
      <SidebarNavGroup label="Entropy">
        <SidebarNavItem
          name="Dashboard"
          href="/"
          icon={MdDashboard}
          onNavigate={onNavigate}
        />
        <SidebarNavItem
          name="Get Entropy"
          href="/entropy"
          icon={FaDice}
          onNavigate={onNavigate}
        />
        {isAuthenticated && (
          <>
            <SidebarNavItem
              name="Receipts"
              href="/receipts"
              icon={PiReceiptFill}
              onNavigate={onNavigate}
            />
            <SidebarNavItem
              name="Session History"
              href="/history"
              icon={MdHistory}
              onNavigate={onNavigate}
            />
          </>
        )}
      </SidebarNavGroup>

      <SidebarNavGroup label="Explore">
        <SidebarNavItem
          name="Sources"
          href="/sources"
          icon={HiMiniSquare3Stack3D}
          onNavigate={onNavigate}
        />
        <SidebarNavItem
          name="Developers"
          href="/developers"
          icon={MdCode}
          onNavigate={onNavigate}
        />
      </SidebarNavGroup>
    </>
  );
}
