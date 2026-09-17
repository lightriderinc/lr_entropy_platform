import EntropyConsole from "@/components/entropy/EntropyConsole";

export const metadata = {
  title: "Get Entropy",
};

export default function EntropyPage() {
  return (
    <div className="animate-fade-in-up">
      <h1 className="text-2xl font-semibold text-gray-700">Get Entropy</h1>
      <p className="mb-6 text-sm text-gray-600">
        Generate certified entropy from quantum and hardware sources, then copy it
        straight into your workflow.
      </p>
      <EntropyConsole />
    </div>
  );
}