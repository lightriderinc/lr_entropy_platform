import EntropyConsole from "@/components/entropy/EntropyConsole";
import InfoBox from "@/components/InfoBox";

export const metadata = {
  title: "Get Entropy",
};

export default function EntropyPage() {
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
      <EntropyConsole />
    </div>
  );
}
