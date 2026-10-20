import NavCard from "@/components/NavCard";
import SignInRequired from "@/components/auth/SignInRequired";
import CheckoutReturn from "@/components/billing/CheckoutReturn";
import CreditsSummary, { PURCHASE_CREDITS_HREF } from "@/components/billing/CreditsSummary";
import WalletAutoRefresh from "@/components/billing/WalletAutoRefresh";
import { getSession } from "@/lib/auth/session";
import { LuHandCoins } from "react-icons/lu";
import { PiCoinsFill } from "react-icons/pi";

export const metadata = { title: "Manage Credits" };

/**
 * Manage Credits: the shared Light Rider wallet (the same balance as the Cloud
 * platform) and the way into buying more. Mirrors cloud's
 * /settings/manage-credits. Stripe checkout returns here (via the
 * /settings/credits redirect in next.config.ts), so the return banner lives
 * here too. Gated inline like /settings/account.
 */
export default async function ManageCreditsPage() {
  const { isAuthenticated } = await getSession();
  if (!isAuthenticated) return <SignInRequired target="your credits" />;

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-gray-700">Manage Credits</h1>
      <p className="mb-12 text-sm text-gray-600">
        Manage your Light Rider credit balance or send credits to other Light Rider users.
      </p>

      <WalletAutoRefresh />
      <div className="mb-4 empty:hidden">
        <CheckoutReturn />
      </div>

      <div className="mb-8">
        <CreditsSummary historyLink />
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex lg:w-128">
          <NavCard
            href={PURCHASE_CREDITS_HREF}
            title="Purchase credits"
            desc="Purchase credits to pay for entropy draws."
            icon={PiCoinsFill}
          />
        </div>
        <div className="flex lg:w-128">
          <NavCard
            href="/settings/manage-credits/share"
            title="Share credits"
            desc="Send credits to other Light Rider users."
            icon={LuHandCoins}
          />
        </div>
      </div>
    </div>
  );
}
