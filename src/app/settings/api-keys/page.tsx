import ApiKeyPanel from "@/components/apiKey/ApiKeyPanel";
import SignInRequired from "@/components/auth/SignInRequired";
import InfoBox from "@/components/InfoBox";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";

export const metadata = { title: "API key" };

/**
 * Settings > API key: the account's ONE Light Rider API key, managed here
 * through cloud (lib/billing/cloudBilling.ts apiKeyAccount). It is the same
 * key the other Light Rider platforms use, so a change here applies to all of
 * them immediately. Light Rider Cloud has no API keys page of its own, so this
 * page is where the key is managed for the entropy platform.
 */
export default async function ApiKeyPage() {
  const { isAuthenticated } = await getSession();
  if (!isAuthenticated) return <SignInRequired target="your API key" />;

  return (
    <div className="animate-fade-in-up flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-700">API key</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your Light Rider API key, for drawing entropy from your own code. It is the same key across the
          Light Rider platforms: generate, rotate or revoke it here, and the change applies everywhere at once.
        </p>
      </div>

      <ApiKeyPanel />

      <p className="text-sm text-gray-600">
        Draws made with it are charged to your Light Rider credits at the website price (1 credit per 256 bytes). See
        the{" "}
        <Link href="/developers" className="font-medium text-blue-600 underline hover:text-[var(--brand-primary)]">
          quickstart
        </Link>{" "}
        for copy-paste examples.
      </p>

      <InfoBox>
        This is your account&apos;s full-access key: it can also spend credits on Light Rider Cloud (QPU jobs,
        reservations). Keep it secret, and rotate it if it is ever exposed.
      </InfoBox>
    </div>
  );
}
