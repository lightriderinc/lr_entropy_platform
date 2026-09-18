import { getSession } from "@/lib/auth/session";
import SidebarNavMain from "./SidebarNavMain";

/** Primary rail. Server component — owns the layout box; nav interactivity
 *  lives in the client children (§10.5). */
export default async function Sidebar() {
  const { isAuthenticated } = await getSession();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-100 lg:flex">
      <SidebarNavMain isAuthenticated={isAuthenticated} />
    </aside>
  );
}
