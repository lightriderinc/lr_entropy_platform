import { handleSignOut } from "@/app/actions/auth";
import { logtoConfig } from "@/app/logto";
import SignOut from "@/app/sign-out";
import SignInRequired from "@/components/auth/SignInRequired";
import ConnectedAccounts from "@/components/profile/ConnectedAccounts";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { AVATAR_FORM_FIELD, resolveAvatarSources } from "@/lib/avatar";
import {
  getAccountProfile,
  getDisplayName,
  getSession,
  requireLogtoUser,
} from "@/lib/auth/session";
import {
  bindTotp,
  deleteMfaVerification,
  generateTotpSecret,
  getMfaVerifications,
  normalizeSocialIdentities,
  sendEmailCode,
  updateAvatar,
  updateBirthdate,
  updatePassword,
  updatePrimaryEmail,
  verifyEmailCode,
  verifyPassword,
} from "@/lib/logto-account";
import { deleteAvatar, uploadAvatar } from "@/lib/supabase/avatars";
import { getAccessToken } from "@logto/next/server-actions";
import { refresh, revalidatePath } from "next/cache";
import ProfileActions from "./ProfileActions";

/**
 * Account page. Mirrors the cloud platform's /settings/account in structure,
 * typography, and class patterns so all three platforms read as one product.
 *
 * Gated inline rather than by a settings layout: these apps have other public
 * /settings routes, and a layout gate would silently lock those too.
 *
 * No Management API fallback (unlike Cloud): this tenant has no M2M app
 * registered for user lookups, so `hasPassword` and `identities` come
 * straight off the end-user Account API response.
 */
export default async function AccountPage() {
  const { isAuthenticated, userInfo } = await getSession();

  if (!isAuthenticated) {
    return <SignInRequired target="your account settings" />;
  }

  // Resolve the display name via the shared resolver so a brand-new user's full
  // name shows on first sign-in (session claims lag until the first refresh; the
  // Account API reflects it immediately). getAccountProfile is cached, so this
  // and getDisplayName share a single Account API fetch per request.
  const name = await getDisplayName();
  const account = await getAccountProfile();
  const birthdate = account?.profile?.birthdate ?? null;
  const hasPassword = account?.hasPassword ?? true;
  const socialIdentities = normalizeSocialIdentities(account?.identities);

  let mfaEnabled = false;
  try {
    const token = await getAccessToken(logtoConfig);
    if (token) {
      const mfaFactors = await getMfaVerifications(token);
      mfaEnabled = mfaFactors.some((factor) => factor.type === "Totp");
    }
  } catch {
    // Account API not enabled or token unavailable
  }

  const email = userInfo?.email ?? null;
  // Shared resolver — the header's AccountBadge uses the same one, so the two
  // can't disagree about which picture (or which generated fallback) is current.
  const { src: customAvatarUrl, fallbackSrc: generatedAvatarUrl } =
    resolveAvatarSources({
      picture: userInfo?.picture,
      name,
      email,
    });

  async function doVerifyPassword(password: string): Promise<string> {
    "use server";
    const token = await getAccessToken(logtoConfig);
    return verifyPassword(token, password);
  }

  async function doUpdatePassword(
    verificationId: string,
    newPassword: string,
  ): Promise<void> {
    "use server";
    const token = await getAccessToken(logtoConfig);
    await updatePassword(token, verificationId, newPassword);
  }

  async function doSendEmailCode(emailAddr: string): Promise<string> {
    "use server";
    const token = await getAccessToken(logtoConfig);
    return sendEmailCode(token, emailAddr);
  }

  async function doVerifyEmailCode(
    emailAddr: string,
    code: string,
    verificationRecordId: string,
  ): Promise<string> {
    "use server";
    const token = await getAccessToken(logtoConfig);
    return verifyEmailCode(token, emailAddr, code, verificationRecordId);
  }

  /**
   * No Management API means no reliable pre-flight duplicate-email check (see
   * Cloud's equivalent) — the Account API still enforces uniqueness when the
   * change is finalized, so this is a no-op that lets the flow proceed
   * straight to sending a code.
   */
  async function doCheckEmailAvailability(): Promise<void> {
    "use server";
  }

  async function doUpdateEmail(
    currentVerifId: string,
    newVerifId: string,
    emailAddr: string,
  ): Promise<void> {
    "use server";
    const token = await getAccessToken(logtoConfig);
    await updatePrimaryEmail(token, currentVerifId, newVerifId, emailAddr);
  }

  /**
   * Saves a directly-pasted image URL onto the Logto user record. This is the
   * "Image URL" tab of the avatar modal, and it's also the second half of the
   * upload flow — once a cropped file lands in storage, its public URL gets
   * written here the same way.
   */
  async function doUpdateAvatarUrl(avatarUrl: string): Promise<void> {
    "use server";
    const token = await getAccessToken(logtoConfig);
    await updateAvatar(token, avatarUrl);
    // "layout" scope, not the usual "/settings/account": the avatar also
    // renders in the header AccountBadge, which lives in the root layout.
    // Revalidating just this page leaves the header showing the old picture
    // until a full reload.
    revalidatePath("/", "layout");
    refresh();
  }

  /**
   * Uploads the cropped avatar to Supabase Storage, then writes the
   * resulting public URL onto the Logto user the same way the "Image URL"
   * tab does. requireLogtoUser()'s own error ("UNAUTHENTICATED") isn't
   * user-facing, so it's caught and rethrown with a friendlier message here
   * rather than changed at the shared helper.
   */
  async function doUploadAvatar(formData: FormData): Promise<string> {
    "use server";
    let sub: string;
    try {
      ({ sub } = await requireLogtoUser());
    } catch {
      throw new Error("You must be signed in to upload an avatar.");
    }

    const file = formData.get(AVATAR_FORM_FIELD);
    if (!(file instanceof File)) {
      throw new Error("No image was received. Try again.");
    }

    const url = await uploadAvatar(sub, file);
    await doUpdateAvatarUrl(url); // writes to Logto + revalidates
    return url;
  }

  /**
   * Removes the user's avatar: best-effort delete of the stored object, then
   * clears the avatar field on the Logto user so it falls back to the generated
   * default. Storage cleanup failures are logged but don't block clearing the
   * profile — a leftover object is harmless and gets overwritten on next upload.
   */
  async function doRemoveAvatar(): Promise<void> {
    "use server";
    let sub: string;
    try {
      ({ sub } = await requireLogtoUser());
    } catch {
      throw new Error("You must be signed in to remove your avatar.");
    }

    try {
      await deleteAvatar(sub);
    } catch (err) {
      console.error("[account] avatar delete failed:", err);
    }

    // Logto validates `avatar` as a URL, so an empty string is rejected as an
    // invalid body — null is what clears the field.
    const token = await getAccessToken(logtoConfig);
    await updateAvatar(token, null);
    revalidatePath("/", "layout");
    refresh();
  }

  async function doUpdateBirthdate(birthdate: string): Promise<void> {
    "use server";
    const token = await getAccessToken(logtoConfig);
    await updateBirthdate(token, birthdate);
    revalidatePath("/settings/account");
    refresh();
  }

  async function doGenerateTotpSecret(): Promise<string> {
    "use server";
    const token = await getAccessToken(logtoConfig);
    return generateTotpSecret(token);
  }

  async function doBindTotp(
    verificationRecordId: string,
    secret: string,
    code: string,
  ): Promise<void> {
    "use server";
    const token = await getAccessToken(logtoConfig);
    await bindTotp(token, verificationRecordId, secret, code);
    revalidatePath("/settings/account");
  }

  async function doDisableMfa(verificationRecordId: string): Promise<void> {
    "use server";
    const token = await getAccessToken(logtoConfig);
    const factors = await getMfaVerifications(token);
    for (const factor of factors) {
      await deleteMfaVerification(token, verificationRecordId, factor.id);
    }
    revalidatePath("/settings/account");
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-gray-700">Account</h1>
      <p className="mb-12 text-sm text-gray-500">
        Your Light Rider account details.
      </p>

      <div className="flex items-center gap-4 mb-12">
        <ProfileAvatar
          src={customAvatarUrl}
          fallbackSrc={generatedAvatarUrl}
          name={name || email || "Your account"}
          size={64}
          onUpdateAvatarUrl={doUpdateAvatarUrl}
          onUploadAvatar={doUploadAvatar}
          onRemoveAvatar={doRemoveAvatar}
        />
        <div className="min-w-0">
          {name && (
            <p className="text-3xl font-semibold text-gray-800 truncate">
              {name}
            </p>
          )}
        </div>
      </div>

      <ProfileActions
        name={name}
        email={email ?? ""}
        birthdate={birthdate}
        mfaEnabled={mfaEnabled}
        hasPassword={hasPassword}
        connectedAccounts={<ConnectedAccounts identities={socialIdentities} />}
        onVerifyPassword={doVerifyPassword}
        onUpdatePassword={doUpdatePassword}
        onSendEmailCode={doSendEmailCode}
        onVerifyEmailCode={doVerifyEmailCode}
        onCheckEmailAvailable={doCheckEmailAvailability}
        onUpdateEmail={doUpdateEmail}
        onUpdateBirthdate={doUpdateBirthdate}
        onGenerateTotpSecret={doGenerateTotpSecret}
        onBindTotp={doBindTotp}
        onDisableMfa={doDisableMfa}
      />

      <div className="mt-6">
        <SignOut onSignOut={handleSignOut} />
      </div>
    </div>
  );
}
