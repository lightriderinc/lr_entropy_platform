import { handleSignIn } from "@/app/actions/auth";
import { BiSolidCoin } from "react-icons/bi";
import { MdAccountCircle, MdHistory, MdKey } from "react-icons/md";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarNavItem from "./SidebarNavItem";

/** Secondary-sidebar navigation for /settings routes — also reused inside the
 *  header's account dropdown and the mobile drawer. Groups and labels match
 *  the cloud platform's settings nav. */
export default function SidebarGroupSettings({
  onNavigate,
  isAuthenticated,
}: {
  onNavigate?: () => void;
  isAuthenticated: boolean;
}) {
  return (
    <>
      <SidebarNavGroup label="Settings">
        {isAuthenticated ? (
          <>
            <SidebarNavItem
              name="Account"
              href="/settings/account"
              icon={MdAccountCircle}
              onNavigate={onNavigate}
            />
            <SidebarNavItem
              name="API key"
              href="/settings/api-keys"
              icon={MdKey}
              onNavigate={onNavigate}
            />
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-600 px-2">
            <button
              type="button"
              onClick={() => handleSignIn()}
              className="brand-link cursor-pointer"
            >
              Log in
            </button>{" "}
            to access account settings.
          </p>
        )}
      </SidebarNavGroup>

      {isAuthenticated && (
        <SidebarNavGroup label="Billing & Credits">
          <SidebarNavItem
            name="Manage Credits"
            href="/settings/manage-credits"
            icon={BiSolidCoin}
            onNavigate={onNavigate}
          />
          <SidebarNavItem
            name="Payment & History"
            href="/settings/payment-and-history"
            icon={MdHistory}
            onNavigate={onNavigate}
          />
        </SidebarNavGroup>
      )}
    </>
  );
}
