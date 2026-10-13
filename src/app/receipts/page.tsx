import SignInRequired from "@/components/auth/SignInRequired";
import InfoBox from "@/components/InfoBox";
import ReceiptsBrowser from "@/components/receipts/ReceiptsBrowser";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Receipts" };

/**
 * Receipts: every draw the signed-in user made, with its EMS-signed receipt -
 * kept on our servers, verifiable in the browser, downloadable as JSON. The
 * entropy bytes are never stored.
 */
export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { isAuthenticated } = await getSession();
  if (!isAuthenticated) return <SignInRequired target="your receipts" />;
  const { request } = await searchParams;

  return (
    <div className="animate-fade-in-up flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-700">Receipts</h1>
        <p className="mt-1 text-sm text-gray-600">
          A signed receipt for every draw: which pool and sources served it, its quality checks, and what it cost.
        </p>
      </div>
      <InfoBox>
        Receipts are kept for your account. The entropy bytes themselves are never stored: copy or download them
        when you generate them.
      </InfoBox>
      <ReceiptsBrowser initialRequestId={typeof request === "string" ? request : null} />
    </div>
  );
}
