import { handleSignIn, handleSignOut } from "@/app/actions/auth";
import SignIn from "@/app/sign-in";
import SignOut from "@/app/sign-out";
import { getDisplayName, getSession } from "@/lib/auth/session";
import { resolveAvatarSources } from "@/lib/avatar";
import AccountBadge from "./AccountBadge";

/** Account/auth control, shared by the header and the mobile drawer so both
 *  render the exact same thing. Signed in: the account badge plus sign out.
 *  Signed out: a sign-in trigger. */
export default async function AccountControl() {
  const { isAuthenticated, claims, userInfo } = await getSession();

  if (!isAuthenticated) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  // Prefer the resolved display name: a brand-new user's claims omit `name`
  // until their first token refresh, so falling straight to email avoids the
  // header showing a bare placeholder on first sign-in.
  const displayName = await getDisplayName();
  const email = userInfo?.email ?? (claims?.email as string | undefined);

  // Seeded off the raw display name (not the "Account" placeholder below) so
  // the generated fallback matches the one the account page renders.
  const { src, fallbackSrc } = resolveAvatarSources({
    picture: userInfo?.picture,
    name: displayName,
    email,
  });

  return (
    <div className="flex min-w-0 items-center gap-2">
      <AccountBadge
        name={displayName ?? email ?? "Account"}
        avatarUrl={src}
        fallbackAvatarUrl={fallbackSrc}
      />
      <SignOut onSignOut={handleSignOut} />
    </div>
  );
}
