import { getSession } from "@/lib/auth/session";
import SidebarNav from "./SidebarNav";

/** Secondary rail. Rendered only inside SidebarSecondaryGate, so it is always
 *  in a sub-navigated section. Server component (§10.5). */
export default async function SidebarSecondary() {
  const { isAuthenticated } = await getSession();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-100 lg:flex">
      <SidebarNav isAuthenticated={isAuthenticated} />
    </aside>
  );
}
