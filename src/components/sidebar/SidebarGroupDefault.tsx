import SidebarNavGroup from "./SidebarNavGroup";
import SidebarNavItem from "./SidebarNavItem";
import { MAIN_NAV } from "./nav.config";

export default function SidebarGroupDefault({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  return (
    <>
      {MAIN_NAV.map((group) => (
        <SidebarNavGroup key={group.label} label={group.label}>
          {group.items.map((item) => (
            <SidebarNavItem key={item.href} {...item} onNavigate={onNavigate} />
          ))}
        </SidebarNavGroup>
      ))}
    </>
  );
}
