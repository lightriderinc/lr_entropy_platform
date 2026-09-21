import { getSession } from "@/lib/auth/session";
import SignInRequired from "@/components/auth/SignInRequired";

export default async function EntropyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated } = await getSession();

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Get Entropy</h1>
        <p className="mb-6 text-sm text-gray-600">
          Generate certified entropy from quantum and hardware sources.
        </p>
        <SignInRequired target="entropy generation" />
      </div>
    );
  }

  return <>{children}</>;
}