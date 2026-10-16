import SignInRequired from "@/components/auth/SignInRequired";
import ReceiptsTabs from "@/components/receipts/ReceiptsTabs";
import SessionHistoryTab from "@/components/receipts/SessionHistoryTab";
import SignedReceiptsTab from "@/components/receipts/SignedReceiptsTab";
import { getSession } from "@/lib/auth/session";
import { Suspense } from "react";

export const metadata = { title: "Receipts" };

/**
 * Receipts: the signed receipts kept for the user's account, plus the entropy
 * generated in this browser session.
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
    <div className="animate-fade-in-up flex flex-col">
      <h1 className="mb-8 text-2xl font-semibold text-gray-700">Receipts</h1>
      <Suspense>
        <ReceiptsTabs
          signedReceipts={
            <SignedReceiptsTab
              initialRequestId={typeof request === "string" ? request : null}
            />
          }
          sessionHistory={<SessionHistoryTab />}
        />
      </Suspense>
    </div>
  );
}
