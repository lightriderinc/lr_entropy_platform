import SignInRequired from "@/components/auth/SignInRequired";
import { getSession } from "@/lib/auth/session";

/**
 * Get Entropy is signed-in only. Decided here on the server, so the console
 * never renders for a signed-out visitor. (It used to be a client layout that
 * rendered the page first and only swapped in a sign-in prompt once a
 * /api/auth/session fetch came back, which showed the real page for a second
 * or two.) getSession() is cached per request, so this shares the root
 * layout's lookup.
 */
export default async function EntropyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated } = await getSession();
  if (!isAuthenticated) return <SignInRequired target="the entropy console" />;

  return <>{children}</>;
}
