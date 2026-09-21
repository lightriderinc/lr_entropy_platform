import { handleSignIn, handleSignOut } from "@/app/actions/auth";
import SignIn from "@/app/sign-in";
import { getDisplayName, getSession } from "@/lib/auth/session";
import { resolveAvatarSources } from "@/lib/avatar";
import AccountBadge from "./AccountBadge";

/** Account/auth control, shared by the header and the mobile drawer so both
 *  resolve the same session/avatar data. Signed in: the account badge — a
 *  dropdown (settings nav + sign out) on desktop, a plain link on mobile
 *  since the drawer already surfaces settings navigation of its own. Signed
 *  out: a sign-in trigger. */
export default async function AccountControl({
  dropdown = false,
}: {
  dropdown?: boolean;
}) {
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
    <AccountBadge
      name={displayName ?? email ?? "Account"}
      avatarUrl={src}
      fallbackAvatarUrl={fallbackSrc}
      dropdown={dropdown}
      onSignOut={dropdown ? handleSignOut : undefined}
    />
  );
}
