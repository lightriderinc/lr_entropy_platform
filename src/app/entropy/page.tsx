import EntropyConsole from "@/components/entropy/EntropyConsole";
import InfoBox from "@/components/InfoBox";
import { getSources } from "@/lib/sources/ems";

export const metadata = {
  title: "Get Entropy",
};

export default function EntropyPage() {
  // Not awaited: the promise streams to the client so the rest of the page
  // renders immediately while the source selector shows a skeleton.
  const sourcesPromise = getSources();

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-gray-700">Get Entropy</h1>
      <p className="mb-12 text-sm text-gray-600">
        Generate certified entropy from quantum and hardware sources, then copy
        it straight into your workflow.
      </p>
      <div className="mb-8">
        <InfoBox>
          Every drawn byte is health-tested, cryptographically extracted, and
          signed with a verifiable receipt.
        </InfoBox>
      </div>
      <EntropyConsole sourcesPromise={sourcesPromise} />
    </div>
  );
}
