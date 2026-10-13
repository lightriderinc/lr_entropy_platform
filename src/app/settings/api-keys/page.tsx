import SignInRequired from "@/components/auth/SignInRequired";
import InfoBox from "@/components/InfoBox";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { MdOpenInNew } from "react-icons/md";

export const metadata = { title: "API key" };

/**
 * Settings > API key. There is ONE Light Rider API key per account, managed
 * on Light Rider Cloud (Settings > API Keys); the same key works for the
 * entropy developer API. This page only points there - no key handling here.
 */
export default async function ApiKeyPage() {
  const { isAuthenticated } = await getSession();
  if (!isAuthenticated) return <SignInRequired target="your API key" />;

  let cloudKeys: string | null = null;
  try {
    cloudKeys = `${new URL(process.env.CLOUD_BILLING_URL ?? "").origin}/settings/keys`;
  } catch {
    cloudKeys = null;
  }

  return (
    <div className="animate-fade-in-up flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-700">API key</h1>
        <p className="mt-1 text-sm text-gray-600">
          Draw entropy from your own code with your Light Rider API key: the same key you use on Light Rider Cloud.
        </p>
      </div>

      <div className="default-radius border border-gray-50 bg-gray-50 p-5 text-sm text-gray-600">
        <p>
          Your account has one Light Rider API key. Create, rotate or revoke it on Light Rider Cloud; changes apply here
          at once. Draws made with it are charged to your Light Rider credits at the website price (1 token per 256
          bytes).
        </p>
        {cloudKeys && (
          <a
            href={cloudKeys}
            className="mt-4 inline-flex items-center gap-1.5 default-radius bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-primary-light)]"
          >
            Manage your API key on Light Rider Cloud <MdOpenInNew />
          </a>
        )}
        <p className="mt-4">
          New to the API? See the{" "}
          <Link href="/developers" className="font-medium text-blue-600 underline hover:text-[var(--brand-primary)]">
            quickstart
          </Link>
          .
        </p>
      </div>

      <InfoBox>
        This is your account&apos;s full-access key: it can also spend credits on Light Rider Cloud (QPU jobs,
        reservations). Keep it secret, and rotate it on Light Rider Cloud if it is ever exposed.
      </InfoBox>
    </div>
  );
}
