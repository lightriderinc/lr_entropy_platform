import SignInRequired from "@/components/auth/SignInRequired";
import { getSession } from "@/lib/auth/session";

export default async function EntropyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated } = await getSession();

  if (!isAuthenticated) {
    return <SignInRequired target="entropy generation" />;
  }

  return <>{children}</>;
}