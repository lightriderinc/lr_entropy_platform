import CreditsSummary from "@/components/billing/CreditsSummary";
import LowCreditsBanner from "@/components/billing/LowCreditsBanner";
import QuickAccess from "@/components/QuickAccess";
import { getSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const { isAuthenticated } = await getSession();

  return (
    <div className="animate-fade-in-up pb-12">
      <div className="mb-12">
        <h1 className="text-2xl font-semibold text-gray-700">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Get started with quantum-backed randomness for your applications.
        </p>
      </div>
      {isAuthenticated && (
        <>
          <LowCreditsBanner />
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-600">Credits</h2>
            <CreditsSummary historyLink />
          </div>
        </>
      )}

      <QuickAccess />
    </div>
  );
}
