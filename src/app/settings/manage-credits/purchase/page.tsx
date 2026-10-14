import SignInRequired from "@/components/auth/SignInRequired";
import CreditsTopUp from "@/components/billing/CreditsTopUp";
import EntropyPricing from "@/components/billing/EntropyPricing";
import WalletAutoRefresh from "@/components/billing/WalletAutoRefresh";
import BackButton from "@/components/ui/BackButton";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Purchase Credits" };

/** Purchase Credits: top-up plus entropy pricing. Mirrors cloud's /settings/manage-credits/purchase. */
export default async function PurchaseCreditsPage() {
  const { isAuthenticated } = await getSession();
  if (!isAuthenticated) return <SignInRequired target="your credits" />;

  return (
    <div className="animate-fade-in-up">
      <BackButton href="/settings/manage-credits" previousPageName="Manage Credits" />
      <div className="flex flex-col mb-12">
        <h1 className="text-2xl font-semibold text-gray-700">Purchase Credits</h1>
        <p className="text-sm text-gray-600">Credits are consumed when you draw entropy.</p>
      </div>

      <WalletAutoRefresh />
      <div className="flex flex-col gap-12">
        <div className="block lg:flex lg:max-w-[700px]">
          <CreditsTopUp />
        </div>
        <div className="lg:max-w-[700px]">
          <EntropyPricing />
        </div>
      </div>
    </div>
  );
}
