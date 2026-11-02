import EntropyConsole from "@/components/entropy/EntropyConsole";
import HowItWorksSection from "@/components/HowItWorksSection";
import InfoBox from "@/components/InfoBox";
import { getEntropyCatalog } from "@/lib/sources/egress";

export const metadata = {
  title: "Get Entropy",
};

export default function EntropyPage() {
  // Not awaited: the promise streams to the client so the rest of the page
  // renders immediately while the custom-pool picker shows a skeleton.
  const catalogPromise = getEntropyCatalog();

  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-gray-700">Get Entropy</h1>
      <p className="mb-12 text-sm text-gray-600">
        Generate certified entropy from quantum and hardware sources, then copy
        it straight into your workflow.
      </p>

      <HowItWorksSection />
      <div className="mb-8">
        <InfoBox>
          Every drawn byte is health-tested, cryptographically extracted, and
          signed with a verifiable receipt.
        </InfoBox>
      </div>
      <EntropyConsole catalogPromise={catalogPromise} />
    </div>
  );
}
