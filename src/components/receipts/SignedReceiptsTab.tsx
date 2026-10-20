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
        A signed receipt for every draw.
      </p>
      <div className="mb-4">
        <InfoBox>
          Receipts are kept for every entropy request you make, and do NOT include the generated entropy itself.
        </InfoBox>
      </div>

      <ReceiptsBrowser initialRequestId={initialRequestId} />
    </div>
  );
}
