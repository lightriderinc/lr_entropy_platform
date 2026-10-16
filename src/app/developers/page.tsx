import DevGuide from "@/components/developers/DevGuide";
import { getSession } from "@/lib/auth/session";
import { sourceAliasList } from "@/lib/entropy/modes";

export const metadata = { title: "Developers" };

/** Public quickstart for the developer API. Commands live in lib/developers/snippets.ts. */
export default async function DevelopersPage() {
  const { isAuthenticated } = await getSession();

  return (
    <div className="animate-fade-in-up flex max-w-4xl flex-col gap-4 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-gray-700">Developers</h1>
        <p className="mt-1 text-sm text-gray-600">
          Random bytes from named quantum sources, each with a receipt signed by Light Rider. An alternative source you
          can verify, not a claim that quantum randomness beats a good classical generator.
        </p>
      </div>
      <DevGuide signedIn={Boolean(isAuthenticated)} aliases={sourceAliasList()} />
    </div>
  );
}
