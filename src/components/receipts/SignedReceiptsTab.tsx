import InfoBox from "@/components/InfoBox";
import Link from "next/link";
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
        Receipts for every entropy request you make.
      </p>
      <div className="mb-4">
        <InfoBox>
          Receipts do NOT include the generated entropy itself. <br />
          Generated entropy is not stored on our servers. Copy your entropy
          output once it is generated, or access entropy from your current
          browser tab&apos;s session from {" "}
          <Link
            href="/receipts?tab=session-history"
            className="font-medium text-blue-600 underline hover:text-[var(--brand-primary)]"
          >
            Session history
          </Link>
          .
        </InfoBox>
      </div>

      <ReceiptsBrowser initialRequestId={initialRequestId} />
    </div>
  );
}
