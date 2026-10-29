import SignInRequired from "@/components/auth/SignInRequired";
import ShareCredits from "@/components/billing/ShareCredits";
import TransferHistory from "@/components/billing/TransferHistory";
import WalletAutoRefresh from "@/components/billing/WalletAutoRefresh";
import BackButton from "@/components/ui/BackButton";
import { getSession } from "@/lib/auth/session";
import { transferCapabilities } from "@/lib/billing/transfers";

export const metadata = { title: "Share Credits" };

/**
 * Share Credits: send credits to other Light Rider users and see transfer
 * history. Mirrors cloud's /settings/manage-credits/share. Whether sending is
 * enabled, and where history comes from, is decided in lib/billing/transfers.ts.
 */
export default async function ShareCreditsPage() {
  const { isAuthenticated } = await getSession();
  if (!isAuthenticated) return <SignInRequired target="your credits" />;

  const { canSend } = transferCapabilities();

  return (
    <div className="animate-fade-in-up">
      <BackButton href="/settings/manage-credits" previousPageName="Manage Credits" />
      <h1 className="text-2xl font-semibold text-gray-700">Share Credits</h1>
      <p className="mb-12 text-sm text-gray-600">Send credits to other Light Rider users.</p>

      <WalletAutoRefresh />
      <div className="flex flex-col gap-12">
        <div className="block lg:flex lg:max-w-[700px]">
          <ShareCredits canSend={canSend} />
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-600">Transfer history</h2>
          <TransferHistory />
        </div>
      </div>
    </div>
  );
}
