import InfoBox from "@/components/InfoBox";
import ReceiptsBrowser from "./ReceiptsBrowser";

/**
 * Every draw the signed-in user made, with its EMS-signed receipt - kept on
 * our servers, verifiable in the browser, downloadable as JSON. The entropy
 * bytes are never stored.
 */
export default function SignedReceiptsTab({
  initialRequestId,
}: {
  initialRequestId: string | null;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">
        A signed receipt for every draw: which pool and sources served it, its
        quality checks, and what it cost.
      </p>
      <div className="mb-4">
        <InfoBox>
          Receipts are kept for your account. The entropy bytes themselves are
          never stored: copy or download them when you generate them.
        </InfoBox>
      </div>

      <ReceiptsBrowser initialRequestId={initialRequestId} />
    </div>
  );
}
