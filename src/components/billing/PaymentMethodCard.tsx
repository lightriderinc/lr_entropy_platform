import LRButton from "@/components/ui/LRButton";
import { MdArrowOutward } from "react-icons/md";

/**
 * Payment method card for Payment & History. Same frame as the cloud
 * platform's PaymentMethodCard, but this app can't read or change the card on
 * file: the Stripe customer belongs to the Light Rider Cloud account behind
 * the shared wallet, and the billing API only exposes wallet + checkout. So
 * this points to Cloud's billing portal instead.
 */
export default function PaymentMethodCard({ manageUrl }: { manageUrl: string | null }) {
  return (
    <div className="default-radius border border-gray-50 bg-gray-50 p-4">
      <h2 className="mb-2 font-semibold text-gray-800">Payment method</h2>
      <p className="text-sm text-gray-600">
        Payments are processed by Stripe through your Light Rider account, so your payment method and
        invoices are the same on the Entropy and Cloud platforms.
      </p>
      <div className="flex flex-col gap-3 mt-6">
        {manageUrl ? (
          <>
            <p className="text-sm text-gray-600">
              Update your payment method or view invoices in the billing portal on Light Rider Cloud.
            </p>
            <div className="flex">
              <a href={manageUrl} target="_blank" rel="noopener noreferrer">
                <LRButton variant="secondary" icon={<MdArrowOutward />} iconPosition="right">
                  Manage billing on Cloud
                </LRButton>
              </a>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            To update your payment method or view invoices, open Settings → Payment &amp; History on
            Light Rider Cloud.
          </p>
        )}
      </div>
    </div>
  );
}
